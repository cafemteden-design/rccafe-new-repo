-- RCC Cafe Supabase backend
-- Complete fresh-project migration. Run from top to bottom in Supabase SQL Editor.
-- Customer DOB login intentionally compares DATE values without password-hashing helpers.

create extension if not exists "pgcrypto";

create sequence if not exists public.reward_card_number_seq start with 1001;
create sequence if not exists public.website_lead_number_seq start with 1001;
create sequence if not exists public.venue_enquiry_number_seq start with 1001;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role text check (role in ('super_admin', 'admin', 'manager', 'staff')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reward_cards (
  id uuid primary key default gen_random_uuid(),
  rcc_card_id text unique not null,
  secure_token uuid unique not null default gen_random_uuid(),
  full_name text not null,
  mobile text,
  email text,
  date_of_birth date,
  current_stamps integer not null default 0 check (current_stamps >= 0),
  total_stamps integer not null default 0 check (total_stamps >= 0),
  total_visits integer not null default 0 check (total_visits >= 0),
  cycle_number integer not null default 1 check (cycle_number > 0),
  welcome_gift_unlocked boolean not null default true,
  welcome_gift_redeemed boolean not null default false,
  reward_status text not null default 'active'
    check (reward_status in ('active', 'unlocked', 'redeemed', 'blocked')),
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reward_events (
  id uuid primary key default gen_random_uuid(),
  reward_card_id uuid not null references public.reward_cards(id) on delete cascade,
  event_type text not null check (
    event_type in (
      'card_created',
      'stamp_added',
      'stamp_removed',
      'reward_unlocked',
      'reward_redeemed',
      'welcome_gift_redeemed',
      'manual_adjustment',
      'note_added'
    )
  ),
  stamp_change integer not null default 0,
  cycle_number integer,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.reward_offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  offer_type text not null default 'general',
  start_date date,
  end_date date,
  active boolean not null default true,
  priority integer not null default 1,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reward_notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.reward_settings (
  id integer primary key default 1,
  stamps_required integer not null default 7 check (stamps_required > 0),
  signup_gift_title text not null default 'Buy 1 Get 1 Toastie',
  signup_gift_description text not null default 'Sign up and unlock your first welcome gift.',
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint single_reward_settings check (id = 1)
);

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  duration_minutes integer check (duration_minutes > 0),
  price numeric(10,2) check (price >= 0),
  description text,
  inclusions jsonb not null default '[]'::jsonb,
  image_url text,
  badge text,
  is_popular boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  description text,
  price numeric(10,2) check (price >= 0),
  image_url text,
  active boolean not null default true,
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.website_leads (
  id uuid primary key default gen_random_uuid(),
  lead_id text unique default ('LEAD' || lpad(nextval('public.website_lead_number_seq')::text, 5, '0')),
  full_name text,
  email text,
  phone text,
  enquiry_type text,
  message text,
  source_page text,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'follow_up', 'converted', 'lost')),
  assigned_to uuid references auth.users(id) on delete set null,
  follow_up_date date,
  notes text,
  converted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.venue_hire_enquiries (
  id uuid primary key default gen_random_uuid(),
  enquiry_id text unique default ('VENUE' || lpad(nextval('public.venue_enquiry_number_seq')::text, 5, '0')),
  full_name text,
  email text,
  phone text,
  event_type text,
  preferred_date date,
  guest_count integer check (guest_count is null or guest_count > 0),
  message text,
  estimated_budget numeric(10,2) check (estimated_budget is null or estimated_budget >= 0),
  status text not null default 'new'
    check (status in ('new', 'contacted', 'follow_up', 'converted', 'lost')),
  assigned_to uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings_mirror (
  id uuid primary key default gen_random_uuid(),
  booking_id text unique,
  customer_name text,
  customer_email text,
  customer_phone text,
  booking_date date,
  booking_time text,
  package_name text,
  package_price numeric(10,2) check (package_price is null or package_price >= 0),
  group_size integer check (group_size is null or group_size > 0),
  toastie_selection text,
  drink_selection text,
  status text not null default 'new'
    check (status in ('new', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  payment_status text not null default 'not_required',
  food_prepared boolean not null default false,
  staff_assigned uuid references auth.users(id) on delete set null,
  admin_notes text,
  source text not null default 'google_sheet',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  mobile text,
  email text,
  date_of_birth date,
  reward_card_id uuid references public.reward_cards(id) on delete set null,
  total_bookings integer not null default 0 check (total_bookings >= 0),
  total_spend numeric(10,2) not null default 0 check (total_spend >= 0),
  last_visit date,
  customer_type text not null default 'new',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_library (
  id uuid primary key default gen_random_uuid(),
  title text,
  file_url text not null,
  file_type text,
  category text,
  alt_text text,
  active boolean not null default true,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.website_sections (
  id uuid primary key default gen_random_uuid(),
  page_key text not null,
  section_key text not null,
  title text,
  subtitle text,
  content jsonb not null default '{}'::jsonb,
  image_url text,
  video_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (page_key, section_key)
);

create table if not exists public.seo_pages (
  id uuid primary key default gen_random_uuid(),
  page_key text unique not null,
  title text,
  description text,
  keywords text,
  og_title text,
  og_description text,
  og_image text,
  canonical text,
  schema_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.email_recipients (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null,
  type text not null default 'admin',
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  module text,
  record_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create unique index if not exists reward_cards_rcc_card_id_idx on public.reward_cards (rcc_card_id);
create unique index if not exists reward_cards_secure_token_idx on public.reward_cards (secure_token);
create index if not exists reward_cards_mobile_idx on public.reward_cards (mobile);
create index if not exists reward_cards_email_idx on public.reward_cards (email);
create unique index if not exists reward_cards_active_mobile_unique_idx
  on public.reward_cards (mobile) where mobile is not null and active;
create index if not exists reward_events_reward_card_id_idx on public.reward_events (reward_card_id);
create index if not exists bookings_mirror_booking_date_idx on public.bookings_mirror (booking_date);
create index if not exists website_leads_status_idx on public.website_leads (status);
create index if not exists venue_hire_enquiries_status_idx on public.venue_hire_enquiries (status);
create index if not exists customers_email_idx on public.customers (email);
create unique index if not exists customers_mobile_unique_idx on public.customers (mobile);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'reward_cards',
    'reward_offers',
    'reward_settings',
    'packages',
    'menu_items',
    'website_leads',
    'venue_hire_enquiries',
    'bookings_mirror',
    'customers',
    'website_sections',
    'seo_pages',
    'settings'
  ]
  loop
    execute format('drop trigger if exists touch_%I_updated_at on public.%I', table_name, table_name);
    execute format(
      'create trigger touch_%I_updated_at before update on public.%I for each row execute function public.touch_updated_at()',
      table_name,
      table_name
    );
  end loop;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, email, active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    new.email,
    true
  )
  on conflict (id) do update
  set email = excluded.email,
      updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and active
      and role in ('super_admin', 'admin', 'manager')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and active
      and role = 'super_admin'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and active
      and role in ('super_admin', 'admin', 'manager', 'staff')
  );
$$;

create or replace function public.register_reward_card(
  p_full_name text,
  p_mobile text,
  p_email text,
  p_date_of_birth date
)
returns table (
  id uuid,
  rcc_card_id text,
  secure_token uuid
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  normalized_name text := trim(coalesce(p_full_name, ''));
  normalized_mobile text := regexp_replace(coalesce(p_mobile, ''), '[^0-9+]', '', 'g');
  normalized_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  new_card public.reward_cards;
begin
  if length(normalized_name) < 2 then
    raise exception 'Full name is required';
  end if;
  if length(regexp_replace(normalized_mobile, '\D', '', 'g')) < 7 then
    raise exception 'A valid mobile number is required';
  end if;
  if p_date_of_birth is null or p_date_of_birth > current_date then
    raise exception 'A valid date of birth is required';
  end if;
  if normalized_email is not null
     and normalized_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'A valid email address is required';
  end if;
  if exists (
    select 1 from public.reward_cards
    where mobile = normalized_mobile and active
  ) then
    raise exception 'A reward card already exists for this mobile number. Please use card login.';
  end if;

  insert into public.reward_cards (
    rcc_card_id,
    full_name,
    mobile,
    email,
    date_of_birth
  )
  values (
    'RCC' || nextval('public.reward_card_number_seq'),
    normalized_name,
    normalized_mobile,
    normalized_email,
    p_date_of_birth
  )
  returning * into new_card;

  insert into public.customers (
    full_name,
    mobile,
    email,
    date_of_birth,
    reward_card_id,
    customer_type
  )
  values (
    normalized_name,
    normalized_mobile,
    normalized_email,
    p_date_of_birth,
    new_card.id,
    'reward_member'
  )
  on conflict (mobile) do update
  set full_name = excluded.full_name,
      email = coalesce(excluded.email, public.customers.email),
      date_of_birth = excluded.date_of_birth,
      reward_card_id = excluded.reward_card_id,
      customer_type = 'reward_member',
      updated_at = now();

  insert into public.reward_events (
    reward_card_id,
    event_type,
    cycle_number,
    note
  )
  values (
    new_card.id,
    'card_created',
    new_card.cycle_number,
    'Customer reward card created'
  );

  return query
  select new_card.id, new_card.rcc_card_id, new_card.secure_token;
end;
$$;

create or replace function public.login_reward_card(
  p_rcc_card_id text,
  p_date_of_birth date
)
returns table (
  id uuid,
  rcc_card_id text,
  secure_token uuid,
  full_name text,
  current_stamps integer,
  cycle_number integer,
  reward_status text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    rc.id,
    rc.rcc_card_id,
    rc.secure_token,
    rc.full_name,
    rc.current_stamps,
    rc.cycle_number,
    rc.reward_status
  from public.reward_cards rc
  where upper(replace(rc.rcc_card_id, '-', '')) =
        upper(replace(trim(coalesce(p_rcc_card_id, '')), '-', ''))
    and rc.date_of_birth = p_date_of_birth
    and rc.active
    and rc.reward_status <> 'blocked'
  limit 1;
$$;

create or replace function public.get_reward_card_by_token(
  p_secure_token uuid
)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id', rc.id,
    'cardId', rc.rcc_card_id,
    'token', rc.secure_token,
    'name', rc.full_name,
    'phone', rc.mobile,
    'email', rc.email,
    'stampCount', rc.current_stamps,
    'totalStamps', rc.total_stamps,
    'totalVisits', rc.total_visits,
    'cycle', rc.cycle_number,
    'rewardStatus', rc.reward_status,
    'welcomeGiftUnlocked', rc.welcome_gift_unlocked,
    'welcomeGiftRedeemed', rc.welcome_gift_redeemed,
    'signupGift', case
      when rc.welcome_gift_unlocked then (
        select jsonb_build_object(
          'id', 'welcome-gift',
          'title', rs.signup_gift_title,
          'description', rs.signup_gift_description,
          'status', case when rc.welcome_gift_redeemed then 'redeemed' else 'unlocked' end
        )
        from public.reward_settings rs
        where rs.id = 1 and rs.active
      )
      else null
    end,
    'createdAt', rc.created_at,
    'activeOffers', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', ro.id,
          'title', ro.title,
          'description', ro.description,
          'type', ro.offer_type,
          'startDate', ro.start_date,
          'endDate', ro.end_date
        )
        order by ro.priority desc, ro.created_at desc
      )
      from public.reward_offers ro
      where ro.active
        and (ro.start_date is null or ro.start_date <= current_date)
        and (ro.end_date is null or ro.end_date >= current_date)
    ), '[]'::jsonb),
    'notifications', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', rn.id,
          'title', rn.title,
          'message', rn.message,
          'createdAt', rn.created_at
        )
        order by rn.created_at desc
      )
      from public.reward_notifications rn
      where rn.active
        and (rn.starts_at is null or rn.starts_at <= now())
        and (rn.ends_at is null or rn.ends_at >= now())
    ), '[]'::jsonb),
    'history', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', re.id,
          'type', re.event_type,
          'label', initcap(replace(re.event_type, '_', ' ')),
          'stampChange', re.stamp_change,
          'cycle', re.cycle_number,
          'note', re.note,
          'createdAt', re.created_at
        )
        order by re.created_at desc
      )
      from public.reward_events re
      where re.reward_card_id = rc.id
    ), '[]'::jsonb)
  )
  from public.reward_cards rc
  where rc.secure_token = p_secure_token
    and rc.active
    and rc.reward_status <> 'blocked';
