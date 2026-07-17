-- RCC Cafe public website settings. Run after rcc-admin-backend.sql.
-- Idempotent and non-destructive: existing admin-edited values are preserved.

insert into public.settings (key, value)
values ('public_site', '{
  "socials": {
    "instagram": "https://www.instagram.com/remotecontrolcafe?igsh=MTVhamJtanVxZ3RoMw%3D%3D&utm_source=qr",
    "facebook": "https://www.facebook.com/share/1C2kYoCgPK/?mibextid=wwXIfr",
    "tiktok": "https://www.tiktok.com/@remotecontrolcafe?_r=1&_t=ZS-94mpJUFvAof",
    "youtube": "https://youtube.com/@jay_zinzala?si=BJGrpt82DqqqBOKj"
  },
  "openingHours": {"monday":"","tuesday":"","wednesday":"","thursday":"","friday":"","saturday":"","sunday":""},
  "openingHighlight": "We are open every day, including Sunday.",
  "googleHoursUrl": "https://share.google/Mx2HXIvNXeD8sNr43",
  "announcement": {
    "active": true,
    "text": "Good news! RCC Cafe is open on Sundays too - book your RC session today.",
    "ctaLabel": "Book Now",
    "ctaUrl": "/booking#calendar"
  }
}'::jsonb)
on conflict (key) do nothing;

alter table public.settings enable row level security;
drop policy if exists "public_site_settings_public_read" on public.settings;
create policy "public_site_settings_public_read" on public.settings
for select to anon, authenticated using (key = 'public_site' or public.is_admin());

grant select on public.settings to anon, authenticated;

-- Lets a newly-created public booking record its optional backup-sync result.
-- The short time window and matching public booking ID prevent unrelated rows being changed.
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
    and status = 'pending'
    and created_at >= now() - interval '15 minutes';
end;
$$;

revoke all on function public.record_booking_sheet_sync_v3(uuid,text,boolean,text) from public;
grant execute on function public.record_booking_sheet_sync_v3(uuid,text,boolean,text) to anon, authenticated;
