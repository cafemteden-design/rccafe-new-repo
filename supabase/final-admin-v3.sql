-- RCC Cafe final Admin V3 compatibility migration.
-- Run after the existing RCC migrations. Safe to run repeatedly.
-- Supabase remains authoritative; Google Sheets is backup/reporting only.

create extension if not exists "pgcrypto";

-- Booking V3 canonical fields. Legacy package columns stay for historical rows.
alter table public.bookings_mirror
  add column if not exists gameplay_duration integer,
  add column if not exists price_per_remote numeric(10,2),
  add column if not exists total_price numeric(10,2),
  add column if not exists slot_end text,
  add column if not exists slot_label text,
  add column if not exists notes text,
  add column if not exists synced_to_sheet_at timestamptz,
  add column if not exists sheet_sync_error text;

update public.bookings_mirror
set gameplay_duration = coalesce(gameplay_duration, package_duration),
    price_per_remote = coalesce(price_per_remote,
      case when coalesce(package_duration, gameplay_duration) = 45 then 45::numeric
           when coalesce(package_duration, gameplay_duration) = 60 then 55::numeric end),
    total_price = coalesce(total_price, package_price,
      price_per_remote * greatest(coalesce(group_size, 1), 1)),
    slot_label = coalesce(slot_label, booking_time)
where gameplay_duration is null
   or price_per_remote is null
   or total_price is null
   or slot_label is null;

alter table public.booking_settings
  add column if not exists online_booking_enabled boolean not null default true,
  add column if not exists gameplay_prices jsonb not null default '{"45":45,"60":55}'::jsonb,
  add column if not exists large_group_message text not null default 'Need more than 8 remotes? Please contact us at cafemteden@gmail.com.',
  add column if not exists gameplay_extension_message text not null default 'Extra gameplay is available in-store only.',
  add column if not exists slots_per_day integer not null default 8;

update public.booking_settings
set capacity_per_slot = 8,
    slot_capacity = 8,
    max_group_size = 8,
    maximum_group_size = 8,
    opening_time = '09:00',
    closing_time = '17:00',
    slot_count = 8,
    slots_per_day = 8,
    slot_duration = 60,
    slot_interval_minutes = 60,
    weekend_enabled = true,
    monday_enabled = true,
    tuesday_enabled = true,
    wednesday_enabled = true,
    thursday_enabled = true,
    friday_enabled = true,
    saturday_enabled = true,
    sunday_enabled = true,
    gameplay_prices = '{"45":45,"60":55}'::jsonb,
    updated_at = now()
where id = 1;

-- New customer booking RPC. It has no package-name dependency and always creates Pending.
create or replace function public.create_booking_request_v3(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_booking_date date,
  p_booking_time text,
  p_gameplay_duration integer,
  p_price_per_remote numeric,
  p_remote_spots integer,
  p_toastie_selection text default null,
  p_drink_selection text default null,
  p_notes text default null,
  p_source text default 'website'
)
returns public.bookings_mirror
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  cfg public.booking_settings;
  created public.bookings_mirror;
  next_number bigint;
  configured_price numeric;