$$;

create or replace function public.add_reward_stamp(
  p_reward_card_id uuid,
  p_stamp_count integer default 1,
  p_note text default null
)
returns public.reward_cards
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  card public.reward_cards;
  required_stamps integer;
  effective_stamps integer;
begin
  if not public.is_staff() then
    raise exception 'Not authorised';
  end if;
  if p_stamp_count is null or p_stamp_count < 1 or p_stamp_count > 25 then
    raise exception 'Stamp count must be between 1 and 25';
  end if;

  select * into card
  from public.reward_cards
  where id = p_reward_card_id
  for update;

  if not found or not card.active then
    raise exception 'Reward card not found';
  end if;
  if card.reward_status = 'blocked' then
    raise exception 'This reward card is blocked';
  end if;
  if card.reward_status = 'unlocked' then
    raise exception 'The current reward must be redeemed before adding more stamps';
  end if;

  select coalesce(stamps_required, 7)
  into required_stamps
  from public.reward_settings
  where id = 1 and active;

  required_stamps := coalesce(required_stamps, 7);
  effective_stamps := least(p_stamp_count, greatest(required_stamps - card.current_stamps, 0));

  if effective_stamps = 0 then
    raise exception 'No additional stamps can be added';
  end if;

  update public.reward_cards
  set current_stamps = current_stamps + effective_stamps,
      total_stamps = total_stamps + effective_stamps,
      total_visits = total_visits + effective_stamps,
      reward_status = case
        when current_stamps + effective_stamps >= required_stamps then 'unlocked'
        else 'active'
      end
  where id = card.id
  returning * into card;

  insert into public.reward_events (
    reward_card_id,
    event_type,
    stamp_change,
    cycle_number,
    note,
    created_by
  )
  values (
    card.id,
    'stamp_added',
    effective_stamps,
    card.cycle_number,
    p_note,
    auth.uid()
  );

  if card.reward_status = 'unlocked' then
    insert into public.reward_events (
      reward_card_id,
      event_type,
      cycle_number,
      note,
      created_by
    )
    values (
      card.id,
      'reward_unlocked',
      card.cycle_number,
      'Stamp target completed',
      auth.uid()
    );
  end if;

  insert into public.activity_logs (actor_id, action, module, record_id, details)
  values (
    auth.uid(),
    'Reward stamp added',
    'rewards',
    card.id::text,
    jsonb_build_object('stampCount', effective_stamps, 'rccCardId', card.rcc_card_id)
  );

  return card;
