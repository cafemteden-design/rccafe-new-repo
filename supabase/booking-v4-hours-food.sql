-- RCC Cafe Booking V4: official day-wise hours and per-remote food selections.
-- Run after final-admin-v3.sql and admin-panel-v3-phase1.sql.
-- Non-destructive: existing bookings and legacy toastie/drink columns are preserved.

alter table public.booking_settings
  add column if not exists business_hours jsonb not null default '{
    "monday":{"open":"09:00","close":"16:00"},
    "tuesday":{"open":"09:00","close":"16:00"},
    "wednesday":{"open":"09:00","close":"17:00"},
    "thursday":{"open":"09:00","close":"17:00"},
    "friday":{"open":"09:00","close":"17:00"},
    "saturday":{"open":"08:00","close":"17:00"},
    "sunday":{"open":"08:00","close":"16:00"}
  }'::jsonb;

update public.booking_settings
set business_hours = '{
      "monday":{"open":"09:00","close":"16:00"},
      "tuesday":{"open":"09:00","close":"16:00"},
      "wednesday":{"open":"09:00","close":"17:00"},
      "thursday":{"open":"09:00","close":"17:00"},
      "friday":{"open":"09:00","close":"17:00"},
      "saturday":{"open":"08:00","close":"17:00"},
      "sunday":{"open":"08:00","close":"16:00"}
    }'::jsonb,
    opening_time = '08:00',
    closing_time = '17:00',
    operating_hours = '{"start":"08:00","end":"17:00"}'::jsonb,
    slot_count = 9,
    slots_per_day = 9,
    slot_duration = 60,
    slot_interval_minutes = 60,
    capacity_per_slot = 8,
    slot_capacity = 8,
    max_group_size = 8,
    maximum_group_size = 8,
    monday_enabled = true,
    tuesday_enabled = true,
    wednesday_enabled = true,
    thursday_enabled = true,
    friday_enabled = true,
    saturday_enabled = true,
    sunday_enabled = true,
    weekend_enabled = true,
    updated_at = now()
where id = 1;

alter table public.bookings_mirror
  add column if not exists business_hours_snapshot jsonb,
  add column if not exists food_items jsonb not null default '[]'::jsonb,
  add column if not exists per_remote_selections jsonb not null default '[]'::jsonb;

