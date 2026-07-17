# Hostinger Dist Validation Report

Validation date: 2026-06-22

## Result

The production `dist` folder was regenerated from a clean Vite build and is safe to upload directly into Hostinger `public_html`.

| Check | Result | Notes |
| --- | --- | --- |
| Env values present | Yes | All three required production Vite variables are present. |
| Supabase URL present | Yes | Uses `https://alnysrqzpfzlzjdcrgei.supabase.co`. |
| Google Script URL present | Yes | Uses the current deployed Apps Script Web App URL. |
| Service role absent | Yes | The configured JWT role is `anon`; no service-role reference exists in `dist`. |
| Build passed | Yes | `npm run build` and build asset validation passed. |
| Dist structure valid | Yes | `index.html` is directly inside `dist`, not inside a nested folder. |
| `.htaccess` present | Yes | Includes React Router fallback plus runtime cache and MIME rules. |
| Assets verified | Yes | Referenced JS/CSS, images, videos, logo, manifest, robots and sitemap are present. |
| Secrets excluded | Yes | No env, SQL, Apps Script, source, report, package or lock files exist in `dist`. |
| Routes preview tested | Yes | Public and protected admin deep links rendered or redirected correctly with no blank page. |

## Environment Verification

- `VITE_SUPABASE_URL`: configured for the production Supabase project.
- `VITE_SUPABASE_ANON_KEY`: present and verified as the public `anon` role.
- `VITE_GOOGLE_SCRIPT_URL`: configured for the current production Web App deployment.
- `.env.production`: created locally and ignored by Git.
- No configured endpoint uses `localhost` or `127.0.0.1`.

The minified vendor bundles contain generic localhost detection strings from third-party Supabase and QR libraries. These are library internals, not RCC endpoint configuration.

## Backend Readiness

- Supabase Auth endpoint responded successfully.
- The production `booking_settings` record is readable using the anon client.
- Apps Script `?action=health` returned HTTP 200 and identified version 2.0 with Supabase as source of truth.
- Google Sheet sync remains secondary and non-blocking in the website booking service.

## Preview Route Results

The following routes were tested from the production preview build:

- `/`
- `/booking`
- `/rewards`
- `/rewards/card/demo`
- `/menu`
- `/experience`
- `/contact`
- `/admin/login`
- `/admin/dashboard`
- `/admin/bookings`
- `/admin/rewards`
- `/admin/rewards/scanner`
- `/admin/diagnostics`

Unauthenticated protected admin routes correctly redirected to `/admin/login`. There were no fatal console errors or horizontal overflow. Lenis was active on desktop public pages and absent from admin pages; mobile-width public pages retained native scrolling.

## Safe Upload Contents

Upload the contents inside `dist` directly into `public_html`:

- `index.html`
- `assets/`
- `images/`
- `videos/`
- `logo-rc-cafe-v2.png`
- `.htaccess`
- `robots.txt`
- `sitemap.xml`
- `manifest.webmanifest`
- `sw.js`

Do not upload the `dist` folder itself as `public_html/dist`.

## Remaining Manual Steps

1. Back up the current Hostinger `public_html` folder.
2. Remove the previous runtime files from `public_html` so old hashed bundles cannot remain.
3. Upload only the contents of the final `dist` folder, including hidden `.htaccess`.
4. Clear Hostinger/CDN cache, then verify the live site in an incognito window.
5. Log in with an authorized admin account to verify protected admin modules beyond the login redirect.

No ZIP was created and no deployment was performed.
