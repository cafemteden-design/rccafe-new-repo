-- Remote Control Cafe booking workflow upgrade.
-- Safe to run once after the existing Admin V3 / Booking V4 migrations.
-- Supabase remains the source of truth. Google Sheets remains backup/reporting/email logging only.

begin;

alter table public.bookings_mirror
  add column if not exists cancellation_reason text;

alter table public.bookings_mirror
  drop constraint if exists bookings_mirror_cancelled_by_fkey;

alter table public.bookings_mirror
  alter column cancelled_by type text using nullif(cancelled_by::text, '');

alter table public.bookings_mirror
  drop constraint if exists bookings_mirror_status_check;

alter table public.bookings_mirror
  drop constraint if exists bookings_mirror_drink_selection_check;

update public.bookings_mirror
set status = case lower(coalesce(status, ''))
  when 'approved' then 'confirmed'
  when 'confirmed' then 'confirmed'
  when 'pending' then 'confirmed'
  when 'new' then 'confirmed'
  when 'rejected' then 'cancelled'
  when 'cancelled' then 'cancelled'
  when 'canceled' then 'cancelled'
  when 'completed' then 'completed'
  when 'no_show' then 'no_show'
  when 'no show' then 'no_show'
  else 'confirmed'
end,
cancellation_reason = case
  when lower(coalesce(status, '')) = 'rejected' and cancellation_reason is null
    then 'Migrated from rejected status during automatic-confirmation upgrade.'
  else cancellation_reason
end,
cancelled_at = case
  when lower(coalesce(status, '')) = 'rejected' and cancelled_at is null
    then now()
  else cancelled_at
end,
cancelled_by = case
  when lower(coalesce(status, '')) = 'rejected' and nullif(cancelled_by, '') is null
    then 'admin'
  else cancelled_by
end;

update public.bookings_mirror
set drink_selection = case
  when lower(trim(coalesce(drink_selection, ''))) in ('any black', 'black', 'long black', 'americano', 'short black', 'espresso') then 'Any Black'
  when lower(trim(coalesce(drink_selection, ''))) in ('flat white / latte', 'flat white', 'latte') then 'Flat White / Latte'
  when lower(trim(coalesce(drink_selection, ''))) in ('hot choco / cappuccino', 'hot chocolate', 'hot choco') then 'Hot Choco'
  when lower(trim(coalesce(drink_selection, ''))) = 'cappuccino' then 'Cappuccino'
  when lower(trim(coalesce(drink_selection, ''))) = 'fluffy' then 'Fluffy'
  when lower(trim(coalesce(drink_selection, ''))) = 'coffee' then 'Any Black'
  when trim(coalesce(drink_selection, '')) = '' then drink_selection
  else 'Any Black'
end;

alter table public.bookings_mirror
  alter column status set default 'confirmed',
  add constraint bookings_mirror_status_check
    check (status in ('confirmed', 'cancelled', 'completed', 'no_show')),
  add constraint bookings_mirror_drink_selection_check
    check (drink_selection is null or drink_selection in ('Any Black', 'Flat White / Latte', 'Hot Choco', 'Cappuccino', 'Fluffy'));

create index if not exists bookings_confirmed_capacity_idx
on public.bookings_mirror (booking_date, booking_time, status)
where status = 'confirmed';

create index if not exists bookings_status_date_idx
on public.bookings_mirror (status, booking_date);

create index if not exists bookings_booking_id_idx
on public.bookings_mirror (booking_id);