end;
$$;

create or replace function public.redeem_reward(
  p_reward_card_id uuid,
  p_note text default null
)
returns public.reward_cards
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  card public.reward_cards;
  completed_cycle integer;
begin
  if not public.is_staff() then
    raise exception 'Not authorised';
  end if;

  select * into card
  from public.reward_cards
  where id = p_reward_card_id
  for update;

  if not found or not card.active then
    raise exception 'Reward card not found';
  end if;
  if card.reward_status <> 'unlocked' then
    raise exception 'Reward is not unlocked';
  end if;

  completed_cycle := card.cycle_number;

  insert into public.reward_events (
    reward_card_id,
    event_type,
    cycle_number,
    note,
    created_by
  )
  values (
    card.id,
    'reward_redeemed',
    completed_cycle,
    coalesce(p_note, 'Reward redeemed'),
    auth.uid()
  );

  update public.reward_cards
  set current_stamps = 0,
      cycle_number = cycle_number + 1,
      reward_status = 'active'
  where id = card.id
  returning * into card;

  insert into public.activity_logs (actor_id, action, module, record_id, details)
  values (
    auth.uid(),
    'Reward redeemed',
    'rewards',
    card.id::text,
    jsonb_build_object('completedCycle', completed_cycle, 'rccCardId', card.rcc_card_id)
  );

  return card;
