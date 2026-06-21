-- ============================================================================
-- RCC Cafe — Settings seed for public.settings (key/value jsonb)
-- ----------------------------------------------------------------------------
-- Safe to run multiple times. UPSERT on key. These keys back the admin Settings
-- module and (where wired) the public footer/business text. Edit freely in the
-- admin after seeding; re-running resets seeded keys to these defaults.
-- ============================================================================

insert into public.settings (key, value)
values
  ('business_name', '"Remote Control Cafe"'::jsonb),
  ('address', '"159 Mount Eden Road, Mount Eden, Auckland 1024"'::jsonb),
  ('opening_message', '"Open 7 days, 9:00am - 4:00pm"'::jsonb),
  ('booking_notice', '"Online bookings are available 7 days a week. Please arrive 5 minutes before your session."'::jsonb),
  ('offline_booking_notice', '"Venue hire, school groups, corporate bookings and private events are arranged by enquiry. Our team replies within 24 hours."'::jsonb),
  ('venue_hire_starting_price', '300'::jsonb),
  ('reward_signup_gift', '"Buy 1 Get 1 Toastie"'::jsonb),
  ('stamps_required', '7'::jsonb),
  ('email_recipients', '["bookings@remotecontrolcafe.co.nz"]'::jsonb),
  ('social_links', '{"instagram":"https://www.instagram.com/remotecontrolcafe","facebook":"https://www.facebook.com/remotecontrolcafe","tiktok":"","youtube":""}'::jsonb),
  -- Legacy combined keys kept for backward compatibility with existing rows.
  ('business', '{"timezone":"Pacific/Auckland","currency":"NZD"}'::jsonb),
  ('rewards', '{"stampsRequired":7,"welcomeGift":"Buy 1 Get 1 Toastie"}'::jsonb)
on conflict (key) do update
set value = excluded.value,
    updated_at = now();