begin
  select * into cfg from public.booking_settings where id = 1;
  if not found or not coalesce(cfg.online_booking_enabled, true) then
    raise exception 'Online booking is currently unavailable';
  end if;
  if length(trim(coalesce(p_customer_name, ''))) < 2 then raise exception 'Customer name is required'; end if;
  if trim(coalesce(p_customer_phone, '')) = '' then raise exception 'Phone is required'; end if;
  if trim(coalesce(p_customer_email, '')) !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'A valid email is required';
  end if;
  if p_booking_date < (now() at time zone 'Pacific/Auckland')::date then raise exception 'Past dates cannot be booked'; end if;
  if not public.is_valid_booking_slot(p_booking_date, p_booking_time) then raise exception 'This booking slot is unavailable'; end if;
  if p_remote_spots < 1 or p_remote_spots > least(coalesce(cfg.max_group_size, 8), coalesce(cfg.capacity_per_slot, 8)) then
    raise exception 'Remote spots must be between 1 and %', least(coalesce(cfg.max_group_size, 8), coalesce(cfg.capacity_per_slot, 8));
  end if;
  if p_gameplay_duration not in (45, 60) then raise exception 'Gameplay duration must be 45 or 60 minutes'; end if;

  configured_price := nullif(cfg.gameplay_prices ->> p_gameplay_duration::text, '')::numeric;
  configured_price := coalesce(configured_price, case when p_gameplay_duration = 45 then 45 else 55 end);
  next_number := nextval('public.rcc_booking_number_seq');

  insert into public.bookings_mirror (
    booking_id, customer_name, customer_email, customer_phone, booking_date, booking_time,
    gameplay_duration, package_duration, price_per_remote, package_price, total_price,
    group_size, toastie_selection, drink_selection, notes, status, payment_status, source,
    package_name, slot_label
  ) values (
    'RCC-' || lpad(next_number::text, 4, '0'), trim(p_customer_name), lower(trim(p_customer_email)),
    trim(p_customer_phone), p_booking_date, trim(p_booking_time), p_gameplay_duration,
    p_gameplay_duration, configured_price, configured_price * p_remote_spots,
    configured_price * p_remote_spots, p_remote_spots,
    nullif(trim(coalesce(p_toastie_selection, '')), ''), nullif(trim(coalesce(p_drink_selection, '')), ''),
    nullif(trim(coalesce(p_notes, '')), ''), 'pending', 'not_required',
    coalesce(nullif(trim(p_source), ''), 'website'), null, trim(p_booking_time)
  ) returning * into created;

  insert into public.activity_logs (action, module, record_id, details)
  values ('Booking created', 'bookings', created.id::text,
    jsonb_build_object('bookingId', created.booking_id, 'status', 'pending', 'remoteSpots', created.group_size));
  return created;
end;
$$;

revoke all on function public.create_booking_request_v3(text,text,text,date,text,integer,numeric,integer,text,text,text,text) from public;
grant execute on function public.create_booking_request_v3(text,text,text,date,text,integer,numeric,integer,text,text,text,text) to anon, authenticated;

-- Atomic status transition. Only Approved rows consume capacity.
create or replace function public.set_booking_status(p_booking_id uuid, p_status text, p_admin_note text default null)
returns public.bookings_mirror
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  booking public.bookings_mirror;
  capacity integer;
  used integer;
  target_status text;
begin
  capacity := 8;
  used := 0;
  target_status := lower(trim(p_status));
  if not public.is_staff() then raise exception 'Not authorised'; end if;
  if target_status not in ('pending', 'approved', 'rejected', 'cancelled') then raise exception 'Unsupported booking status'; end if;
  select * into booking from public.bookings_mirror where id = p_booking_id for update;
  if not found then raise exception 'Booking not found'; end if;

  perform pg_advisory_xact_lock(hashtextextended(booking.booking_date::text || '|' || booking.booking_time, 0));
  if target_status = 'approved' then
    select coalesce(capacity_per_slot, 8) into capacity from public.booking_settings where id = 1;
    select coalesce(sum(group_size), 0)::integer into used
    from public.bookings_mirror
    where booking_date = booking.booking_date and booking_time = booking.booking_time
      and status = 'approved' and id <> booking.id;
    if used + booking.group_size > capacity then
      raise exception 'CAPACITY_EXCEEDED: Only % remotes are available.', greatest(capacity - used, 0);
    end if;
  end if;

  update public.bookings_mirror set
    status = target_status,
    admin_notes = coalesce(nullif(trim(p_admin_note), ''), admin_notes),
    approved_at = case when target_status = 'approved' then now() else approved_at end,
    approved_by = case when target_status = 'approved' then auth.uid() else approved_by end,
    rejected_at = case when target_status = 'rejected' then now() else rejected_at end,
    rejected_by = case when target_status = 'rejected' then auth.uid() else rejected_by end,
    cancelled_at = case when target_status = 'cancelled' then now() else cancelled_at end,
    cancelled_by = case when target_status = 'cancelled' then auth.uid() else cancelled_by end,
    updated_at = now()
  where id = booking.id returning * into booking;

  insert into public.activity_logs (actor_id, action, module, record_id, details)
  values (auth.uid(), 'Booking status changed', 'bookings', booking.id::text,
    jsonb_build_object('bookingId', booking.booking_id, 'status', target_status, 'remoteSpots', booking.group_size));
  return booking;
end;
$$;

revoke all on function public.set_booking_status(uuid,text,text) from public;
grant execute on function public.set_booking_status(uuid,text,text) to authenticated;

