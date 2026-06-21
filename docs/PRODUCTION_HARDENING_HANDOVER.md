# RCC Cafe Production Hardening Handover

## 1. Supabase migration

Run these files in Supabase SQL Editor, in order:

1. `supabase/rcc-admin-backend.sql` (only if the base schema has not already been installed)
2. `supabase/admin-final-access-fix.sql`
3. `supabase/booking-production-hardening.sql`
4. `supabase/booking-system-v2.sql`
5. Existing content seeds as required: `cms-seed.sql`, `offers-seed.sql`, `menu-seed.sql`, `seo-seed.sql`, `settings-seed.sql`

Create the first user in Authentication, then ensure its matching `public.profiles` row has `role = 'super_admin'` and `active = true`.

The final migration adds:

- typed `booking_settings`
- public read and admin write RLS policies
- MINI inactive, POWER and MASTER active
- reward event soft-delete metadata
- `undo_last_reward_stamp()`

Booking System V2 adds pending/approved/rejected/cancelled workflow, the sanitized realtime capacity table, exact eight-slot settings, public pending-booking RPC and an advisory-lock protected atomic approval RPC.

## 2. Google Apps Script

1. Open the Apps Script project attached to the booking spreadsheet.
2. Replace `Code.gs` with `google-apps-script/Code.gs` from this repository.
3. In Project Settings > Script Properties set:
   - `BOOKINGS_SHEET_NAME`: the existing bookings tab name (default `Bookings`)
   - `ADMIN_EMAILS`: `cafemteden@gmail.com,mtedencafestaff@gmail.com`
   - `SUPABASE_URL`: the RCC Supabase project URL
   - `SUPABASE_ANON_KEY`: the public anon key, never the service-role key
4. Deploy > Manage deployments > Edit > New version.
5. Execute as the project owner and allow access to Anyone.
6. Keep the existing Web App URL. A new version of the same deployment keeps the endpoint stable.

Verification URLs:

```text
WEB_APP_URL?action=health
WEB_APP_URL?action=availability&date=2026-06-20&slot=09:00%20AM
```

Expected health response:

```json
{"success":true,"service":"rcc-booking-api","capacity":8}
```

## 3. Admin booking settings

Open `/admin/settings/booking` as a `super_admin`. Changes are stored in Supabase and read by the public booking page. Apps Script also reads the same public settings through Supabase REST, with a safe capacity-8 fallback if Supabase is temporarily unavailable.

## 4. Hostinger

Upload the contents of `RCC_CAFE_PRODUCTION_FINAL.zip` directly into `public_html`. Remove old hashed files from `public_html/assets` first, then extract the ZIP. Do not upload `src`, `node_modules`, `.env.local`, SQL files or Apps Script source to the website root.

After upload, clear Hostinger cache and test a deep refresh on `/booking`, `/rewards`, `/admin/login`, and `/admin/settings/booking`.
