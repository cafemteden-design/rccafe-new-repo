# RCC Cafe Supabase Final Run Order

## Existing RCC Production Project

Use this shorter upgrade path only when the base schema, booking hardening and Booking V2 migrations have already completed successfully.

1. Back up the Supabase project.
2. Run `supabase/final-admin-v3.sql`.
3. Run `supabase/admin-panel-v3-phase1.sql`.
4. Run `supabase/public-site-settings.sql`.
5. Run `supabase/booking-v4-hours-food.sql`.
6. Run only the seed files for modules that are empty.
7. Open `/admin/diagnostics` and verify role, table, RPC and storage access.

## New or Rebuilt Supabase Project

Run these files in this exact order:

1. `supabase/rcc-admin-backend.sql`
2. `supabase/admin-final-access-fix.sql`
3. `supabase/booking-production-hardening.sql`
4. `supabase/booking-system-v2.sql`
5. `supabase/final-admin-v3.sql`
6. `supabase/admin-panel-v3-phase1.sql`
7. `supabase/public-site-settings.sql`
8. `supabase/booking-v4-hours-food.sql`
9. `supabase/cms-seed.sql`
10. `supabase/menu-seed.sql`
11. `supabase/offers-seed.sql`
12. `supabase/seo-seed.sql`
13. `supabase/settings-seed.sql`

`rcc-admin-backend.sql` enables `pgcrypto`; no separate extension script is required.

## Do Not Run

- `_archive/old-sql/booking-v3-fixed-hour-slots.sql`
- `_archive/old-sql/rcc-booking-rules-update.sql`
- Any SQL copied from old deployment ZIPs, screenshots, chat messages or deprecated handover documents.

## Safety Notes

- Do not run seed files again after the client has edited CMS, SEO or settings unless resetting those seeded values is intentional.
- Supabase remains the booking capacity and rewards authority. Google Sheets is backup, reporting and email logging only.
- Create the first Auth user manually, then assign an active `super_admin` profile as documented in `docs/SUPABASE_ADMIN_SETUP.md`.