create or replace function public.update_booking_admin_v3(
  p_booking_id uuid, p_booking_date date, p_booking_time text, p_remote_spots integer,
  p_gameplay_duration integer, p_price_per_remote numeric, p_toastie_selection text,
  p_drink_selection text, p_notes text, p_admin_notes text, p_payment_status text
)
returns public.bookings_mirror
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  booking public.bookings_mirror;
  updated public.bookings_mirror;
  capacity integer;
  used integer;
  old_lock bigint;
  new_lock bigint;
begin
  capacity := 8;
  used := 0;
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  select * into booking from public.bookings_mirror where id=p_booking_id for update;
  if not found then raise exception 'Booking not found'; end if;
  if p_remote_spots < 1 then raise exception 'At least one remote is required'; end if;
  if p_gameplay_duration not in (45,60) then raise exception 'Gameplay duration must be 45 or 60 minutes'; end if;
  if p_payment_status not in ('not_required','pending','paid','refunded') then raise exception 'Unsupported payment status'; end if;

  old_lock := hashtextextended(booking.booking_date::text || '|' || booking.booking_time, 0);
  new_lock := hashtextextended(p_booking_date::text || '|' || trim(p_booking_time), 0);
  perform pg_advisory_xact_lock(least(old_lock,new_lock));
  if new_lock <> old_lock then perform pg_advisory_xact_lock(greatest(old_lock,new_lock)); end if;

  select coalesce(capacity_per_slot,8) into capacity from public.booking_settings where id=1;
  if p_remote_spots > capacity then raise exception 'Remote spots cannot exceed %', capacity; end if;
  if booking.status='approved' then
    select coalesce(sum(group_size),0)::integer into used from public.bookings_mirror
    where booking_date=p_booking_date and booking_time=trim(p_booking_time)
      and status='approved' and id<>booking.id;
    if used+p_remote_spots>capacity then
      raise exception 'CAPACITY_EXCEEDED: Only % remotes are available.', greatest(capacity-used,0);
    end if;
  end if;

  update public.bookings_mirror set
    booking_date=p_booking_date, booking_time=trim(p_booking_time), slot_label=trim(p_booking_time),
    group_size=p_remote_spots, gameplay_duration=p_gameplay_duration, package_duration=p_gameplay_duration,
    price_per_remote=p_price_per_remote, package_price=p_price_per_remote*p_remote_spots,
    total_price=p_price_per_remote*p_remote_spots,
    toastie_selection=nullif(trim(coalesce(p_toastie_selection,'')),''),
    drink_selection=nullif(trim(coalesce(p_drink_selection,'')),''),
    notes=nullif(trim(coalesce(p_notes,'')),''), admin_notes=nullif(trim(coalesce(p_admin_notes,'')),''),
    payment_status=p_payment_status, updated_at=now()
  where id=booking.id returning * into updated;

  insert into public.activity_logs(actor_id,action,module,record_id,details)
  values(auth.uid(),'Booking updated','bookings',updated.id::text,
    jsonb_build_object('bookingId',updated.booking_id,'remoteSpots',updated.group_size,'status',updated.status));
  return updated;
end;
$$;

revoke all on function public.update_booking_admin_v3(uuid,date,text,integer,integer,numeric,text,text,text,text,text) from public;
grant execute on function public.update_booking_admin_v3(uuid,date,text,integer,integer,numeric,text,text,text,text,text) to authenticated;

-- Rewards V2 identity and notification compatibility. Existing cards/history remain untouched.
alter table public.reward_cards
  add column if not exists lifetime_stamps integer not null default 0,
  add column if not exists rewards_redeemed integer not null default 0,
  add column if not exists notification_enabled boolean not null default true,
  add column if not exists last_visit_date date;

update public.reward_cards
set lifetime_stamps = greatest(lifetime_stamps, total_stamps),
    rewards_redeemed = greatest(rewards_redeemed, cycle_number - 1);

create or replace function public.sync_reward_v2_counters()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  new.lifetime_stamps := greatest(coalesce(new.total_stamps, 0), 0);
  new.rewards_redeemed := greatest(coalesce(new.cycle_number, 1) - 1, 0);
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists sync_reward_v2_counters on public.reward_cards;
create trigger sync_reward_v2_counters before insert or update on public.reward_cards
for each row execute function public.sync_reward_v2_counters();