end;
$$;

create or replace function public.redeem_welcome_gift(
  p_reward_card_id uuid,
  p_note text default null
)
returns public.reward_cards
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  card public.reward_cards;
begin
  if not public.is_staff() then
    raise exception 'Not authorised';
  end if;

  select * into card
  from public.reward_cards
  where id = p_reward_card_id
  for update;

  if not found or not card.active then
    raise exception 'Reward card not found';
  end if;
  if not card.welcome_gift_unlocked then
    raise exception 'Welcome gift is not unlocked';
  end if;
  if card.welcome_gift_redeemed then
    raise exception 'Welcome gift has already been redeemed';
  end if;

  update public.reward_cards
  set welcome_gift_redeemed = true
  where id = card.id
  returning * into card;

  insert into public.reward_events (
    reward_card_id,
    event_type,
    cycle_number,
    note,
    created_by
  )
  values (
    card.id,
    'welcome_gift_redeemed',
    card.cycle_number,
    coalesce(p_note, 'Welcome gift redeemed'),
    auth.uid()
  );

  insert into public.activity_logs (actor_id, action, module, record_id, details)
  values (
    auth.uid(),
    'Welcome gift redeemed',
    'rewards',
    card.id::text,
    jsonb_build_object('rccCardId', card.rcc_card_id)
  );

  return card;
