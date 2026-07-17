# Supabase Booking Architecture

## Data Flow

```
Customer → Booking.jsx → Supabase RPC (atomic) → pending booking
                                ↓ (async, non-blocking)
                         Google Sheet mirror
```

## Status Lifecycle

```
pending → confirmed (admin approve)
pending → cancelled  (admin reject — with rejection metadata)
confirmed → completed (admin)
confirmed → no_show   (admin)
confirmed → cancelled (admin cancel)
pending → cancelled   (admin cancel)
```

## Capacity Model

- Max 8 remotes per slot (configurable via booking_settings)
- Both `pending` and `confirmed` bookings consume capacity
- Capacity enforced atomically via `pg_advisory_xact_lock` in `create_booking_request_v4`
- Approval rechecks capacity atomically via `set_booking_status`
- Cancelled/rejected bookings release capacity

## Key RPCs

| RPC | Purpose | Access |
|-----|---------|--------|
| `create_booking_request_v4` | Create pending booking with atomic capacity check | anon (public booking) |
| `set_booking_status` | Transition status (approve, complete, no-show) | authenticated admin |
| `reject_booking` | Reject with reason, release capacity | authenticated admin |
| `cancel_confirmed_booking` | Cancel with reason | authenticated admin |
| `get_date_availability` | Public date/slot availability | anon (read-only) |
| `get_admin_dashboard_stats` | Dashboard KPIs including pending count | authenticated admin |
| `mark_confirmation_email_sent` | Idempotent email tracking | authenticated admin |
| `mark_rejection_email_sent` | Idempotent email tracking | authenticated admin |

## Tables

| Table | Purpose |
|-------|---------|
| `bookings_mirror` | All bookings (primary) |
| `booking_slot_capacity` | Materialized slot usage (auto-maintained) |
| `booking_date_overrides` | Full-day closures |
| `booking_slot_overrides` | Individual slot closures |
| `booking_settings` | Runtime config (capacity, hours, etc.) |

## RLS Summary

- `bookings_mirror`: anon can insert via RPC only; admin can read/update
- `booking_date_overrides`: anon can read; admin can read/insert/update/delete
- `booking_slot_overrides`: anon can read; admin can read/insert/update/delete
- `booking_slot_capacity`: anon can read; system-maintained

## Timezone

All date operations use `Pacific/Auckland` (NZ). Never hardcode UTC offset.
