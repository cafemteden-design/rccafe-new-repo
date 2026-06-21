-- RCC Cafe Booking System V2.
-- Run after booking-production-hardening.sql. Idempotent and data-preserving.

alter table public.booking_settings
  add column if not exists capacity_per_slot integer not null default 8,
  add column if not exists max_group_size integer not null default 8,
  add column if not exists slot_count integer not null default 8,
  add column if not exists operating_hours jsonb not null default '{"start":"09:00","end":"16:00"}'::jsonb,
  add column if not exists slot_duration integer not null default 45,
  add column if not exists weekend_enabled boolean not null default true;

update public.booking_settings
set capacity_per_slot = 8,
    slot_capacity = 8,
    max_group_size = 8,
    maximum_group_size = 8,
    slot_count = 8,
    slot_duration = 45,
    weekend_enabled = true,
    saturday_enabled = true,
    sunday_enabled = true,
    operating_hours = jsonb_build_object(
      'start', to_char(opening_time, 'HH24:MI'),
      'end', to_char(closing_time, 'HH24:MI')
    )
where id = 1;

alter table public.bookings_mirror drop constraint if exists bookings_mirror_status_check;
update public.bookings_mirror
set status = case lower(status)
  when 'confirmed' then 'approved'
  when 'new' then 'pending'
  else lower(status)
end;
alter table public.bookings_mirror
  add constraint bookings_mirror_status_check
  check (status in ('pending', 'approved', 'rejected', 'cancelled', 'completed', 'no_show'));

alter table public.bookings_mirror
  alter column status set default 'pending',
  alter column source set default 'website';

alter table public.bookings_mirror
  add column if not exists package_duration integer,
  add column if not exists notes text,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejected_by uuid references auth.users(id) on delete set null,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid references auth.users(id) on delete set null;

create sequence if not exists public.rcc_booking_number_seq start 1001;

create table if not exists public.booking_slot_capacity (
  booking_date date not null,
  slot_time text not null,
  approved_spots integer not null default 0 check (approved_spots >= 0),
  updated_at timestamptz not null default now(),
  primary key (booking_date, slot_time)
);

create index if not exists bookings_v2_date_slot_status_idx
on public.bookings_mirror (booking_date, booking_time, status);