create or replace function public.refresh_booking_slot_capacity(
  p_booking_date date,
  p_slot_time text
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  used integer;
begin
  select coalesce(sum(group_size), 0)::integer into used
  from public.bookings_mirror
  where booking_date = p_booking_date
    and booking_time = p_slot_time
    and status = 'confirmed';

  insert into public.booking_slot_capacity (booking_date, slot_time, approved_spots, updated_at)
  values (p_booking_date, p_slot_time, used, now())
  on conflict (booking_date, slot_time) do update
  set approved_spots = excluded.approved_spots,
      updated_at = now();

  return used;
end;
$$;

drop function if exists public.create_booking_request_v4(text,text,text,date,text,integer,numeric,integer,text,text,text,text,jsonb,jsonb);

create or replace function public.create_booking_request_v4(
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
  p_source text default 'website-v4',
  p_business_hours_snapshot jsonb default '{}'::jsonb,
  p_per_remote_selections jsonb default '[]'::jsonb,
  p_booking_reference text default null
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
  selections jsonb := coalesce(p_per_remote_selections, '[]'::jsonb);
  first_selection jsonb;
  hours_snapshot jsonb;
  capacity integer;
  used integer;
  normalized_drink text;
begin
  select * into cfg from public.booking_settings where id = 1;
  if not found or not coalesce(cfg.online_booking_enabled, true) then raise exception 'Online booking is currently unavailable'; end if;
  if length(trim(coalesce(p_customer_name, ''))) < 2 then raise exception 'Customer name is required'; end if;
  if trim(coalesce(p_customer_phone, '')) = '' then raise exception 'Phone is required'; end if;
  if trim(coalesce(p_customer_email, '')) !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then raise exception 'A valid email is required'; end if;
  if p_booking_date < (now() at time zone 'Pacific/Auckland')::date then raise exception 'Past dates cannot be booked'; end if;
  if not public.is_valid_booking_slot(p_booking_date, p_booking_time) then raise exception 'This booking slot is unavailable'; end if;
  if p_remote_spots < 1 or p_remote_spots > least(coalesce(cfg.max_group_size, 8), coalesce(cfg.capacity_per_slot, 8)) then
    raise exception 'Remote spots must be between 1 and %', least(coalesce(cfg.max_group_size, 8), coalesce(cfg.capacity_per_slot, 8));
  end if;
  if p_gameplay_duration not in (45, 60) then raise exception 'Gameplay duration must be 45 or 60 minutes'; end if;
  if jsonb_typeof(selections) <> 'array' or jsonb_array_length(selections) <> p_remote_spots then
    raise exception 'One toastie and one drink selection is required for every remote';
  end if;
  if exists (select 1 from jsonb_array_elements(selections) item where trim(coalesce(item ->> 'toastie', '')) = '') then
    raise exception 'Every remote requires a toastie selection';
  end if;
  if exists (select 1 from jsonb_array_elements(selections) item where coalesce(item ->> 'coffee', item ->> 'drink') not in ('Any Black', 'Flat White / Latte', 'Hot Choco', 'Cappuccino', 'Fluffy')) then
    raise exception 'Every remote requires a valid RCC coffee choice';
  end if;

  first_selection := selections -> 0;
  normalized_drink := coalesce(nullif(trim(coalesce(p_drink_selection, '')), ''), first_selection ->> 'coffee', first_selection ->> 'drink');
  if normalized_drink not in ('Any Black', 'Flat White / Latte', 'Hot Choco', 'Cappuccino', 'Fluffy') then
    raise exception 'Drink selection must be a valid RCC coffee choice';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_booking_date::text || '|' || trim(p_booking_time), 0));
  capacity := coalesce(cfg.capacity_per_slot, 8);
  select coalesce(sum(group_size), 0)::integer into used
  from public.bookings_mirror
  where booking_date = p_booking_date
    and booking_time = trim(p_booking_time)
    and status = 'confirmed';
  if used + p_remote_spots > capacity then
    raise exception 'CAPACITY_EXCEEDED: Only % remotes are available.', greatest(capacity - used, 0);
  end if;

  configured_price := nullif(cfg.gameplay_prices ->> p_gameplay_duration::text, '')::numeric;
  configured_price := coalesce(configured_price, case when p_gameplay_duration = 45 then 45 else 55 end);
  hours_snapshot := case when p_business_hours_snapshot = '{}'::jsonb then jsonb_build_object(
    'day', trim(to_char(p_booking_date, 'FMDay')),
    'open', cfg.business_hours -> lower(trim(to_char(p_booking_date, 'FMDay'))) ->> 'open',
    'close', cfg.business_hours -> lower(trim(to_char(p_booking_date, 'FMDay'))) ->> 'close',
    'timezone', 'Pacific/Auckland'
  ) else p_business_hours_snapshot end;
  next_number := nextval('public.rcc_booking_number_seq');

  insert into public.bookings_mirror (
    booking_id, customer_name, customer_email, customer_phone, booking_date, booking_time,
    gameplay_duration, package_duration, price_per_remote, package_price, total_price,
    group_size, toastie_selection, drink_selection, food_items, per_remote_selections,
    business_hours_snapshot, notes, status, payment_status, source, package_name, slot_label
  ) values (
    coalesce(nullif(trim(p_booking_reference), ''), 'RCC-' || lpad(next_number::text, 4, '0')), trim(p_customer_name), lower(trim(p_customer_email)),
    trim(p_customer_phone), p_booking_date, trim(p_booking_time), p_gameplay_duration,
    p_gameplay_duration, configured_price, configured_price * p_remote_spots,
    configured_price * p_remote_spots, p_remote_spots,
    coalesce(nullif(trim(coalesce(p_toastie_selection, '')), ''), nullif(trim(first_selection ->> 'toastie'), '')),
    normalized_drink,
    selections, selections, hours_snapshot, nullif(trim(coalesce(p_notes, '')), ''),
    'confirmed', 'not_required', coalesce(nullif(trim(p_source), ''), 'website-v4'), null, trim(p_booking_time)
  ) returning * into created;

  insert into public.activity_logs (action, module, record_id, details)
  values ('Booking created and confirmed', 'bookings', created.id::text,
    jsonb_build_object('bookingId', created.booking_id, 'status', 'confirmed', 'remoteSpots', created.group_size, 'foodRows', jsonb_array_length(selections)));

  return created;