create or replace function public.is_valid_booking_slot(p_booking_date date, p_booking_time text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  cfg public.booking_settings;
  day_key text;
  enabled boolean;
  opens_at time;
  closes_at time;
  starts_at time;
begin
  select * into cfg from public.booking_settings where id = 1;
  if not found or not coalesce(cfg.online_booking_enabled, true) then return false; end if;

  day_key := lower(trim(to_char(p_booking_date, 'FMDay')));
  enabled := case day_key
    when 'monday' then cfg.monday_enabled
    when 'tuesday' then cfg.tuesday_enabled
    when 'wednesday' then cfg.wednesday_enabled
    when 'thursday' then cfg.thursday_enabled
    when 'friday' then cfg.friday_enabled
    when 'saturday' then cfg.saturday_enabled and cfg.weekend_enabled
    when 'sunday' then cfg.sunday_enabled and cfg.weekend_enabled
    else false
  end;
  if not coalesce(enabled, false) then return false; end if;
  if to_jsonb(cfg.holiday_dates) ? p_booking_date::text or to_jsonb(cfg.blackout_dates) ? p_booking_date::text then return false; end if;

  opens_at := coalesce(nullif(cfg.business_hours -> day_key ->> 'open', '')::time, cfg.opening_time);
  closes_at := coalesce(nullif(cfg.business_hours -> day_key ->> 'close', '')::time, cfg.closing_time);
  begin
    starts_at := to_timestamp(trim(p_booking_time), 'HH12:MI AM')::time;
  exception when others then
    return false;
  end;
  return starts_at >= opens_at and starts_at + interval '1 hour' <= closes_at;
end;
$$;

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
  p_per_remote_selections jsonb default '[]'::jsonb
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
    raise exception 'One food and coffee selection is required for every remote';
  end if;
  if exists (select 1 from jsonb_array_elements(selections) item where trim(coalesce(item ->> 'toastie', '')) = '' or trim(coalesce(item ->> 'coffee', '')) = '') then
    raise exception 'Every remote requires a toastie and hot coffee selection';
  end if;

  configured_price := nullif(cfg.gameplay_prices ->> p_gameplay_duration::text, '')::numeric;
  configured_price := coalesce(configured_price, case when p_gameplay_duration = 45 then 45 else 55 end);
  first_selection := selections -> 0;
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
    'RCC-' || lpad(next_number::text, 4, '0'), trim(p_customer_name), lower(trim(p_customer_email)),
    trim(p_customer_phone), p_booking_date, trim(p_booking_time), p_gameplay_duration,
    p_gameplay_duration, configured_price, configured_price * p_remote_spots,
    configured_price * p_remote_spots, p_remote_spots,
    coalesce(nullif(trim(coalesce(p_toastie_selection, '')), ''), nullif(trim(first_selection ->> 'toastie'), '')),
    coalesce(nullif(trim(coalesce(p_drink_selection, '')), ''), nullif(trim(first_selection ->> 'coffee'), '')),
    selections, selections, hours_snapshot, nullif(trim(coalesce(p_notes, '')), ''),
    'pending', 'not_required', coalesce(nullif(trim(p_source), ''), 'website-v4'), null, trim(p_booking_time)
  ) returning * into created;

  insert into public.activity_logs (action, module, record_id, details)
  values ('Booking V4 created', 'bookings', created.id::text,
    jsonb_build_object('bookingId', created.booking_id, 'status', 'pending', 'remoteSpots', created.group_size, 'foodRows', jsonb_array_length(selections)));
  return created;
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
  updated public.bookings_mirror;
  selections jsonb := coalesce(p_per_remote_selections, '[]'::jsonb);
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  if jsonb_typeof(selections) <> 'array' or jsonb_array_length(selections) <> p_remote_spots then
    raise exception 'One food and coffee selection is required for every remote';
  end if;
  if exists (select 1 from jsonb_array_elements(selections) item where trim(coalesce(item ->> 'toastie', '')) = '' or trim(coalesce(item ->> 'coffee', '')) = '') then
    raise exception 'Every remote requires a toastie and hot coffee selection';
  end if;

  updated := public.update_booking_admin_v3(
    p_booking_id, p_booking_date, p_booking_time, p_remote_spots, p_gameplay_duration,
    p_price_per_remote, coalesce(nullif(p_toastie_selection, ''), selections -> 0 ->> 'toastie'),
    coalesce(nullif(p_drink_selection, ''), selections -> 0 ->> 'coffee'), p_notes,
    p_admin_notes, p_payment_status
  );

  update public.bookings_mirror
  set per_remote_selections = selections,
      food_items = selections,
      business_hours_snapshot = coalesce(p_business_hours_snapshot, business_hours_snapshot),
      updated_at = now()
  where id = p_booking_id
  returning * into updated;
  return updated;
end;
$$;

create or replace function public.get_slot_availability_v4(p_booking_date date, p_booking_time text)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.get_slot_availability_v3(p_booking_date, p_booking_time) || jsonb_build_object(
    'validBusinessHour', public.is_valid_booking_slot(p_booking_date, p_booking_time)
  );
$$;

revoke all on function public.create_booking_request_v4(text,text,text,date,text,integer,numeric,integer,text,text,text,text,jsonb,jsonb) from public;
revoke all on function public.update_booking_admin_v4(uuid,date,text,integer,integer,numeric,text,text,text,text,text,jsonb,jsonb) from public;
revoke all on function public.get_slot_availability_v4(date,text) from public;
grant execute on function public.create_booking_request_v4(text,text,text,date,text,integer,numeric,integer,text,text,text,text,jsonb,jsonb) to anon, authenticated;
grant execute on function public.update_booking_admin_v4(uuid,date,text,integer,integer,numeric,text,text,text,text,text,jsonb,jsonb) to authenticated;
grant execute on function public.get_slot_availability_v4(date,text) to anon, authenticated;

-- Keep website opening-hours content aligned with the official Google hours.
insert into public.settings (key, value)
values ('public_site', jsonb_build_object(
  'openingHighlight', 'We are open every day, including Sunday.',
  'openingHours', jsonb_build_object(
    'monday', '9:00 AM - 4:00 PM',
    'tuesday', '9:00 AM - 4:00 PM',
    'wednesday', '9:00 AM - 5:00 PM',
    'thursday', '9:00 AM - 5:00 PM',
    'friday', '9:00 AM - 5:00 PM',
    'saturday', '8:00 AM - 5:00 PM',
    'sunday', '8:00 AM - 4:00 PM'
  )
))
on conflict (key) do update
set value = coalesce(public.settings.value, '{}'::jsonb) || excluded.value,
    updated_at = now();
