-- RCC Cafe production booking/admin hardening.
-- Run after rcc-admin-backend.sql and admin-final-access-fix.sql.
-- Idempotent: safe to run again.

create table if not exists public.booking_settings (
  id integer primary key default 1 check (id = 1),
  slot_capacity integer not null default 8 check (slot_capacity between 1 and 50),
  maximum_group_size integer not null default 8 check (maximum_group_size between 1 and 50),
  monday_enabled boolean not null default true,
  tuesday_enabled boolean not null default true,
  wednesday_enabled boolean not null default true,
  thursday_enabled boolean not null default true,
  friday_enabled boolean not null default true,
  saturday_enabled boolean not null default true,
  sunday_enabled boolean not null default true,
  opening_time time not null default '09:00',
  closing_time time not null default '16:00',
  slot_interval_minutes integer not null default 15 check (slot_interval_minutes between 5 and 240),
  holiday_dates date[] not null default '{}',
  blackout_dates date[] not null default '{}',
  notice_text text not null default 'Online bookings are available every day. Each time slot has a maximum of 8 remote spots. One person uses one remote spot.',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.booking_settings (
  id, slot_capacity, maximum_group_size,
  monday_enabled, tuesday_enabled, wednesday_enabled, thursday_enabled,
  friday_enabled, saturday_enabled, sunday_enabled,
  opening_time, closing_time, slot_interval_minutes, notice_text
)
values (
  1, 8, 8,
  true, true, true, true, true, true, true,
  '09:00', '16:00', 15,
  'Online bookings are available every day. Each time slot has a maximum of 8 remote spots. One person uses one remote spot. If a time slot is full, it will be marked as fully booked.'
)
on conflict (id) do update
set slot_capacity = 8,
    maximum_group_size = 8,
    saturday_enabled = true,
    sunday_enabled = true,
    updated_at = now();

update public.packages
set active = false,
    badge = 'Currently Unavailable',
    description = 'Currently unavailable for online booking.'
where lower(slug) = 'mini' or upper(name) = 'MINI';

update public.packages
set active = true
where lower(slug) in ('power', 'master') or upper(name) in ('POWER', 'MASTER');

alter table public.booking_settings enable row level security;

drop policy if exists "booking_settings_public_read" on public.booking_settings;
create policy "booking_settings_public_read"
on public.booking_settings for select to anon, authenticated
using (id = 1);

drop policy if exists "booking_settings_admin_manage" on public.booking_settings;
create policy "booking_settings_admin_manage"
on public.booking_settings for all to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select on public.booking_settings to anon, authenticated;
grant insert, update, delete on public.booking_settings to authenticated;

drop trigger if exists touch_booking_settings_updated_at on public.booking_settings;
create trigger touch_booking_settings_updated_at
before update on public.booking_settings
for each row execute function public.touch_updated_at();

alter table public.reward_events
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id) on delete set null,
  add column if not exists deletion_note text;

create index if not exists reward_events_active_stamp_idx
on public.reward_events (reward_card_id, cycle_number, created_at desc)
where event_type = 'stamp_added' and deleted_at is null;

create or replace function public.undo_last_reward_stamp(
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
  stamp_event public.reward_events;
  required_stamps integer := 7;
  remove_count integer;
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
  if card.reward_status = 'blocked' then
    raise exception 'This reward card is blocked';
  end if;

  select * into stamp_event
  from public.reward_events
  where reward_card_id = card.id
    and cycle_number = card.cycle_number
    and event_type = 'stamp_added'
    and stamp_change > 0
    and deleted_at is null
  order by created_at desc, id desc
  limit 1
  for update;

  if not found then
    raise exception 'There is no stamp event to undo in this cycle';
  end if;

  remove_count := least(stamp_event.stamp_change, card.current_stamps);
  if remove_count < 1 then
    raise exception 'There are no stamps to remove';
  end if;

  select coalesce(stamps_required, 7) into required_stamps
  from public.reward_settings
  where id = 1 and active;
  required_stamps := coalesce(required_stamps, 7);

  update public.reward_events
  set deleted_at = now(),
      deleted_by = auth.uid(),
      deletion_note = coalesce(nullif(trim(p_note), ''), 'Undone from admin reward scanner')
  where id = stamp_event.id;

  update public.reward_cards
  set current_stamps = greatest(current_stamps - remove_count, 0),
      total_stamps = greatest(total_stamps - remove_count, 0),
      total_visits = greatest(total_visits - remove_count, 0),
      reward_status = case
        when greatest(current_stamps - remove_count, 0) < required_stamps then 'active'
        else reward_status
      end,
      updated_at = now()
  where id = card.id
  returning * into card;

  insert into public.activity_logs (actor_id, action, module, record_id, details)
  values (
    auth.uid(), 'Last reward stamp undone', 'rewards', card.id::text,
    jsonb_build_object(
      'rewardEventId', stamp_event.id,
      'stampCount', remove_count,
      'rccCardId', card.rcc_card_id,
      'note', coalesce(p_note, '')
    )
  );

  return card;
end;
$$;

revoke all on function public.undo_last_reward_stamp(uuid, text) from public;
grant execute on function public.undo_last_reward_stamp(uuid, text) to authenticated;

drop function if exists public.remove_reward_stamp(uuid, integer, text);

-- Ensure the five admin-managed modules have seed rows where useful.
insert into public.settings (key, value)
values ('booking', '{"capacity":8,"maximumGroupSize":8,"operatingDays":[0,1,2,3,4,5,6]}'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();