end;
$$;

revoke all on function public.register_reward_card(text, text, text, date) from public;
revoke all on function public.login_reward_card(text, date) from public;
revoke all on function public.get_reward_card_by_token(uuid) from public;
revoke all on function public.add_reward_stamp(uuid, integer, text) from public;
revoke all on function public.redeem_reward(uuid, text) from public;
revoke all on function public.redeem_welcome_gift(uuid, text) from public;

grant execute on function public.register_reward_card(text, text, text, date) to anon, authenticated;
grant execute on function public.login_reward_card(text, date) to anon, authenticated;
grant execute on function public.get_reward_card_by_token(uuid) to anon, authenticated;
grant execute on function public.add_reward_stamp(uuid, integer, text) to authenticated;
grant execute on function public.redeem_reward(uuid, text) to authenticated;
grant execute on function public.redeem_welcome_gift(uuid, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.reward_cards enable row level security;
alter table public.reward_events enable row level security;
alter table public.reward_offers enable row level security;
alter table public.reward_notifications enable row level security;
alter table public.reward_settings enable row level security;
alter table public.packages enable row level security;
alter table public.menu_items enable row level security;
alter table public.website_leads enable row level security;
alter table public.venue_hire_enquiries enable row level security;
alter table public.bookings_mirror enable row level security;
alter table public.customers enable row level security;
alter table public.media_library enable row level security;
alter table public.website_sections enable row level security;
alter table public.seo_pages enable row level security;
alter table public.email_recipients enable row level security;
alter table public.activity_logs enable row level security;
alter table public.settings enable row level security;

drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read"
on public.profiles for select to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_admin_insert" on public.profiles;
create policy "profiles_admin_insert"
on public.profiles for insert to authenticated
with check (public.is_super_admin());

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
on public.profiles for update to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "profiles_super_admin_delete" on public.profiles;
create policy "profiles_super_admin_delete"
on public.profiles for delete to authenticated
using (public.is_super_admin());

drop policy if exists "bookings_staff_read" on public.bookings_mirror;
create policy "bookings_staff_read"
on public.bookings_mirror for select to authenticated
using (public.is_staff());

drop policy if exists "bookings_admin_read" on public.bookings_mirror;
create policy "bookings_admin_read"
on public.bookings_mirror for select to authenticated
using (public.is_admin());

drop policy if exists "bookings_staff_update" on public.bookings_mirror;
create policy "bookings_staff_update"
on public.bookings_mirror for update to authenticated
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "bookings_admin_update" on public.bookings_mirror;
create policy "bookings_admin_update"
on public.bookings_mirror for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "bookings_admin_insert" on public.bookings_mirror;
create policy "bookings_admin_insert"
on public.bookings_mirror for insert to authenticated
with check (public.is_admin());

drop policy if exists "bookings_admin_delete" on public.bookings_mirror;
create policy "bookings_admin_delete"
on public.bookings_mirror for delete to authenticated
using (public.is_admin());

drop policy if exists "customers_staff_read" on public.customers;
create policy "customers_staff_read"
on public.customers for select to authenticated
using (public.is_staff());

drop policy if exists "customers_admin_read" on public.customers;
create policy "customers_admin_read"
on public.customers for select to authenticated
using (public.is_admin());

drop policy if exists "customers_admin_manage" on public.customers;
create policy "customers_admin_manage"
on public.customers for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "reward_cards_staff_read" on public.reward_cards;
create policy "reward_cards_staff_read"
on public.reward_cards for select to authenticated
using (public.is_staff());

drop policy if exists "reward_cards_admin_read" on public.reward_cards;
create policy "reward_cards_admin_read"
on public.reward_cards for select to authenticated
using (public.is_admin());

drop policy if exists "reward_cards_admin_manage" on public.reward_cards;
create policy "reward_cards_admin_manage"
on public.reward_cards for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "reward_events_staff_read" on public.reward_events;
create policy "reward_events_staff_read"
on public.reward_events for select to authenticated
using (public.is_staff());

drop policy if exists "reward_events_admin_delete" on public.reward_events;
create policy "reward_events_admin_delete"
on public.reward_events for delete to authenticated
using (public.is_admin());

drop policy if exists "active_offers_public_read" on public.reward_offers;
create policy "active_offers_public_read"
on public.reward_offers for select to anon, authenticated
using (
  active
  and (start_date is null or start_date <= current_date)
  and (end_date is null or end_date >= current_date)
);

drop policy if exists "offers_admin_read" on public.reward_offers;
create policy "offers_admin_read"
on public.reward_offers for select to authenticated
using (public.is_admin());

drop policy if exists "offers_admin_manage" on public.reward_offers;
create policy "offers_admin_manage"
on public.reward_offers for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "active_notifications_public_read" on public.reward_notifications;
create policy "active_notifications_public_read"
on public.reward_notifications for select to anon, authenticated
using (
  active
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);

drop policy if exists "notifications_admin_manage" on public.reward_notifications;
create policy "notifications_admin_manage"
on public.reward_notifications for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "active_reward_settings_public_read" on public.reward_settings;
create policy "active_reward_settings_public_read"
on public.reward_settings for select to anon, authenticated
using (active);

drop policy if exists "reward_settings_admin_read" on public.reward_settings;
create policy "reward_settings_admin_read"
on public.reward_settings for select to authenticated
using (public.is_admin());

drop policy if exists "reward_settings_admin_manage" on public.reward_settings;
create policy "reward_settings_admin_manage"
on public.reward_settings for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "active_packages_public_read" on public.packages;
create policy "active_packages_public_read"
on public.packages for select to anon, authenticated
using (active);

drop policy if exists "packages_admin_read" on public.packages;
create policy "packages_admin_read"
on public.packages for select to authenticated
using (public.is_admin());

drop policy if exists "packages_admin_manage" on public.packages;
create policy "packages_admin_manage"
on public.packages for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "active_menu_public_read" on public.menu_items;
create policy "active_menu_public_read"
on public.menu_items for select to anon, authenticated
using (active);

drop policy if exists "menu_admin_read" on public.menu_items;
create policy "menu_admin_read"
on public.menu_items for select to authenticated
using (public.is_admin());

drop policy if exists "menu_admin_manage" on public.menu_items;
create policy "menu_admin_manage"
on public.menu_items for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public_lead_insert" on public.website_leads;
create policy "public_lead_insert"
on public.website_leads for insert to anon, authenticated
with check (true);

drop policy if exists "leads_admin_read" on public.website_leads;
create policy "leads_admin_read"
on public.website_leads for select to authenticated
using (public.is_admin());

drop policy if exists "leads_admin_manage" on public.website_leads;
create policy "leads_admin_manage"
on public.website_leads for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public_venue_enquiry_insert" on public.venue_hire_enquiries;
create policy "public_venue_enquiry_insert"
on public.venue_hire_enquiries for insert to anon, authenticated
with check (true);

drop policy if exists "venue_enquiries_admin_read" on public.venue_hire_enquiries;
create policy "venue_enquiries_admin_read"
on public.venue_hire_enquiries for select to authenticated
using (public.is_admin());

drop policy if exists "venue_enquiries_admin_manage" on public.venue_hire_enquiries;
create policy "venue_enquiries_admin_manage"
on public.venue_hire_enquiries for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "media_public_read" on public.media_library;
create policy "media_public_read"
on public.media_library for select to anon, authenticated
using (active);

drop policy if exists "media_admin_read" on public.media_library;
create policy "media_admin_read"
on public.media_library for select to authenticated
using (public.is_admin());

drop policy if exists "media_admin_manage" on public.media_library;
create policy "media_admin_manage"
on public.media_library for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "active_sections_public_read" on public.website_sections;
create policy "active_sections_public_read"
on public.website_sections for select to anon, authenticated
using (active);

drop policy if exists "sections_admin_read" on public.website_sections;
create policy "sections_admin_read"
on public.website_sections for select to authenticated
using (public.is_admin());

drop policy if exists "sections_admin_manage" on public.website_sections;
create policy "sections_admin_manage"
on public.website_sections for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "seo_public_read" on public.seo_pages;
create policy "seo_public_read"
on public.seo_pages for select to anon, authenticated
using (true);

drop policy if exists "seo_admin_read" on public.seo_pages;
create policy "seo_admin_read"
on public.seo_pages for select to authenticated
using (public.is_admin());

drop policy if exists "seo_admin_manage" on public.seo_pages;
create policy "seo_admin_manage"
on public.seo_pages for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "email_recipients_admin_manage" on public.email_recipients;
create policy "email_recipients_admin_manage"
on public.email_recipients for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "activity_admin_read" on public.activity_logs;
create policy "activity_admin_read"
on public.activity_logs for select to authenticated
using (public.is_admin());

drop policy if exists "activity_staff_insert" on public.activity_logs;
create policy "activity_staff_insert"
on public.activity_logs for insert to authenticated
with check (public.is_staff() and (actor_id is null or actor_id = auth.uid()));

drop policy if exists "settings_admin_manage" on public.settings;
create policy "settings_admin_manage"
on public.settings for all to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.reward_settings (
  id,
  stamps_required,
  signup_gift_title,
  signup_gift_description,
  active
)
values (
  1,
  7,
  'Buy 1 Get 1 Toastie',
  'Sign up and unlock your first welcome gift.',
  true
)
on conflict (id) do update
set stamps_required = excluded.stamps_required,
    signup_gift_title = excluded.signup_gift_title,
    signup_gift_description = excluded.signup_gift_description,
    active = excluded.active;

insert into public.reward_offers (
  title,
  description,
  offer_type,
  active,
  priority
)
select
  'Buy 1 Get 1 Toastie',
  'Buy one toastie and receive a second toastie with the RCC welcome offer.',
  'welcome',
  true,
  100
where not exists (
  select 1 from public.reward_offers where title = 'Buy 1 Get 1 Toastie'
);

insert into public.packages (
  name,
  slug,
  duration_minutes,
  price,
  description,
  inclusions,
  badge,
  is_popular,
  active,
  sort_order
)
values
  ('MINI', 'mini', 30, 32, 'Currently unavailable for online booking.', '["Any Toastie","Any Hot Coffee"]'::jsonb, 'Currently Unavailable', false, false, 1),
  ('POWER', 'power', 45, 45, 'The most popular RCC play and cafe package.', '["Any Toastie","Any Hot Coffee"]'::jsonb, 'Most Popular', true, true, 2),
  ('MASTER', 'master', 60, 55, 'The complete one-hour RCC experience.', '["Any Toastie","Any Hot Coffee"]'::jsonb, null, false, true, 3)
on conflict (slug) do update
set name = excluded.name,
    duration_minutes = excluded.duration_minutes,
    price = excluded.price,
    description = excluded.description,
    inclusions = excluded.inclusions,
    badge = excluded.badge,
    is_popular = excluded.is_popular,
    active = excluded.active,
    sort_order = excluded.sort_order;

insert into public.settings (key, value)
values
  ('business', '{"timezone":"Pacific/Auckland","currency":"NZD"}'::jsonb),
  ('rewards', '{"stampsRequired":7,"welcomeGift":"Buy 1 Get 1 Toastie"}'::jsonb)
on conflict (key) do update set value = excluded.value;

insert into storage.buckets (id, name, public)
select 'rcc-media', 'rcc-media', true
where not exists (
  select 1 from storage.buckets where id = 'rcc-media'
);

update storage.buckets
set public = true
where id = 'rcc-media';

drop policy if exists "rcc_media_public_read" on storage.objects;
create policy "rcc_media_public_read"
on storage.objects for select to anon, authenticated
using (bucket_id = 'rcc-media');

drop policy if exists "rcc_media_admin_insert" on storage.objects;
create policy "rcc_media_admin_insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'rcc-media' and public.is_admin());

drop policy if exists "rcc_media_admin_update" on storage.objects;
create policy "rcc_media_admin_update"
on storage.objects for update to authenticated
using (bucket_id = 'rcc-media' and public.is_admin())
with check (bucket_id = 'rcc-media' and public.is_admin());

drop policy if exists "rcc_media_admin_delete" on storage.objects;
create policy "rcc_media_admin_delete"
on storage.objects for delete to authenticated
using (bucket_id = 'rcc-media' and public.is_admin());

-- First Super Admin setup after creating the user in Authentication > Users:
--
-- insert into public.profiles (id, full_name, email, role, active)
-- values ('AUTH_USER_ID_HERE', 'Kunal / Admin', 'EMAIL_HERE', 'super_admin', true)
-- on conflict (id) do update
-- set role = 'super_admin', active = true;
