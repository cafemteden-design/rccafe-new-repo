# Production Deployment Checklist

## Pre-Deployment

- [ ] Review all changes in the PR
- [ ] Confirm no secret keys in frontend bundle (`grep -r "service_role" dist/`)
- [ ] Verify `vite build` passes cleanly
- [ ] Verify no console errors in dev mode

## Database Migration

- [ ] Open Supabase SQL Editor
- [ ] Run `supabase/20260717_booking_approval_calendar.sql`
- [ ] Verify `booking_date_overrides` table created
- [ ] Verify `booking_slot_overrides` table created
- [ ] Verify `bookings_mirror` has new columns (approved_at, rejected_at, etc.)
- [ ] Verify `get_date_availability` RPC works: `SELECT get_date_availability('2026-07-20')`
- [ ] Verify `get_admin_dashboard_stats` returns `pendingBookings` field
- [ ] Verify anon cannot call `record_booking_sheet_sync_v3`

## Apps Script Updates

- [ ] Add `booking_confirmed` email handler to Code.gs
- [ ] Add `booking_rejected` email handler to Code.gs
- [ ] Test confirmation email sends correctly
- [ ] Test rejection email sends correctly with reason
- [ ] Verify existing booking-created emails still work

## Frontend Deployment

- [ ] Build: `npm run build`
- [ ] Upload `dist/` to Hostinger
- [ ] Verify `.htaccess` SPA routing is in place
- [ ] Clear CDN/browser cache if applicable

## Post-Deployment Verification

- [ ] Public booking page loads
- [ ] Can select date, time, remotes, food
- [ ] Booking creates as "pending" (not "confirmed")
- [ ] Success screen says "Pending Approval"
- [ ] Admin bookings page shows pending filter
- [ ] Can approve a pending booking
- [ ] Confirmation email sends
- [ ] Can reject a pending booking with reason
- [ ] Rejection email sends
- [ ] Booking Calendar page loads at `/admin/booking-calendar`
- [ ] Can close a full day
- [ ] Can close individual slot
- [ ] Public page shows closed date/slot as unavailable
- [ ] Dashboard shows pending count
- [ ] Rewards/scanner still works
- [ ] Google Sheet receives sync updates

## Environment Variables

No new environment variables required. Existing Supabase anon key and Apps Script URL remain unchanged.
