# Application Compatibility Report

**Date:** 2026-07-17
**Migration:** `20260717_booking_approval_calendar_final.sql`

This report compares every `.rpc()` and `.from()` call in the frontend against the post-migration database schema.

---

## RPC Compatibility

### `create_booking_request_v4` — bookingV2.js:27

| Frontend param | Migration param | Match |
|---|---|---|
| p_customer_name | p_customer_name text | OK |
| p_customer_email | p_customer_email text | OK |
| p_customer_phone | p_customer_phone text | OK |
| p_booking_date | p_booking_date date | OK |
| p_booking_time | p_booking_time text | OK |
| p_gameplay_duration | p_gameplay_duration integer | OK |
| p_price_per_remote | p_price_per_remote numeric | OK |
| p_remote_spots | p_remote_spots integer | OK |
| p_toastie_selection | p_toastie_selection text | OK |
| p_drink_selection | p_drink_selection text | OK |
| p_notes | p_notes text | OK |
| p_source | p_source text | OK |
| **p_booking_reference** | **NOT IN FUNCTION** | **BREAKING** |
| p_business_hours_snapshot | p_business_hours_snapshot jsonb | OK |
| p_per_remote_selections | p_per_remote_selections jsonb | OK |

**Issue:** Frontend passes `p_booking_reference` (bookingV2.js:25) which does not exist in the function signature (14 params). PostgREST will reject this with an error about unexpected parameters.

**Fix required in `src/services/bookingV2.js`:** Remove `p_booking_reference` from `baseArgs`. The function generates its own `RCC-XXXX` reference via `rcc_booking_number_seq`.

**Severity:** CRITICAL — booking creation will fail.

---

### `set_booking_status` — bookingV2.js:46, 69

| Frontend param | Migration param | Match |
|---|---|---|
| p_booking_id (uuid) | p_booking_id uuid | OK |
| p_status (text) | p_status text | OK |
| p_admin_note (text) | p_admin_note text | OK |

**Status:** OK — function accepts `confirmed`, `cancelled`, `completed`, `no_show`.

Frontend calls `approveBooking()` with `p_status: 'confirmed'` → function handles `pending → confirmed` transition. Correct.

---

### `reject_booking` — bookingV2.js:56

| Frontend param | Migration param | Match |
|---|---|---|
| p_booking_id (uuid) | p_booking_id uuid | OK |
| p_rejection_reason (text) | p_rejection_reason text | OK |
| p_admin_note (text) | p_admin_note text | OK |

**Status:** OK — new function created by migration.

---

### `cancel_confirmed_booking` — bookingV2.js:80

| Frontend param | Migration param | Match |
|---|---|---|
| p_booking_id (uuid) | p_booking_id uuid | OK |
| p_cancellation_reason (text) | p_cancellation_reason text | OK |

**Status:** OK — new function created by migration.

---

### `mark_confirmation_email_sent` — bookingV2.js:90

| Frontend param | Migration param | Match |
|---|---|---|
| p_booking_id (uuid) | p_booking_id uuid | OK |

**Status:** OK — new function, returns boolean.

---

### `mark_rejection_email_sent` — bookingV2.js:97

| Frontend param | Migration param | Match |
|---|---|---|
| p_booking_id (uuid) | p_booking_id uuid | OK |

**Status:** OK — new function, returns boolean.

---

### `get_date_availability` — bookingV2.js:104

| Frontend param | Migration param | Match |
|---|---|---|
| p_date (date string) | p_date date | OK |

**Status:** OK — new function, returns jsonb.

---

### `record_booking_sheet_sync_v3` — Booking.jsx:651

| Frontend param | Migration param | Match |
|---|---|---|
| p_booking_id (uuid) | p_booking_id uuid | OK |
| p_public_booking_id (text) | p_public_booking_id text | OK |
| p_success (boolean) | p_success boolean | OK |
| p_message (text) | p_message text | OK |

**Status:** OK — new function, returns void.

---

### `get_admin_dashboard_stats` — AdminDashboard.jsx:27

**Status:** OK — updated function returns all original keys plus `pendingBookings`. Frontend reads `stats.pendingBookings` (line 47). Backward-compatible.