alter table public.reward_events
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id) on delete set null,
  add column if not exists deletion_note text;

alter table public.reward_notifications
  add column if not exists target_reward_card_id uuid references public.reward_cards(id) on delete cascade,
  add column if not exists audience text not null default 'all',
  add column if not exists notification_type text not null default 'general';

create table if not exists public.reward_notification_reads (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.reward_notifications(id) on delete cascade,
  reward_card_id uuid not null references public.reward_cards(id) on delete cascade,
  read_at timestamptz not null default now(),
  unique (notification_id, reward_card_id)
);

create or replace function public.check_reward_identity(p_email text, p_mobile text)
returns table (duplicate_field text, secure_token uuid)
language sql stable security definer set search_path = public, pg_temp
as $$
  select case
    when lower(rc.email) = lower(trim(coalesce(p_email, ''))) then 'email'
    else 'mobile'
  end, rc.secure_token
  from public.reward_cards rc
  where rc.active and (
    lower(rc.email) = lower(trim(coalesce(p_email, '')))
    or regexp_replace(rc.mobile, '[^0-9]', '', 'g') = regexp_replace(coalesce(p_mobile, ''), '[^0-9]', '', 'g')
  ) limit 1;
$$;

create or replace function public.login_reward_card_by_email(p_email text, p_date_of_birth date)
returns table (id uuid, rcc_card_id text, secure_token uuid, full_name text, current_stamps integer, cycle_number integer, reward_status text)
language sql stable security definer set search_path = public, pg_temp
as $$
  select rc.id, rc.rcc_card_id, rc.secure_token, rc.full_name, rc.current_stamps, rc.cycle_number, rc.reward_status
  from public.reward_cards rc
  where lower(rc.email) = lower(trim(coalesce(p_email, '')))
    and rc.date_of_birth = p_date_of_birth and rc.active and rc.reward_status <> 'blocked'
  limit 1;
$$;

-- Enforce required email and duplicate email/mobile for all new cards without touching old cards.
create or replace function public.register_reward_card(p_full_name text, p_mobile text, p_email text, p_date_of_birth date)
returns table (id uuid, rcc_card_id text, secure_token uuid)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  normalized_name text;
  normalized_mobile text;
  normalized_email text;
  new_card public.reward_cards;
begin
  normalized_name := trim(coalesce(p_full_name, ''));
  normalized_mobile := regexp_replace(coalesce(p_mobile, ''), '[^0-9+]', '', 'g');
  normalized_email := lower(trim(coalesce(p_email, '')));
  if length(normalized_name) < 2 then raise exception 'Full name is required'; end if;
  if length(regexp_replace(normalized_mobile, '\D', '', 'g')) < 7 then raise exception 'A valid mobile number is required'; end if;
  if normalized_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then raise exception 'A valid email address is required'; end if;
  if p_date_of_birth is null or p_date_of_birth > current_date then raise exception 'A valid date of birth is required'; end if;
  if exists (select 1 from public.reward_cards where active and lower(email) = normalized_email) then raise exception 'A reward card already exists for this email address.'; end if;
  if exists (select 1 from public.reward_cards where active and mobile = normalized_mobile) then raise exception 'A reward card already exists for this mobile number.'; end if;

  insert into public.reward_cards (rcc_card_id, full_name, mobile, email, date_of_birth)
  values ('RCC' || nextval('public.reward_card_number_seq'), normalized_name, normalized_mobile, normalized_email, p_date_of_birth)
  returning * into new_card;
  insert into public.customers (full_name, mobile, email, date_of_birth, reward_card_id, customer_type)
  values (normalized_name, normalized_mobile, normalized_email, p_date_of_birth, new_card.id, 'reward_member')
  on conflict (mobile) do update set
    full_name=excluded.full_name, email=excluded.email, date_of_birth=excluded.date_of_birth,
    reward_card_id=excluded.reward_card_id, customer_type='reward_member', updated_at=now();
  insert into public.reward_events (reward_card_id, event_type, cycle_number, note)
  values (new_card.id, 'card_created', new_card.cycle_number, 'Customer reward card created');
  return query select new_card.id, new_card.rcc_card_id, new_card.secure_token;
end;
$$;

