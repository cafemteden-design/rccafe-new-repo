# RCC Cafe Final Deployment Checklist

## 1. Supabase

1. Back up the Supabase project.
2. Run existing migrations if not already installed.
3. Run `supabase/final-admin-v3.sql` in Supabase SQL Editor.
4. Confirm the SQL completes without errors.
5. Run `supabase/public-site-settings.sql` to enable live public settings and booking sync-status logging.
6. In Authentication, create staff/admin users.
7. Assign each user an active role in `public.profiles`: `super_admin`, `admin`, `manager` or `staff`.
8. Open `/admin/diagnostics` and confirm tables, read-only RPCs, auth and storage pass.

## 2. Google Apps Script

1. Sign in as `cafemteden@gmail.com`.
2. Replace the deployed script with `google-apps-script/Code.gs`.
3. Configure all Script Properties listed in `google-apps-script/APPS_SCRIPT_DEPLOYMENT.md`.
4. Deploy a new Web App version: Execute as Me, access Anyone.
5. Verify `?action=health` returns V2 health JSON.
6. Keep Google Sheets as backup/reporting/email logs only; never use it for booking status authority or capacity.

## 3. Frontend Environment

Set these at build time:

```text
VITE_SUPABASE_URL=https://alnysrqzpfzlzjdcrgei.supabase.co
VITE_SUPABASE_ANON_KEY=<public anon key>
VITE_GOOGLE_SCRIPT_URL=<deployed Apps Script Web App /exec URL>
```

Never expose a Supabase service-role key in Vite or Hostinger files.

## 4. Build and Upload

```text
npm install
npm run test:admin-v3
npm run build
```

Upload the contents of `dist/` to Hostinger `public_html/`, not the `dist` folder itself. Remove old hashed assets before upload. Preserve the generated `.htaccess`. Do not upload `src`, `node_modules`, `.env*`, SQL files or private keys.

## 5. Smoke Test

- `/booking`: create a confirmed test booking.
- `/admin/bookings`: cancel, complete and mark no-show; verify capacity.
- `/admin/bookings/settings`: update and restore one safe notice field.
- `/rewards`: create/login with a dedicated test customer.
- `/admin/rewards/scanner`: QR, Card Number, email and phone lookup.
- `/admin/notifications`: global and customer-specific notification.
- `/admin/content`, `/admin/offers`, `/admin/media`, `/admin/seo`, `/admin/settings`: read and save one reversible test.
- Hard refresh and test route refreshes directly on Hostinger.

## 6. Handover

- Give the client admin credentials through a secure channel.
- Give the client the Apps Script deployment ownership and Sheet access.
- Record deployment date, SQL version and Apps Script deployment ID.
- Keep the Supabase project and `cafemteden@gmail.com` under client ownership.