---

### `update_booking_admin_v4` — AdminBookingsV2.jsx:217

**Status:** NOT MODIFIED by this migration. Existing production function preserved.

---

### `create_booking_request_v3` — AdminBookingsV2.jsx:283 (fallback)

**Status:** NOT MODIFIED by this migration. Existing production function preserved.

---

## Table Access Compatibility

### `booking_date_overrides` — AdminBookingCalendar.jsx:61, 97, 103

| Operation | Schema match | Notes |
|---|---|---|
| `.select('*')` | OK | Table created by migration |
| `.delete().eq('id', ...)` | OK | id is uuid PK |
| `.upsert({...}, {onConflict: 'booking_date'})` | OK | booking_date has UNIQUE constraint |

**RLS:** Admin manages via `is_admin()` policy. Calendar page uses `useAdminAuth()`.

---

### `booking_slot_overrides` — AdminBookingCalendar.jsx:62, 114, 120

| Operation | Schema match | Notes |
|---|---|---|
| `.select('*')` | OK | Table created by migration |
| `.delete().eq('id', ...)` | OK | id is uuid PK |
| `.upsert({...}, {onConflict: 'booking_date,slot_start'})` | OK | Composite UNIQUE constraint |

**RLS:** Admin manages via `is_admin()` policy.

---

### `booking_slot_capacity` — bookingV2.js:111

| Operation | Schema match | Notes |
|---|---|---|
| `.select('slot_time,approved_spots,updated_at').eq(...)` | OK | All columns exist |

**RLS:** Public read via `slot_capacity_public_read` policy.

---

### `bookings_mirror` — multiple files

All `.from('bookings_mirror')` queries use existing columns. No issues.

---

## Status Value Compatibility

### CRITICAL: 'approved' vs 'confirmed' mismatch

Production has 79 bookings with `status = 'approved'`. The migration does NOT convert these to 'confirmed' — both values coexist. This means:

**AdminBookingsV2.jsx:**
- Line 13: `FILTERS = ['all', 'pending', 'confirmed', ...]` — **Missing 'approved'**. Existing approved bookings won't appear under the 'confirmed' filter tab. They'll only show under 'all'.
- Line 67: Filter logic `row.status === filter` — approved bookings won't match 'confirmed' filter.

**Fix required:** Either:
- (A) Add 'approved' to FILTERS: `['all', 'pending', 'confirmed', 'approved', ...]`
- (B) Treat 'approved' as alias of 'confirmed' in filter logic: `(filter === 'confirmed' ? ['confirmed', 'approved'].includes(row.status) : row.status === filter)`

**AdminBookingCalendar.jsx:**
- Line 63: `.in('status', ['pending', 'confirmed'])` — **Missing 'approved'**. Existing approved bookings won't count toward calendar capacity display.

**Fix required:** Change to `.in('status', ['pending', 'confirmed', 'approved'])`

**AdminDashboard.jsx:**
- Line 29: `.eq('status','confirmed')` — **Missing 'approved'**. The "Confirmed" panel won't show existing approved bookings.

**Fix required:** Change to `.in('status', ['confirmed', 'approved'])`

- Line 47: `stats.confirmedBookings` — **OK** — the updated `get_admin_dashboard_stats` already counts BOTH 'confirmed' AND 'approved' in the confirmedBookings stat.

**Severity:** MEDIUM — existing bookings won't display correctly under filters/panels, but no data loss or function errors.

---

## Summary of Required Frontend Fixes

| # | File | Line | Issue | Severity |
|---|---|---|---|---|
| 1 | `src/services/bookingV2.js` | 25 | Remove `p_booking_reference` from `baseArgs` | CRITICAL |
| 2 | `src/pages/admin/AdminBookingsV2.jsx` | 13,67 | Handle 'approved' status in filters | MEDIUM |
| 3 | `src/pages/admin/AdminBookingCalendar.jsx` | 63 | Add 'approved' to status filter | MEDIUM |
| 4 | `src/pages/admin/AdminDashboard.jsx` | 29 | Add 'approved' to confirmed query | MEDIUM |

All other RPC calls, table queries, and column references are compatible with the post-migration schema.
