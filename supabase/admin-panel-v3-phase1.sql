-- RCC Cafe Admin Panel V3 Phase 1.
-- Run after final-admin-v3.sql. Idempotent and non-destructive.

alter table public.booking_settings
  add column if not exists currency text not null default 'NZD';

alter table public.reward_offers
  add column if not exists target_audience text not null default 'all',
  add column if not exists target_customer_email text,
  add column if not exists cta_label text,
  add column if not exists cta_url text,
  add column if not exists status text not null default 'active';

alter table public.reward_notifications
  add column if not exists target_customer_email text,
  add column if not exists priority integer not null default 1,
  add column if not exists cta_label text,
  add column if not exists cta_url text,
  add column if not exists status text not null default 'active';

create or replace function public.get_slot_availability_v3(p_booking_date date, p_booking_time text)
returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
  select jsonb_build_object(
    'capacity', coalesce(bs.capacity_per_slot,8),
    'usedSpots', coalesce(sum(b.group_size) filter(where b.status='approved'),0),
    'remainingSpots', greatest(coalesce(bs.capacity_per_slot,8)-coalesce(sum(b.group_size) filter(where b.status='approved'),0),0),
    'fullyBooked', coalesce(sum(b.group_size) filter(where b.status='approved'),0)>=coalesce(bs.capacity_per_slot,8)
  )
  from public.booking_settings bs
  left join public.bookings_mirror b on b.booking_date=p_booking_date and b.booking_time=p_booking_time
  where bs.id=1 group by bs.capacity_per_slot;
$$;

create or replace function public.approve_booking_v3(p_booking_id uuid,p_admin_note text default null)
returns public.bookings_mirror language sql security definer set search_path=public,pg_temp as $$
  select public.set_booking_status(p_booking_id,'approved',p_admin_note);
$$;
create or replace function public.reject_booking_v3(p_booking_id uuid,p_admin_note text default null)
returns public.bookings_mirror language sql security definer set search_path=public,pg_temp as $$
  select public.set_booking_status(p_booking_id,'rejected',p_admin_note);
$$;
create or replace function public.cancel_booking_v3(p_booking_id uuid,p_admin_note text default null)
returns public.bookings_mirror language sql security definer set search_path=public,pg_temp as $$
  select public.set_booking_status(p_booking_id,'cancelled',p_admin_note);
$$;

create or replace function public.get_admin_dashboard_stats()
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare
  today_nz date;
  cfg public.booking_settings;
begin
  today_nz := (now() at time zone 'Pacific/Auckland')::date;
  if not public.is_staff() then raise exception 'Not authorised'; end if;
  select * into cfg from public.booking_settings where id=1;
  return jsonb_build_object(
    'todayBookings',(select count(*) from public.bookings_mirror where booking_date=today_nz),
    'pendingBookings',(select count(*) from public.bookings_mirror where status='pending'),
    'approvedBookings',(select count(*) from public.bookings_mirror where status='approved'),
    'todayRevenue',(select coalesce(sum(total_price),0) from public.bookings_mirror where booking_date=today_nz and status='approved'),
    'remoteSpotsBooked',(select coalesce(sum(group_size),0) from public.bookings_mirror where booking_date=today_nz and status='approved'),
    'remainingSpotsToday',greatest(coalesce(cfg.capacity_per_slot,8)*coalesce(cfg.slot_count,8)-(select coalesce(sum(group_size),0) from public.bookings_mirror where booking_date=today_nz and status='approved'),0),
    'rewardCards',(select count(*) from public.reward_cards),
    'stampsToday',(select coalesce(sum(stamp_change),0) from public.reward_events where event_type='stamp_added' and deleted_at is null and (created_at at time zone 'Pacific/Auckland')::date=today_nz),
    'rewardsRedeemed',(select count(*) from public.reward_events where event_type='reward_redeemed' and deleted_at is null),
    'newLeads',(select count(*) from public.website_leads where status='new'),
    'failedSyncs',(select count(*) from public.bookings_mirror where sheet_sync_error is not null),
    'systemAlerts',(select count(*) from public.activity_logs where created_at>now()-interval '24 hours' and lower(action) like '%fail%')
  );
end;
$$;

create or replace function public.create_reward_notification(
  p_title text,p_message text,p_type text default 'general',p_audience text default 'all',
  p_customer_email text default null,p_starts_at timestamptz default null,p_ends_at timestamptz default null,
  p_priority integer default 1,p_cta_label text default null,p_cta_url text default null
)
returns public.reward_notifications language plpgsql security definer set search_path=public,pg_temp as $$
declare target_id uuid; created public.reward_notifications;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  if trim(coalesce(p_title,''))='' or trim(coalesce(p_message,''))='' then raise exception 'Title and message are required'; end if;
  if p_audience='customer' then
    select id into target_id from public.reward_cards where active and lower(email)=lower(trim(coalesce(p_customer_email,''))) limit 1;
    if target_id is null then raise exception 'Customer reward card not found'; end if;
  end if;
  insert into public.reward_notifications(title,message,notification_type,audience,target_reward_card_id,target_customer_email,starts_at,ends_at,priority,cta_label,cta_url,status,active,created_by)
  values(trim(p_title),trim(p_message),p_type,p_audience,target_id,lower(trim(p_customer_email)),p_starts_at,p_ends_at,greatest(p_priority,1),p_cta_label,p_cta_url,'active',true,auth.uid())
  returning * into created;
  return created;
