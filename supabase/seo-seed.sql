-- ============================================================================
-- RCC Cafe — SEO pages seed for public.seo_pages
-- ----------------------------------------------------------------------------
-- Safe to run multiple times. Seeds per-page meta defaults so the admin SEO
-- module shows editable rows. The public site reads its SEO from the built-in
-- static PAGE_SEO config; these rows give the client a managed record and a
-- base for future overrides. Uses UPSERT on page_key.
-- ============================================================================

insert into public.seo_pages (page_key, title, description, keywords, canonical)
values
  ('/',
    'RCC Cafe Auckland | Remote Control Construction Experience',
    'RCC Cafe is Auckland''s unique indoor activity where kids, families and groups drive real remote control construction machines. Book your session today.',
    'RCC Cafe Auckland, remote control cafe, RC construction Auckland, indoor activity Auckland',
    'https://remotecontrolcafe.co.nz/'),
  ('/about',
    'About Remote Control Cafe Auckland | Our RC Construction Arena',
    'Learn about Remote Control Cafe Auckland — a unique indoor RC construction arena and cafe for kids, families and groups across Auckland.',
    'about RCC Cafe Auckland, remote control cafe Auckland, family entertainment Auckland',
    'https://remotecontrolcafe.co.nz/about'),
  ('/machines',
    'RC Machines & Construction Games Auckland | RCC Cafe',
    'Explore remote control diggers, dump trucks, cranes, loaders and construction machines at RCC Cafe Auckland.',
    'RC machines Auckland, remote control diggers, RC construction games Auckland',
    'https://remotecontrolcafe.co.nz/machines'),
  ('/booking',
    'Book RCC Cafe Auckland | RC Machine Play Sessions',
    'Book your Remote Control Cafe play session in Auckland. Choose your package, food and drink preferences, and enjoy a unique RC construction experience.',
    'book RC cafe Auckland, RC play session Auckland, remote control cafe booking',
    'https://remotecontrolcafe.co.nz/booking'),
  ('/menu',
    'Cafe Menu Auckland | RCC Food & Drinks',
    'View RCC Cafe food and drink options including toasties, hot coffee and family-friendly cafe choices in Auckland.',
    'cafe menu Auckland, RCC food and drinks, family cafe Auckland',
    'https://remotecontrolcafe.co.nz/menu'),
  ('/experience',
    'Experience Remote Control Cafe | Auckland RC Cafe',
    'Explore the Remote Control Cafe experience: RC construction machines, cafe food and coffee, family visits, birthdays, group bookings and events in Auckland.',
    'remote control cafe experience, RC arena Auckland, family activity Auckland',
    'https://remotecontrolcafe.co.nz/experience'),
  ('/rewards',
    'RCC Digital Reward Card | Remote Control Cafe Auckland',
    'Create your RCC Digital Reward Card, collect stamps on every visit and unlock a surprise gift after 7 visits.',
    'RCC reward card, cafe loyalty card Auckland, remote control cafe rewards',
    'https://remotecontrolcafe.co.nz/rewards'),
  ('/gallery',
    'RCC Cafe Gallery Auckland | RC Machines, Kids Activities & Events',
    'See photos of the RCC Cafe indoor arena, remote control machines, kids activities and events in Auckland.',
    'RCC cafe gallery, RC machines photos, kids activities Auckland',
    'https://remotecontrolcafe.co.nz/gallery'),
  ('/contact',
    'Contact Remote Control Cafe Auckland | Bookings & Enquiries',
    'Contact RCC Cafe Auckland for bookings, venue hire, birthdays, corporate events and general enquiries.',
    'contact RCC cafe, remote control cafe Auckland contact, venue hire Auckland',
    'https://remotecontrolcafe.co.nz/contact'),
  ('/faq',
    'RCC Cafe FAQs | Remote Control Cafe Auckland',
    'Answers to common questions about RCC Cafe Auckland: bookings, packages, ages, parties, group visits and what to expect.',
    'RCC cafe faq, remote control cafe questions, RC cafe Auckland help',
    'https://remotecontrolcafe.co.nz/faq')
on conflict (page_key) do update
set title = excluded.title,
    description = excluded.description,
    keywords = excluded.keywords,
    canonical = excluded.canonical,
    updated_at = now();
