# RCC Cafe – Current Website Audit

_Audit performed before Supabase migration. No behaviour was changed during this audit._

## Current Architecture

- **Stack:** React 18 + Vite 5 + React Router 6 + Tailwind CSS 3 + Framer Motion. Pure SPA, statically hosted (Hostinger / static host, deep links via `public/.htaccess` + `base: '/'`).
- **Routing:** `src/App.jsx` defines all routes (home, about, machines, booking, menu, gallery, contact, rewards, reward card, staff/admin rewards, 404).
- **Booking backend:** Google Apps Script Web App. All logic lives in `src/data/bookingConfig.js` (`BOOKING_API_URL`, `fetchSlotAvailability`, `submitBooking`, payload normalization, validation, slot generation). The UI is `src/pages/Booking.jsx`.
- **Reward system:** Demo-only, browser `localStorage`. All logic in `src/data/rewardsDemo.js`. UI in `src/pages/Rewards.jsx`, `RewardCard.jsx`, `StaffRewards.jsx`, `AdminRewards.jsx` and `src/components/rewards/*`.
- **Static content:** `src/data/menu.js`, `machines.js`, `gallery.js`, `videos.js`, `site.js`. Media in `public/images`, `public/videos`.

## Data Flow Summary

| Area | Source | Persistence |
|------|--------|-------------|
| Booking availability | `fetchSlotAvailability()` GET to Apps Script | Google Sheet |
| Booking submission | `submitBooking()` POST to Apps Script | Google Sheet + email |
| Rewards (current) | `rewardsDemo.js` | Browser `localStorage` only |
| Menu / machines / videos | static JS data files | bundled |

## Potential Risks During Migration

- **Env var coupling:** Introducing `import.meta.env.VITE_*` must not throw when unset. Mitigated: `supabaseClient.js` returns `null` and logs a warning instead of crashing.
- **Apps Script URL:** It lives in source (`bookingConfig.js`). It is a public Web App endpoint (not a secret), so it stays as-is. Do not move it behind env vars without re-testing the live flow.
- **`.zip` / `dist` in history:** `rc-cafe-hostinger-upload.zip` may already be tracked; it should be removed from tracking (not from disk) so secrets/builds are not pushed.
- **Bundle size:** Adding `@supabase/supabase-js` increases bundle. Acceptable; tree-shaken and only imported where used.

## Files Most Likely To Break Booking (handle with extreme care)

- `src/data/bookingConfig.js` – all booking API + validation logic.
- `src/pages/Booking.jsx` – booking UI, payload assembly, toastie/drink selection.
- `public/.htaccess` – SPA rewrite rules; breaking this breaks deep links incl. booking.

## Files Safe To Modify / Add

- New `src/lib/`, `src/services/`, `src/hooks/`, `src/types/`, `src/utils/` directories.
- `.gitignore`, `.env.example`, `package.json` (adding dependency only).
- `docs/*` documentation.

## Files That Should NOT Be Touched (this phase)

- `src/data/bookingConfig.js`
- `src/pages/Booking.jsx`
- `src/data/rewardsDemo.js` and reward pages/components (keep demo working)
- Google Apps Script project (external, untouched)
- `public/.htaccess`

## Audit Verdict

The Supabase setup is **additive and isolated**. Booking and the reward demo continue to work unchanged because nothing imports the new `supabaseClient` yet, and the client degrades gracefully when env vars are absent.
