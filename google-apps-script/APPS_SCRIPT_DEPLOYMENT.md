# RCC Cafe Apps Script V2 Deployment

## Architecture

Apps Script V2 is the primary public booking intake and email system. This prevents customer bookings from failing when Supabase is slow. Supabase remains responsible for admin authentication, admin cancellation security, booking capacity logic after migration, customer reward login, stamp totals, reward unlocking, and redemption.

- stores confirmed public bookings in Google Sheets first;
- sends customer and admin emails;
- writes status, activity, email, and execution logs;
- updates the `SYSTEM_HEALTH` data section;
- exposes safe `health`, `settings`, and `ping` endpoints.

Apps Script must not authenticate a reward customer or calculate a reward cycle. Public bookings are confirmed by Apps Script and then Supabase can catch up in the background.

## Deployment Owner

1. Sign in to Google using `cafemteden@gmail.com`.
2. Open [Google Apps Script](https://script.google.com/).
3. Open the Apps Script project associated with the RCC CRM spreadsheet, or create a standalone project.
4. Replace `Code.gs` with [Code.gs](./Code.gs).

Emails are sent by the Google account that owns/deploys the Web App. Deploying from another account will change the sender authority.

## Required Script Properties

Open **Project Settings > Script Properties** and configure:

| Property | Value |
| --- | --- |
| `SPREADSHEET_ID` | Spreadsheet ID from the RCC CRM Google Sheet URL |
| `BUSINESS_EMAIL` | `cafemteden@gmail.com` |
| `ADMIN_EMAILS` | `cafemteden@gmail.com` |
| `TIMEZONE` | `Pacific/Auckland` |
| `WEBSITE_URL` | `https://remotecontrolcafe.co.nz` |
| `SUPABASE_URL` | RCC Supabase project URL |
| `SUPABASE_ANON_KEY` | RCC Supabase anon key |
| `WEBHOOK_SECRET` | Optional shared request token for server-to-server calls |
| `ENABLE_ADMIN_EMAILS` | `true` |
| `ENABLE_CUSTOMER_EMAILS` | `true` |
| `ENABLE_REWARD_EMAILS` | `true` |

Do not add a Supabase service-role key to this script. V2 does not require one.

Leave `WEBHOOK_SECRET` blank while the website calls Apps Script directly from the browser. Do not put any secret token in the React frontend.

After replacing `Code.gs`, run this Apps Script function once:

```text
setupRccCafeBookingSystem
```

It creates or verifies all required Sheet tabs and headers, and seeds `cafemteden@gmail.com` as the primary notification recipient.

## Required Sheet Tabs

The script directly uses:

- `BOOKINGS`
- `BOOKING_STATUS_LOG`
- `REWARD_CARDS`
- `REWARD_ACTIVITY_LOG`
- `WEBSITE_LEADS`
- `VENUE_HIRE_ENQUIRIES`
- `EMAIL_RECIPIENTS`
- `EMAIL_LOGS`
- `APP_SCRIPT_LOGS`
- `SYSTEM_HEALTH`
- `SETTINGS`

Other CRM tabs remain available to spreadsheet formulas and dashboards but are not rewritten by Apps Script V2.

The setup function creates missing tabs and appends missing columns. It does not delete old data, rename tabs, or reorder existing columns.

For Booking V4, add these headers to the existing `BOOKINGS` header row if they are not already present:

- `Business Hours Snapshot`
- `Per Remote Selections JSON`
- `Food Summary`

Keep the existing `Toastie Selection` and `Drink Selection` headers. New bookings write the first remote's choices to those legacy columns and write the complete per-remote breakdown to the V4 columns.

## Email Recipient Setup

In `EMAIL_RECIPIENTS`, configure the main cafe email as the active primary row:

| Name | Email Address | Role | Priority | Active |
| --- | --- | --- | --- | --- |
| RCC Primary | `cafemteden@gmail.com` | Primary | 1 | TRUE |

Enable the relevant boolean columns per row:

- `Booking Alerts`
- `Reward Alerts`
- `Venue Enquiries`
- `Website Leads`
- `Customer Emails`

Booking notification emails are sent to `ADMIN_EMAILS`, which should be `cafemteden@gmail.com`. Emails are sent by the Google account that deploys the Web App, so deploy from `cafemteden@gmail.com`.

## Web App Deployment

1. Click **Deploy > New deployment**.
2. Select **Web app**.
3. Description: `RCC Cafe Apps Script V2`.
4. Execute as: **Me**.
5. Who has access: **Anyone**.
6. Click **Deploy** and authorize Sheet and Mail permissions.
7. Copy the Web App `/exec` URL.
8. Keep the existing production URL until all V2 tests pass. If Google creates a new URL, update the frontend/admin configuration only after verification.

## Endpoint Verification

Replace `WEB_APP_URL` below with the deployed `/exec` URL.

```text
WEB_APP_URL?action=health
WEB_APP_URL?action=ping
WEB_APP_URL?action=settings
```

Expected health response:

```json
{
  "success": true,
  "service": "rcc-cafe-apps-script-v2",
  "version": "2.0",
  "sourceOfTruth": "apps-script-booking-intake",
  "sheetRole": "booking-intake-reporting-email-logs",
  "timezone": "Pacific/Auckland"
}
```

Then run the examples in [TEST_PAYLOADS.md](./TEST_PAYLOADS.md) in this order:

1. `bookingCreated`
2. `bookingUpdated`
3. `bookingCancelled` using a separate test booking
5. `rewardCardCreated`
6. `rewardStampAdded`
7. `rewardRedeemed`
8. `websiteLeadCreated`
9. `venueEnquiryCreated`
10. `sendEmail`

Verify the matching backup row, module log, `EMAIL_LOGS`, and `APP_SCRIPT_LOGS` after every request.

## Production Integration Order

1. Website posts the public booking to Apps Script.
2. Apps Script creates or updates the confirmed booking row in Google Sheet.
3. Apps Script sends the customer confirmation email.
4. Apps Script sends the admin notification email to `cafemteden@gmail.com`.
5. Website updates Supabase in the background using the same booking reference.
6. Admin cancellation still goes through the authenticated admin/Supabase workflow.

The current website uses `bookingCreated` for public booking intake. V2 also maps `createBooking` to `bookingCreated` for compatibility.

## Manual TODOs Requiring Client Confirmation

- Confirm that `WEBSITE_LEADS` and `VENUE_HIRE_ENQUIRIES` headers use the same names as their incoming payload keys. Their exact column lists were not supplied, so V2 writes only matching existing headers and does not invent columns.
- Confirm the location/labels of `Booking Enabled` and `Rewards Enabled` in `SETTINGS`. V2 looks for those labels in column A and values in column B; otherwise the safe public response defaults both to `true`.
- Confirm the final Supabase server/Edge Function that will emit reward and admin status events to Apps Script. Frontend code must not be trusted to send privileged cancellation or stamp authority events.
- Confirm a server-to-server authentication design for privileged POST actions before public production use. Google Apps Script Web Apps do not expose a reliable custom-header verification flow to `doPost(e)`, and no shared signing value was supplied. Do not place a reusable secret in the React frontend.

## Rollback

Use **Deploy > Manage deployments** to select the previous working version. If reverting Apps Script, also test one booking immediately because Apps Script is the current public booking intake and email path.
