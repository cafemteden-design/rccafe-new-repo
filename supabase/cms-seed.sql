-- ============================================================================
-- RCC Cafe — Default CMS content seed for public.website_sections
-- ----------------------------------------------------------------------------
-- Safe to run multiple times. Uses UPSERT on (page_key, section_key), so it
-- only fills in defaults and refreshes the seeded copy without creating
-- duplicates. Editors can change any value afterwards from the admin Content
-- module; re-running this script will overwrite seeded rows back to defaults,
-- so run it only for first-time setup or an intentional reset.
--
-- The frontend reads `title`, `subtitle`, `image_url`, `video_url` columns and
-- any extra keys from the `content` jsonb (e.g. body, footnote).
-- ============================================================================

insert into public.website_sections
  (page_key, section_key, title, subtitle, content, image_url, video_url, active, sort_order)
values
  -- ---------------------------- HOME ----------------------------------------
  ('home', 'hero',
    'Drive. Dig. Build. Play.',
    'Remote Control Café is New Zealand''s most unique café experience, combining great coffee, tasty food, and exciting remote-control fun for all ages.',
    '{}'::jsonb,
    '/images/hero-arena.jpg',
    '/videos/hero-rc-gameplay.mp4',
    true, 1),

  ('home', 'intro',
    'A cafe visit with something exciting to do.',
    null,
    '{"body":"Remote Control Cafe is made for people who want more than a standard cafe stop. Enjoy a relaxed cafe setting, choose a food and play package, and experience remote-control construction machines in a clean indoor space."}'::jsonb,
    null, null, true, 2),

  ('home', 'rewards',
    'Create Your Free Reward Card',
    null,
    '{"body":"Sign up for your digital reward card and unlock a welcome surprise after creating your card."}'::jsonb,
    null, null, true, 3),

  ('home', 'venue_hire',
    'Special bookings are handled by enquiry.',
    null,
    '{"body":"Regular POWER and MASTER sessions can be booked online 7 days a week. For venue hire, school groups, corporate bookings and private events, send an enquiry and our team will respond within 24 hours.","footnote":"Venue hire starts from $300. Please send an enquiry for details and availability."}'::jsonb,
    null, null, true, 4),

  ('home', 'enquiry',
    'Need help planning a visit?',
    null,
    '{"body":"For special bookings, events, venue hire, school groups or corporate enquiries, send us a message. Our team will respond within 24 hours."}'::jsonb,
    null, null, true, 5),

  ('home', 'gallery',
    'Inside the RCC Arena',
    null,
    '{"body":"A look at the indoor remote-control construction arena, cafe space and the machines you can drive."}'::jsonb,
    null, null, true, 6),

  -- ------------------------- EXPERIENCE -------------------------------------
  ('experience', 'hero',
    'Experience Remote Control Cafe',
    'Remote Control Café is New Zealand''s most unique café experience, combining great coffee, tasty food, and exciting remote-control fun for all ages.',
    '{}'::jsonb,
    '/images/indoor-arena.jpg',
    null, true, 1),

  ('experience', 'unique',
    'What Makes Remote Control Cafe Unique',
    null,
    '{"body":"Cafe culture, hands-on RC construction play, family-friendly service and a venue people remember."}'::jsonb,
    null, null, true, 2),

  ('experience', 'rc_arena',
    'Real Remote-Control Construction Arena',
    null,
    '{"body":"Drive detailed RC machines in a purpose-built indoor arena with real movement, sand, missions and teamwork."}'::jsonb,
    null, null, true, 3),

  ('experience', 'food',
    'Café, Food & Snacks Experience',
    null,
    '{"body":"Enjoy toasties, hot coffee and cafe favourites while your session feels relaxed, social and easy."}'::jsonb,
    null, null, true, 4),

  ('experience', 'family',
    'Family Friendly Experience',
    null,
    '{"body":"A welcoming indoor activity for kids, parents, friends and first-time visitors who want something different."}'::jsonb,
    null, null, true, 5),

  ('experience', 'events',
    'Birthday Parties & Events',
    null,
    '{"body":"Celebrate with a playful RC-themed experience that works for kids, adults and mixed family groups."}'::jsonb,
    null, null, true, 6),

  ('experience', 'corporate',
    'Corporate / Group Experience',
    null,
    '{"body":"A fresh team outing for groups that want an activity, cafe time and a shared memory in one place."}'::jsonb,
    null, null, true, 7),

  ('experience', 'gallery',
    'See the RCC experience',
    null,
    '{}'::jsonb,
    null, null, true, 8),

  ('experience', 'cta',
    'Ready to experience Remote Control Cafe?',
    null,
    '{"body":"Book an everyday weekday package online, or send an enquiry for birthdays, private functions, venue hire and group bookings."}'::jsonb,
    null, null, true, 9),

  -- ---------------------------- FOOTER --------------------------------------
  ('footer', 'brand',
    'Remote Control Cafe',
    null,
    '{"body":"Auckland''s indoor remote-control cafe experience. Great coffee, tasty food and RC construction play for all ages."}'::jsonb,
    null, null, true, 1)

on conflict (page_key, section_key) do update
set title = excluded.title,
    subtitle = excluded.subtitle,
    content = excluded.content,
    image_url = excluded.image_url,
    video_url = excluded.video_url,
    active = excluded.active,
    sort_order = excluded.sort_order,
    updated_at = now();