end;
$$;

create or replace function public.get_reward_card_by_token(p_secure_token uuid)
returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
select jsonb_build_object(
  'id',rc.id,'cardId',rc.rcc_card_id,'token',rc.secure_token,'name',rc.full_name,'phone',rc.mobile,'email',rc.email,
  'stampCount',rc.current_stamps,'totalStamps',greatest(rc.total_stamps,rc.lifetime_stamps),'totalVisits',rc.total_visits,
  'cycle',rc.cycle_number,'rewardStatus',rc.reward_status,'rewardsRedeemed',rc.rewards_redeemed,
  'welcomeGiftUnlocked',rc.welcome_gift_unlocked,'welcomeGiftRedeemed',rc.welcome_gift_redeemed,
  'notificationEnabled',rc.notification_enabled,'createdAt',rc.created_at,
  'signupGift',case when rc.welcome_gift_unlocked then (select jsonb_build_object('id','welcome-gift','title',rs.signup_gift_title,'description',rs.signup_gift_description,'status',case when rc.welcome_gift_redeemed then 'redeemed' else 'unlocked' end) from public.reward_settings rs where rs.id=1 and rs.active) else null end,
  'activeOffers',coalesce((select jsonb_agg(jsonb_build_object('id',ro.id,'title',ro.title,'description',ro.description,'type',ro.offer_type,'startDate',ro.start_date,'endDate',ro.end_date,'ctaLabel',ro.cta_label,'ctaUrl',ro.cta_url) order by ro.priority desc,ro.created_at desc) from public.reward_offers ro where ro.active and ro.status='active' and (ro.target_audience='all' or lower(ro.target_customer_email)=lower(rc.email)) and (ro.start_date is null or ro.start_date<=current_date) and (ro.end_date is null or ro.end_date>=current_date)),'[]'::jsonb),
  'notifications',coalesce((select jsonb_agg(jsonb_build_object('id',rn.id,'title',rn.title,'message',rn.message,'type',rn.notification_type,'createdAt',rn.created_at,'ctaLabel',rn.cta_label,'ctaUrl',rn.cta_url,'unread',not exists(select 1 from public.reward_notification_reads rr where rr.notification_id=rn.id and rr.reward_card_id=rc.id)) order by rn.priority desc,rn.created_at desc) from public.reward_notifications rn where rn.active and rn.status='active' and (rn.target_reward_card_id is null or rn.target_reward_card_id=rc.id) and (rn.starts_at is null or rn.starts_at<=now()) and (rn.ends_at is null or rn.ends_at>=now())),'[]'::jsonb),
  'history',coalesce((select jsonb_agg(jsonb_build_object('id',re.id,'type',re.event_type,'label',initcap(replace(re.event_type,'_',' ')),'stampChange',re.stamp_change,'cycle',re.cycle_number,'note',re.note,'createdAt',re.created_at) order by re.created_at desc) from public.reward_events re where re.reward_card_id=rc.id and re.deleted_at is null),'[]'::jsonb)
) from public.reward_cards rc where rc.secure_token=p_secure_token and rc.active and rc.reward_status<>'blocked';
$$;

revoke all on function public.get_slot_availability_v3(date,text) from public;
revoke all on function public.approve_booking_v3(uuid,text) from public;
revoke all on function public.reject_booking_v3(uuid,text) from public;
revoke all on function public.cancel_booking_v3(uuid,text) from public;
revoke all on function public.get_admin_dashboard_stats() from public;
revoke all on function public.create_reward_notification(text,text,text,text,text,timestamptz,timestamptz,integer,text,text) from public;
grant execute on function public.get_slot_availability_v3(date,text) to anon,authenticated;
grant execute on function public.approve_booking_v3(uuid,text) to authenticated;
grant execute on function public.reject_booking_v3(uuid,text) to authenticated;
grant execute on function public.cancel_booking_v3(uuid,text) to authenticated;
grant execute on function public.get_admin_dashboard_stats() to authenticated;
grant execute on function public.create_reward_notification(text,text,text,text,text,timestamptz,timestamptz,integer,text,text) to authenticated;
grant execute on function public.get_reward_card_by_token(uuid) to anon,authenticated;

update public.packages set active=false where duration_minutes=30 or lower(coalesce(slug,''))='mini';

drop policy if exists "active_offers_public_read" on public.reward_offers;
create policy "active_offers_public_read" on public.reward_offers for select to anon,authenticated
using (active and status='active' and target_audience='all' and (start_date is null or start_date<=current_date) and (end_date is null or end_date>=current_date));