end;
$$;

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
begin
  return public.create_booking_request_v4(
    p_customer_name, p_customer_email, p_customer_phone, p_booking_date, p_booking_time,
    p_gameplay_duration, p_price_per_remote, p_remote_spots, p_toastie_selection,
    p_drink_selection, p_notes, coalesce(nullif(trim(p_source), ''), 'website-v3'),
    '{}'::jsonb,
    (
      select jsonb_agg(jsonb_build_object('remote', index, 'toastie', p_toastie_selection, 'coffee', p_drink_selection))
      from generate_series(1, p_remote_spots) as series(index)
    )
  );
end;
$$;

create or replace function public.set_booking_status(p_booking_id uuid, p_status text, p_admin_note text default null)
returns public.bookings_mirror
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  booking public.bookings_mirror;
  target_status text := lower(trim(p_status));
begin
  if not public.is_staff() then raise exception 'Not authorised'; end if;
  if target_status not in ('confirmed', 'cancelled', 'completed', 'no_show') then raise exception 'Unsupported booking status'; end if;

  select * into booking from public.bookings_mirror where id = p_booking_id for update;
  if not found then raise exception 'Booking not found'; end if;
  if booking.status = 'cancelled' and target_status <> 'cancelled' then
    raise exception 'Cancelled bookings cannot be restored by this action';
  end if;
  if target_status = 'confirmed' and booking.status <> 'confirmed' then
    raise exception 'Use a separate restore feature to return a booking to confirmed';
  end if;

  update public.bookings_mirror
  set status = target_status,
      admin_notes = coalesce(nullif(trim(p_admin_note), ''), admin_notes),
      updated_at = now()
  where id = booking.id
  returning * into booking;

  insert into public.activity_logs (actor_id, action, module, record_id, details)
  values (auth.uid(), 'Booking status changed', 'bookings', booking.id::text,
    jsonb_build_object('bookingId', booking.booking_id, 'status', target_status, 'remoteSpots', booking.group_size));

  return booking;
end;
$$;

create or replace function public.cancel_confirmed_booking(
  p_booking_id uuid,
  p_cancellation_reason text default null
)
returns public.bookings_mirror
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  booking public.bookings_mirror;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;

  select * into booking
  from public.bookings_mirror
  where id = p_booking_id
  for update;

  if not found then raise exception 'Booking not found'; end if;
  if booking.status = 'cancelled' then raise exception 'Booking is already cancelled'; end if;
  if booking.status <> 'confirmed' then raise exception 'Only confirmed bookings can be cancelled'; end if;

  update public.bookings_mirror
  set status = 'cancelled',
      cancelled_at = now(),
      cancellation_reason = nullif(trim(coalesce(p_cancellation_reason, '')), ''),
      cancelled_by = 'admin',
      updated_at = now()
  where id = booking.id
  returning * into booking;

  insert into public.activity_logs (actor_id, action, module, record_id, details)
  values (auth.uid(), 'Booking cancelled', 'bookings', booking.id::text,
    jsonb_build_object('bookingId', booking.booking_id, 'reason', booking.cancellation_reason));

  return booking;
end;
$$;