revoke all on function public.check_reward_identity(text,text) from public;
revoke all on function public.login_reward_card_by_email(text,date) from public;
grant execute on function public.check_reward_identity(text,text) to anon, authenticated;
grant execute on function public.login_reward_card_by_email(text,date) to anon, authenticated;
grant execute on function public.register_reward_card(text,text,text,date) to anon, authenticated;

create or replace function public.get_reward_card_by_token(p_secure_token uuid)
returns jsonb
language sql stable security definer set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id', rc.id, 'cardId', rc.rcc_card_id, 'token', rc.secure_token,
    'name', rc.full_name, 'phone', rc.mobile, 'email', rc.email,
    'stampCount', rc.current_stamps, 'totalStamps', greatest(rc.total_stamps, rc.lifetime_stamps),
    'totalVisits', rc.total_visits, 'cycle', rc.cycle_number, 'rewardStatus', rc.reward_status,
    'rewardsRedeemed', rc.rewards_redeemed,
    'welcomeGiftUnlocked', rc.welcome_gift_unlocked, 'welcomeGiftRedeemed', rc.welcome_gift_redeemed,
    'notificationEnabled', rc.notification_enabled, 'createdAt', rc.created_at,
    'signupGift', case when rc.welcome_gift_unlocked then (
      select jsonb_build_object('id','welcome-gift','title',rs.signup_gift_title,'description',rs.signup_gift_description,
        'status',case when rc.welcome_gift_redeemed then 'redeemed' else 'unlocked' end)
      from public.reward_settings rs where rs.id = 1 and rs.active
    ) else null end,
    'activeOffers', coalesce((select jsonb_agg(jsonb_build_object(
      'id',ro.id,'title',ro.title,'description',ro.description,'type',ro.offer_type,
      'startDate',ro.start_date,'endDate',ro.end_date) order by ro.priority desc, ro.created_at desc)
      from public.reward_offers ro where ro.active
        and (ro.start_date is null or ro.start_date <= current_date)
        and (ro.end_date is null or ro.end_date >= current_date)), '[]'::jsonb),
    'notifications', coalesce((select jsonb_agg(jsonb_build_object(
      'id',rn.id,'title',rn.title,'message',rn.message,'type',rn.notification_type,
      'createdAt',rn.created_at,'unread',not exists(select 1 from public.reward_notification_reads rr where rr.notification_id=rn.id and rr.reward_card_id=rc.id))
      order by rn.created_at desc)
      from public.reward_notifications rn where rn.active
        and (rn.target_reward_card_id is null or rn.target_reward_card_id = rc.id)
        and (rn.starts_at is null or rn.starts_at <= now())
        and (rn.ends_at is null or rn.ends_at >= now())), '[]'::jsonb),
    'history', coalesce((select jsonb_agg(jsonb_build_object(
      'id',re.id,'type',re.event_type,'label',initcap(replace(re.event_type,'_',' ')),
      'stampChange',re.stamp_change,'cycle',re.cycle_number,'note',re.note,'createdAt',re.created_at)
      order by re.created_at desc)
      from public.reward_events re where re.reward_card_id=rc.id and re.deleted_at is null), '[]'::jsonb)
  )
  from public.reward_cards rc
  where rc.secure_token = p_secure_token and rc.active and rc.reward_status <> 'blocked';
$$;

grant execute on function public.get_reward_card_by_token(uuid) to anon, authenticated;

alter table public.reward_notification_reads enable row level security;
drop policy if exists "active_notifications_public_read" on public.reward_notifications;
create policy "active_notifications_public_read" on public.reward_notifications for select to anon, authenticated
using (
  active and target_reward_card_id is null
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);
drop policy if exists "notification_reads_admin" on public.reward_notification_reads;
create policy "notification_reads_admin" on public.reward_notification_reads for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "notifications_admin_manage_v3" on public.reward_notifications;
create policy "notifications_admin_manage_v3" on public.reward_notifications for all to authenticated
using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.reward_notifications to authenticated;
grant select, insert, update, delete on public.reward_notification_reads to authenticated;

-- Realtime tables. Duplicate publication membership is harmlessly ignored.
do $$ begin
  begin alter publication supabase_realtime add table public.bookings_mirror; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.booking_slot_capacity; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.reward_cards; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.reward_notifications; exception when duplicate_object then null; end;
end $$;
