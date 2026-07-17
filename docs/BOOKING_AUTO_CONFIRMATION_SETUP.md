# Remote Control Cafe Booking Upgrade Setup Guide

This guide is for the automatic booking confirmation upgrade.

Do not publish the website or run the SQL on production until you have checked the preview and approved the release.

Booking reliability note: the website confirms the booking through the existing Google Apps Script and Google Sheet flow first, so the customer still receives a confirmed booking reference and emails even if Supabase is slow. Supabase is then updated in the background using the same booking reference.

## Part A: Backup First

1. Open Supabase.
2. Select the Remote Control Cafe project.
3. Open Table Editor.
4. Open the `bookings_mirror` table.
5. Click Export, then download the bookings as CSV.
6. Open the Google Sheet used for booking records.
7. Click File.
8. Click Make a copy.
9. Name it `Remote Control Cafe Booking Backup - before auto confirmation`.
10. Open Extensions.
11. Open Apps Script.
12. Copy the current Apps Script code into a safe backup file.
13. In the website project, create a backup commit or branch before deploying.

## Part B: Run The Supabase SQL

1. Open Supabase.
2. Select the Remote Control Cafe project.
3. Open SQL Editor.
4. Click New query.
5. Open this project file:
   `supabase/20260711_remote_control_cafe_booking_upgrade.sql`
6. Copy the full SQL from that file.
7. Paste it into Supabase SQL Editor.
8. Click Run.
9. Wait for Supabase to show a success message.
10. Open Table Editor.
11. Open `bookings_mirror`.
12. Confirm existing bookings are still present.
13. Confirm the `status` column exists.
14. Confirm the `drink_selection` column exists.
15. Confirm the `cancelled_at` column exists.
16. Confirm the `cancellation_reason` column exists.
17. Confirm the `cancelled_by` column exists.
18. Create a new test booking after deployment and confirm its status is `confirmed`.

If the SQL fails, do not run it again immediately. Copy the Supabase error message and send it to the developer.

## Part C: Update The Google Sheet

Supabase remains the main booking database. The Google Sheet is only used for reporting, backup, email logging and operational records.

1. Open the booking Google Sheet.
2. Open the tab used by the current Apps Script for bookings.
3. Do not delete old rows.
4. Do not reorder existing columns unless the current Sheet is already broken.
5. Add or verify these column headings:
   - Booking ID
   - Created At
   - Customer Name
   - Email
   - Phone
   - Booking Date
   - Booking Time
   - Group Size
   - Toastie Selection
   - Drink Selection
   - Status
   - Cancelled At
   - Cancellation Reason
   - Cancelled By
6. If `Drink Selection` already exists, keep it.
7. If `Cancellation Reason` does not exist, add it after `Cancelled At` if possible.
8. Existing rows do not need to be manually filled.
9. New bookings should show `Status` as `Confirmed`.
10. Cancelled bookings should update the same booking row using the booking reference.

## Part D: Update Apps Script



1. Open the booking Google Sheet.
2. Click Extensions.
3. Click Apps Script.
4. Copy the old Apps Script into a backup file.
5. Open this project file:
   `google-apps-script/Code.gs`
6. Copy the full file.
7. Paste it into Apps Script, replacing the old code.
8. Click Project Settings.
9. Open Script Properties.
10. Confirm the existing properties are still present.
11. Add `WEBHOOK_SECRET` only if a private server-side caller will send booking sync requests.
12. Do not put `WEBHOOK_SECRET` in the website browser environment variables.
13. Click Save.
14. Run the existing setup/test function if the Apps Script project already uses one.
15. Approve Google permissions when Google asks.
16. Click Deploy.
17. Click Manage deployments.
18. Edit the existing Web App deployment.
19. Keep the same Execute As option that the current working integration uses.
20. Keep the same access option that the current working integration uses.
21. Click Deploy.
22. Copy the Web App URL.
23. If the URL changed, update the website environment variable that stores the Apps Script URL.

Important security note: the current website posts booking sync events from the browser. A browser must never contain a secret token. Leave `WEBHOOK_SECRET` blank unless the sync is moved behind a private server-side endpoint.

## Part E: Environment Variables

No new browser environment variable is required for the booking upgrade.

Check the existing variables:

| Variable | Used For | Add Or Change | Secret |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | Website connection to Supabase | Keep existing | No |
| `VITE_SUPABASE_ANON_KEY` | Public Supabase browser key | Keep existing | No |
| `VITE_GOOGLE_SCRIPT_URL` | Google Sheet sync endpoint, if currently used | Keep existing unless Apps Script URL changed | No |
| `WEBHOOK_SECRET` | Optional Apps Script request validation | Script Property only, not website env | Yes |

After changing hosting environment variables, redeploy the website.

## Part F: Local Testing

1. Start the website locally.
2. Open the booking page.
3. Confirm the Toastie options are unchanged.
4. Confirm these coffee options are visible: `Any Black`, `Flat White / Latte`, `Hot Choco`, `Cappuccino`, `Fluffy`.
5. Select `Fluffy`, then select `Any Black` and confirm `Fluffy` becomes unselected.
6. Try submitting without a drink and confirm the form blocks submission.
7. Submit a test booking.
8. Confirm the success screen says `Booking Confirmed`.
9. Confirm the booking reference is shown.
10. Open Supabase and confirm the booking status is `confirmed` when Supabase is available.
11. If Supabase is slow or unavailable, confirm the booking still appears in the Google Sheet with a booking reference.
12. Open the Google Sheet and confirm the drink appears.
13. Confirm the customer confirmation email is sent.
14. Confirm the admin notification email is sent.
14. Open the admin panel.
15. Find the confirmed booking.
16. Click Cancel Booking.
17. Enter an optional reason.
18. Confirm cancellation.
19. Confirm Supabase status becomes `cancelled`.
20. Confirm the Google Sheet row is updated.
21. Confirm the customer cancellation email is sent.
22. Confirm the same booking cannot be cancelled twice.
23. Confirm the cancelled booking no longer blocks that booking slot.

## Part G: Production Deployment

Do not publish automatically.

Before production approval, review:

1. Changed website files.
2. Booking form preview.
3. Admin panel preview.
4. SQL migration file.
5. Apps Script file.
6. Google Sheet column list.
7. Environment variables.
8. Local test results.
9. Production build result.

After approval:

1. Commit the website changes.
2. Push the approved branch.
3. Deploy using the existing hosting process.
4. Run the Supabase SQL migration once.
5. Update Apps Script.
6. Confirm the live booking page opens.
7. Submit a safe live test booking only if the cafe approves it.
8. Confirm the customer email, admin email, admin panel and Sheet update.

## Rollback Plan

1. If the website has an issue, redeploy the previous website version.
2. If Apps Script has an issue, paste back the backed-up Apps Script code and redeploy it.
3. If the Sheet has an issue, use the copied Sheet backup for comparison.
4. Do not delete Supabase bookings.
5. Do not reset the database.
6. If SQL rollback is needed, ask a developer to prepare a safe forward-fix migration.