create or replace function public.update_booking_admin_v4(
  p_booking_id uuid,
  p_booking_date date,
  p_booking_time text,
  p_remote_spots integer,
  p_gameplay_duration integer,
  p_price_per_remote numeric,
  p_toastie_selection text,
  p_drink_selection text,
  p_notes text,
  p_admin_notes text,
  p_payment_status text,
  p_per_remote_selections jsonb default '[]'::jsonb,
  p_business_hours_snapshot jsonb default null
)
returns public.bookings_mirror
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  booking public.bookings_mirror;
  updated public.bookings_mirror;
  selections jsonb := coalesce(p_per_remote_selections, '[]'::jsonb);
  capacity integer;
  used integer;
  old_lock bigint;
  new_lock bigint;
  normalized_drink text;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  select * into booking from public.bookings_mirror where id = p_booking_id for update;
  if not found then raise exception 'Booking not found'; end if;
  if p_remote_spots < 1 then raise exception 'At least one remote is required'; end if;
  if p_gameplay_duration not in (45, 60) then raise exception 'Gameplay duration must be 45 or 60 minutes'; end if;
  if p_payment_status not in ('not_required', 'pending', 'paid', 'refunded') then raise exception 'Unsupported payment status'; end if;
  if jsonb_typeof(selections) <> 'array' or jsonb_array_length(selections) <> p_remote_spots then
    raise exception 'One toastie and one drink selection is required for every remote';
  end if;
  if exists (select 1 from jsonb_array_elements(selections) item where trim(coalesce(item ->> 'toastie', '')) = '') then
    raise exception 'Every remote requires a toastie selection';
  end if;
  if exists (select 1 from jsonb_array_elements(selections) item where coalesce(item ->> 'coffee', item ->> 'drink') not in ('Any Black', 'Flat White / Latte', 'Hot Choco', 'Cappuccino', 'Fluffy')) then
    raise exception 'Every remote requires a valid RCC coffee choice';
  end if;

  normalized_drink := coalesce(nullif(trim(coalesce(p_drink_selection, '')), ''), selections -> 0 ->> 'coffee', selections -> 0 ->> 'drink');
  if normalized_drink not in ('Any Black', 'Flat White / Latte', 'Hot Choco', 'Cappuccino', 'Fluffy') then raise exception 'Drink selection must be a valid RCC coffee choice'; end if;

  old_lock := hashtextextended(booking.booking_date::text || '|' || booking.booking_time, 0);
  new_lock := hashtextextended(p_booking_date::text || '|' || trim(p_booking_time), 0);
  perform pg_advisory_xact_lock(least(old_lock, new_lock));
  if new_lock <> old_lock then perform pg_advisory_xact_lock(greatest(old_lock, new_lock)); end if;

  select coalesce(capacity_per_slot, 8) into capacity from public.booking_settings where id = 1;
  if p_remote_spots > capacity then raise exception 'Remote spots cannot exceed %', capacity; end if;
  if booking.status = 'confirmed' then
    select coalesce(sum(group_size), 0)::integer into used
    from public.bookings_mirror
    where booking_date = p_booking_date
      and booking_time = trim(p_booking_time)
      and status = 'confirmed'
      and id <> booking.id;
    if used + p_remote_spots > capacity then
      raise exception 'CAPACITY_EXCEEDED: Only % remotes are available.', greatest(capacity - used, 0);
    end if;
  end if;

  update public.bookings_mirror
  set booking_date = p_booking_date,
      booking_time = trim(p_booking_time),
      slot_label = trim(p_booking_time),
      group_size = p_remote_spots,
      gameplay_duration = p_gameplay_duration,
      package_duration = p_gameplay_duration,
      price_per_remote = p_price_per_remote,
      package_price = p_price_per_remote * p_remote_spots,
      total_price = p_price_per_remote * p_remote_spots,
      toastie_selection = coalesce(nullif(trim(coalesce(p_toastie_selection, '')), ''), selections -> 0 ->> 'toastie'),
      drink_selection = normalized_drink,
      notes = nullif(trim(coalesce(p_notes, '')), ''),
      admin_notes = nullif(trim(coalesce(p_admin_notes, '')), ''),
      payment_status = p_payment_status,
      per_remote_selections = selections,
      food_items = selections,
      business_hours_snapshot = coalesce(p_business_hours_snapshot, business_hours_snapshot),
      updated_at = now()
  where id = booking.id
  returning * into updated;

  insert into public.activity_logs(actor_id, action, module, record_id, details)
  values(auth.uid(), 'Booking updated', 'bookings', updated.id::text,
    jsonb_build_object('bookingId', updated.booking_id, 'remoteSpots', updated.group_size, 'status', updated.status));

  return updated;
end;
$$;

create or replace function public.get_slot_availability_v3(p_booking_date date, p_booking_time text)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'capacity', coalesce(bs.capacity_per_slot, 8),
    'usedSpots', coalesce(sum(b.group_size) filter(where b.status = 'confirmed'), 0),
    'remainingSpots', greatest(coalesce(bs.capacity_per_slot, 8) - coalesce(sum(b.group_size) filter(where b.status = 'confirmed'), 0), 0),
    'fullyBooked', coalesce(sum(b.group_size) filter(where b.status = 'confirmed'), 0) >= coalesce(bs.capacity_per_slot, 8)
  )
  from public.booking_settings bs
  left join public.bookings_mirror b on b.booking_date = p_booking_date and b.booking_time = p_booking_time
  where bs.id = 1
  group by bs.capacity_per_slot;