create or replace function public.is_valid_booking_slot(p_booking_date date, p_booking_time text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  settings public.booking_settings;
  day_number integer := extract(dow from p_booking_date);
  valid_day boolean;
  valid_slot boolean;
begin
  select * into settings from public.booking_settings where id = 1;
  if not found then return false; end if;

  valid_day := case day_number
    when 0 then settings.weekend_enabled and settings.sunday_enabled
    when 1 then settings.monday_enabled
    when 2 then settings.tuesday_enabled
    when 3 then settings.wednesday_enabled
    when 4 then settings.thursday_enabled
    when 5 then settings.friday_enabled
    when 6 then settings.weekend_enabled and settings.saturday_enabled
    else false
  end;
  if not valid_day or p_booking_date = any(settings.blackout_dates) or p_booking_date = any(settings.holiday_dates) then
    return false;
  end if;

  select exists (
    select 1
    from generate_series(0, settings.slot_count - 1) as sequence(index)
    where to_char(
      settings.opening_time + make_interval(mins => sequence.index * settings.slot_duration),
      'HH12:MI AM'
    ) = upper(trim(p_booking_time))
      and settings.opening_time + make_interval(mins => (sequence.index + 1) * settings.slot_duration) <= settings.closing_time
  ) into valid_slot;
  return valid_slot;
end;
$$;

alter table public.booking_slot_capacity enable row level security;
drop policy if exists "slot_capacity_public_read" on public.booking_slot_capacity;
create policy "slot_capacity_public_read"
on public.booking_slot_capacity for select to anon, authenticated
using (true);

drop policy if exists "slot_capacity_admin_manage" on public.booking_slot_capacity;
create policy "slot_capacity_admin_manage"
on public.booking_slot_capacity for all to authenticated
using (public.is_admin()) with check (public.is_admin());

grant select on public.booking_slot_capacity to anon, authenticated;

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
    and status = 'approved';

  insert into public.booking_slot_capacity (booking_date, slot_time, approved_spots, updated_at)
  values (p_booking_date, p_slot_time, used, now())
  on conflict (booking_date, slot_time) do update
  set approved_spots = excluded.approved_spots,
      updated_at = now();
  return used;
end;
$$;

create or replace function public.sync_booking_capacity_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_booking_slot_capacity(old.booking_date, old.booking_time);
    return old;
  end if;
  if tg_op = 'UPDATE' and (old.booking_date, old.booking_time) is distinct from (new.booking_date, new.booking_time) then
    perform public.refresh_booking_slot_capacity(old.booking_date, old.booking_time);
  end if;
  perform public.refresh_booking_slot_capacity(new.booking_date, new.booking_time);
  return new;
end;
$$;

drop trigger if exists sync_booking_slot_capacity on public.bookings_mirror;
create trigger sync_booking_slot_capacity
after insert or update or delete on public.bookings_mirror
for each row execute function public.sync_booking_capacity_trigger();

create or replace function public.create_booking_request(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_booking_date date,
  p_booking_time text,
  p_package_name text,
  p_package_duration integer,
  p_package_price numeric,
  p_group_size integer,
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
  created public.bookings_mirror;
  settings public.booking_settings;
  next_number bigint;
begin
  select * into settings from public.booking_settings where id = 1;
  if not found then raise exception 'Booking settings are unavailable'; end if;
  if trim(coalesce(p_customer_name, '')) = '' then raise exception 'Customer name is required'; end if;
  if trim(coalesce(p_customer_phone, '')) = '' then raise exception 'Phone is required'; end if;
  if trim(coalesce(p_customer_email, '')) = '' then raise exception 'Email is required'; end if;
  if p_booking_date < (now() at time zone 'Pacific/Auckland')::date then raise exception 'Past dates cannot be booked'; end if;
  if not public.is_valid_booking_slot(p_booking_date, p_booking_time) then raise exception 'This booking slot is unavailable'; end if;
  if p_group_size < 1 or p_group_size > settings.max_group_size then
    raise exception 'Group size must be between 1 and %', settings.max_group_size;
  end if;
  if upper(trim(coalesce(p_package_name, ''))) not in ('POWER', 'MASTER') then
    raise exception 'This package is unavailable';
  end if;

  next_number := nextval('public.rcc_booking_number_seq');
  insert into public.bookings_mirror (
    booking_id, customer_name, customer_email, customer_phone,
    booking_date, booking_time, package_name, package_duration,
    package_price, group_size, toastie_selection, drink_selection,
    notes, status, source
  ) values (
    'RCC-' || lpad(next_number::text, 4, '0'),
    trim(p_customer_name), lower(trim(p_customer_email)), trim(p_customer_phone),
    p_booking_date, trim(p_booking_time), upper(trim(p_package_name)), p_package_duration,
    p_package_price, p_group_size, nullif(trim(coalesce(p_toastie_selection, '')), ''),
    nullif(trim(coalesce(p_drink_selection, '')), ''), nullif(trim(coalesce(p_notes, '')), ''),
    'pending', coalesce(nullif(trim(p_source), ''), 'website')
  ) returning * into created;
  return created;
end;
$$;

revoke all on function public.create_booking_request(text,text,text,date,text,text,integer,numeric,integer,text,text,text,text) from public;
grant execute on function public.create_booking_request(text,text,text,date,text,text,integer,numeric,integer,text,text,text,text) to anon, authenticated;

create or replace function public.set_booking_status(
  p_booking_id uuid,
  p_status text,
  p_admin_note text default null
)
returns public.bookings_mirror
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  booking public.bookings_mirror;
  capacity integer;
  used integer;
  target_status text := lower(trim(p_status));
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  if target_status not in ('pending', 'approved', 'rejected', 'cancelled', 'completed', 'no_show') then
    raise exception 'Unsupported booking status';
  end if;

  select * into booking from public.bookings_mirror where id = p_booking_id for update;
  if not found then raise exception 'Booking not found'; end if;

  -- Serialize every approval/cancellation for this date and slot.
  perform pg_advisory_xact_lock(hashtextextended(booking.booking_date::text || '|' || booking.booking_time, 0));

  if target_status = 'approved' and booking.status <> 'approved' then
    select capacity_per_slot into capacity from public.booking_settings where id = 1;
    capacity := coalesce(capacity, 8);
    select coalesce(sum(group_size), 0)::integer into used
    from public.bookings_mirror
    where booking_date = booking.booking_date
      and booking_time = booking.booking_time
      and status = 'approved'
      and id <> booking.id;
    if used + booking.group_size > capacity then
      raise exception 'CAPACITY_EXCEEDED: Only % remote spot(s) remain', greatest(capacity - used, 0);
    end if;
  end if;

  update public.bookings_mirror
  set status = target_status,
      admin_notes = coalesce(nullif(trim(p_admin_note), ''), admin_notes),
      approved_at = case when target_status = 'approved' then now() else approved_at end,
      approved_by = case when target_status = 'approved' then auth.uid() else approved_by end,
      rejected_at = case when target_status = 'rejected' then now() else rejected_at end,
      rejected_by = case when target_status = 'rejected' then auth.uid() else rejected_by end,
      cancelled_at = case when target_status = 'cancelled' then now() else cancelled_at end,
      cancelled_by = case when target_status = 'cancelled' then auth.uid() else cancelled_by end,
      updated_at = now()
  where id = booking.id
  returning * into booking;

  insert into public.activity_logs (actor_id, action, module, record_id, details)
  values (auth.uid(), 'Booking status changed', 'bookings', booking.id::text,
    jsonb_build_object('bookingId', booking.booking_id, 'status', target_status, 'groupSize', booking.group_size));
  return booking;
end;
$$;

revoke all on function public.set_booking_status(uuid,text,text) from public;
grant execute on function public.set_booking_status(uuid,text,text) to authenticated;

-- Rebuild sanitized capacity from existing approved records.
insert into public.booking_slot_capacity (booking_date, slot_time, approved_spots, updated_at)
select booking_date, booking_time, sum(group_size)::integer, now()
from public.bookings_mirror
where status = 'approved'
group by booking_date, booking_time
on conflict (booking_date, slot_time) do update
set approved_spots = excluded.approved_spots, updated_at = now();

do $$
begin
  begin
    alter publication supabase_realtime add table public.booking_slot_capacity;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.bookings_mirror;
  exception when duplicate_object then null;
  end;
end $$;
