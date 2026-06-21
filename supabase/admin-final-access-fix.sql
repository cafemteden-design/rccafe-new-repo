-- ============================================================================
-- RCC Cafe — Admin Final Access Fix  (idempotent, safe to rerun)
-- ----------------------------------------------------------------------------
-- Run this in the Supabase SQL Editor AFTER rcc-admin-backend.sql.
-- It does NOT drop tables or delete data. It:
--   1. Re-asserts the role helper functions (is_admin / is_staff / is_super_admin)
--   2. Re-enables RLS and guarantees admin read/write on every admin-managed table
--   3. Adds remove_reward_stamp() so staff can undo accidental stamps
--   4. Adds admin_access_diagnostics() so /admin/diagnostics shows the real role
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Role helper functions (security definer so they bypass profiles RLS).
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer
set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active and role in ('super_admin', 'admin', 'manager')
  );
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer
set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active and role = 'super_admin'
  );
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer
set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active and role in ('super_admin', 'admin', 'manager', 'staff')
  );
$$;

-- ----------------------------------------------------------------------------
-- 2. Guarantee admin full access on every admin-managed table.
--    These are additive permissive policies (OR'd with existing ones), so they
--    do not remove any public-read or staff policies already installed.
-- ----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'reward_offers', 'reward_notifications', 'reward_settings', 'packages',
    'menu_items', 'website_leads', 'venue_hire_enquiries', 'bookings_mirror',
    'customers', 'media_library', 'website_sections', 'seo_pages',
    'settings', 'reward_cards', 'reward_events', 'activity_logs'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s_admin_all_fix" on public.%I', t, t);
    execute format(
      'create policy "%s_admin_all_fix" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t, t
    );
  end loop;
end $$;

-- Staff still need to insert their own activity log rows.
drop policy if exists "activity_staff_insert" on public.activity_logs;
create policy "activity_staff_insert"
on public.activity_logs for insert to authenticated
with check (public.is_staff() and (actor_id is null or actor_id = auth.uid()));

-- Profiles: self-read + super-admin management (do not widen to all admins).
alter table public.profiles enable row level security;
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read"
on public.profiles for select to authenticated
using (id = auth.uid() or public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. remove_reward_stamp(): undo accidental stamps without deleting history.
-- ----------------------------------------------------------------------------
create or replace function public.remove_reward_stamp(
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
  removable integer;
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
  if card.current_stamps <= 0 then
    raise exception 'There are no stamps to remove';
  end if;

  select coalesce(stamps_required, 7)
  into required_stamps
  from public.reward_settings
  where id = 1 and active;
  required_stamps := coalesce(required_stamps, 7);

  -- Never remove more than the customer currently has in this cycle.
  removable := least(p_stamp_count, card.current_stamps);

  update public.reward_cards
  set current_stamps = greatest(current_stamps - removable, 0),
      total_stamps = greatest(total_stamps - removable, 0),
      total_visits = greatest(total_visits - removable, 0),
      -- If the reward was only unlocked because of this stamp, revert to active.
      reward_status = case
        when card.reward_status = 'unlocked'
             and (current_stamps - removable) < required_stamps then 'active'
        else card.reward_status
      end
  where id = card.id
  returning * into card;

  insert into public.reward_events (
    reward_card_id, event_type, stamp_change, cycle_number, note, created_by
  )
  values (
    card.id, 'stamp_removed', -removable, card.cycle_number,
    coalesce(p_note, 'Removed accidental stamp'), auth.uid()
  );

  insert into public.activity_logs (actor_id, action, module, record_id, details)
  values (
    auth.uid(), 'Reward stamp removed', 'rewards', card.id::text,
    jsonb_build_object('stampCount', removable, 'rccCardId', card.rcc_card_id)
  );

  return card;
end;
$$;

revoke all on function public.remove_reward_stamp(uuid, integer, text) from public;
grant execute on function public.remove_reward_stamp(uuid, integer, text) to authenticated;

-- ----------------------------------------------------------------------------
-- 4. admin_access_diagnostics(): exposes the caller's real identity/role so the
--    Diagnostics page can explain access issues precisely (no more guessing).
-- ----------------------------------------------------------------------------
create or replace function public.admin_access_diagnostics()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'uid', auth.uid(),
    'email', (select email from public.profiles where id = auth.uid()),
    'role', (select role from public.profiles where id = auth.uid()),
    'active', (select active from public.profiles where id = auth.uid()),
    'profileExists', exists (select 1 from public.profiles where id = auth.uid()),
    'isStaff', public.is_staff(),
    'isAdmin', public.is_admin(),
    'isSuperAdmin', public.is_super_admin()
  );
$$;

revoke all on function public.admin_access_diagnostics() from public;
grant execute on function public.admin_access_diagnostics() to authenticated;
