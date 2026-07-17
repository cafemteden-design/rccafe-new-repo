# RCC Cafe Booking V4 Hours & Food Report

## Completed

1. Official business hours are shared across Home, Contact, Booking and Admin Booking Settings.
2. Booking slots are fixed one-hour windows and are generated from each selected day's opening and closing time.
3. Every selected remote has its own required toastie and hot-coffee selectors.
4. `supabase/booking-v4-hours-food.sql` adds day-wise hours and V4 JSON fields without deleting legacy data.
5. Admin booking list, detail, edit and offline-create flows support the full per-remote breakdown.
6. Google Sheet payloads include business-hours snapshot, selections JSON and a readable food summary.
7. Apps Script V2 admin/customer booking emails show the full food breakdown.
8. Old bookings remain compatible through `toastie_selection` and `drink_selection` fallback handling.

## Verified

- Monday: 7 slots, 09:00 AM to 04:00 PM.
- Wednesday: 8 slots, 09:00 AM to 05:00 PM.
- Saturday: 9 slots, 08:00 AM to 05:00 PM.
- Sunday: 8 slots, 08:00 AM to 04:00 PM.
- Four remotes render four food cards and eight required selectors.
- Eight remotes render eight food cards and sixteen required selectors.
- At 390px the Booking food step has no horizontal overflow.
- Booking preview produced no console errors on the current production build.
- Supabase SQL static validation passed.
- Apps Script source syntax parsing passed.
- `npm run build` passed, including build-output asset validation.

## Data Compatibility

New bookings save the complete array to `per_remote_selections` and `food_items`. The first remote's choices are also saved to the existing `toastie_selection` and `drink_selection` columns. Old rows containing only those legacy columns continue to render in the public/admin interfaces.

Supabase remains authoritative. Google Sheet and Apps Script sync remains optional and non-blocking.

## Manual Production Steps

1. Back up Supabase, then run `supabase/booking-v4-hours-food.sql` after the existing V3/admin migrations.
2. In the Google Sheet `BOOKINGS` header row, add `Business Hours Snapshot`, `Per Remote Selections JSON`, and `Food Summary` if absent. Keep the legacy Toastie/Drink columns.
3. Replace the deployed Apps Script `Code.gs` with `google-apps-script/Code.gs`, create a new deployment version, and keep the frontend Web App URL unchanged if updating the existing deployment.
4. Verify a test pending booking in Supabase, then confirm Sheet backup and both admin/customer email breakdowns.

The browser QA did not create a real booking, so no production customer row or email was generated during local testing.