$$;

create or replace function public.get_admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  today_nz date;
begin
  today_nz := (now() at time zone 'Pacific/Auckland')::date;
  if not public.is_staff() then raise exception 'Not authorised'; end if;
  return jsonb_build_object(
    'todayBookings', (select count(*) from public.bookings_mirror where booking_date = today_nz),
    'confirmedBookings', (select count(*) from public.bookings_mirror where status = 'confirmed'),
    'cancelledBookings', (select count(*) from public.bookings_mirror where status = 'cancelled'),
    'completedBookings', (select count(*) from public.bookings_mirror where status = 'completed'),
    'noShowBookings', (select count(*) from public.bookings_mirror where status = 'no_show'),
    'todayRevenue', (select coalesce(sum(total_price), 0) from public.bookings_mirror where booking_date = today_nz and status in ('confirmed', 'completed')),
    'remoteSpotsBooked', (select coalesce(sum(group_size), 0) from public.bookings_mirror where booking_date = today_nz and status = 'confirmed'),
    'rewardCards', (select count(*) from public.reward_cards),
    'stampsToday', (select coalesce(sum(stamp_change), 0) from public.reward_events where event_type = 'stamp_added' and deleted_at is null and (created_at at time zone 'Pacific/Auckland')::date = today_nz),
    'rewardsRedeemed', (select count(*) from public.reward_events where event_type = 'reward_redeemed' and deleted_at is null),
    'newLeads', (select count(*) from public.website_leads where status = 'new'),
    'failedSyncs', (select count(*) from public.bookings_mirror where sheet_sync_error is not null),
    'systemAlerts', (select count(*) from public.activity_logs where created_at > now() - interval '24 hours' and lower(action) like '%fail%')
  );
end;
$$;

create or replace function public.record_booking_sheet_sync_v3(
  p_booking_id uuid,
  p_public_booking_id text,
  p_success boolean,
  p_message text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.bookings_mirror
  set synced_to_sheet_at = case when p_success then now() else null end,
      sheet_sync_error = case when p_success then null else left(coalesce(p_message, 'Google Sheet sync failed.'), 500) end,
      updated_at = now()
  where id = p_booking_id
    and booking_id = p_public_booking_id
    and created_at >= now() - interval '15 minutes';
end;
$$;

insert into public.booking_slot_capacity (booking_date, slot_time, approved_spots, updated_at)
select booking_date, booking_time, coalesce(sum(group_size), 0)::integer, now()
from public.bookings_mirror
where status = 'confirmed'
  and booking_date is not null
  and booking_time is not null
group by booking_date, booking_time
on conflict (booking_date, slot_time) do update
set approved_spots = excluded.approved_spots,
    updated_at = now();

revoke all on function public.create_booking_request_v4(text,text,text,date,text,integer,numeric,integer,text,text,text,text,jsonb,jsonb,text) from public;
revoke all on function public.create_booking_request_v3(text,text,text,date,text,integer,numeric,integer,text,text,text,text) from public;
revoke all on function public.set_booking_status(uuid,text,text) from public;
revoke all on function public.cancel_confirmed_booking(uuid,text) from public;
revoke all on function public.update_booking_admin_v4(uuid,date,text,integer,integer,numeric,text,text,text,text,text,jsonb,jsonb) from public;
revoke all on function public.get_slot_availability_v3(date,text) from public;
revoke all on function public.record_booking_sheet_sync_v3(uuid,text,boolean,text) from public;

grant execute on function public.create_booking_request_v4(text,text,text,date,text,integer,numeric,integer,text,text,text,text,jsonb,jsonb,text) to anon, authenticated;
grant execute on function public.create_booking_request_v3(text,text,text,date,text,integer,numeric,integer,text,text,text,text) to anon, authenticated;
grant execute on function public.set_booking_status(uuid,text,text) to authenticated;
grant execute on function public.cancel_confirmed_booking(uuid,text) to authenticated;
grant execute on function public.update_booking_admin_v4(uuid,date,text,integer,integer,numeric,text,text,text,text,text,jsonb,jsonb) to authenticated;
grant execute on function public.get_slot_availability_v3(date,text) to anon, authenticated;
grant execute on function public.record_booking_sheet_sync_v3(uuid,text,boolean,text) to anon, authenticated;

commit;
