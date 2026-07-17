# Database Migration Guide

## Migration File

`supabase/20260717_booking_approval_calendar.sql`

## Prerequisites

- Supabase project with existing `bookings_mirror`, `booking_slot_capacity`, `profiles` tables
- Existing `create_booking_request_v4`, `set_booking_status`, `cancel_confirmed_booking` RPCs
- Admin with SQL Editor access

## How to Apply

1. Open Supabase Dashboard → SQL Editor
2. Paste the contents of `20260717_booking_approval_calendar.sql`
3. Review each section (14 numbered sections with comments)
4. Execute the full migration

## What It Does (Section by Section)

1. **Expand status CHECK** — adds 'pending' to allowed booking statuses
2. **Add metadata columns** — approved_at, approved_by, rejected_at, rejected_by, rejection_reason, confirmation_email_sent_at, rejection_email_sent_at (all IF NOT EXISTS)
3. **booking_date_overrides table** — full-day closures with RLS
4. **booking_slot_overrides table** — slot-level closures with RLS
5. **Updated create_booking_request_v4** — default status='pending', checks closures, counts pending+confirmed for capacity
6. **Updated set_booking_status** — supports pending→confirmed with approval metadata, atomic capacity recheck
7. **New reject_booking** — sets cancelled + rejection metadata, releases capacity
8. **Updated cancel_confirmed_booking** — handles both pending and confirmed
9. **New refresh_booking_slot_capacity_for** — helper to refresh materialized capacity
10. **mark_confirmation_email_sent / mark_rejection_email_sent** — idempotent email tracking
11. **get_date_availability** — public RPC returning closures + slot usage per date
12. **Updated get_admin_dashboard_stats** — adds pendingBookings count
13. **Revoke anon access** from record_booking_sheet_sync_v3
14. **Performance indexes**

## Safety

- All changes are additive (ADD COLUMN IF NOT EXISTS, CREATE TABLE IF NOT EXISTS)
- No DROP, TRUNCATE, DELETE, or ALTER COLUMN TYPE statements
- Existing data is untouched
- Functions use CREATE OR REPLACE (idempotent)
- Can be re-run safely

## Rollback

To undo (if needed):
- DROP the new tables: `booking_date_overrides`, `booking_slot_overrides`
- The added columns can be left in place (they're nullable and don't affect existing queries)
- Restore previous RPC versions from git history if needed
