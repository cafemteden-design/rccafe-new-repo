# Google Sheet Sync Architecture

## Role Change

Google Sheets is now a **secondary mirror** — not the source of truth.

### Before (old flow)
```
Customer → Apps Script (blocking) → Google Sheet → Supabase (fire-and-forget)
```

### After (new flow)
```
Customer → Supabase RPC (blocking) → pending booking + RCC reference
                ↓ (async, non-blocking)
         Apps Script → Google Sheet mirror
```

## Sync Events

| Event | Trigger | Apps Script Action |
|-------|---------|-------------------|
| `bookingCreated` | New booking saved in Supabase | Upsert row in Sheet |
| `bookingUpdated` | Status change (approve, complete, no-show) | Update row in Sheet |
| `bookingCancelled` | Cancellation or rejection | Update row in Sheet |
| `sendEmail` | Admin approves or rejects | Send confirmation/rejection email |

## Email Types

| emailType | When | Content |
|-----------|------|---------|
| `booking_confirmed` | Admin approves pending booking | Confirmation with details |
| `booking_rejected` | Admin rejects pending booking | Polite rejection with rebooking link |

## Failure Handling

- Sheet sync failure → booking status unchanged, error logged in `sheet_sync_error` column
- Email failure → booking status unchanged, admin sees warning toast, can retry
- Failed syncs visible in Admin Dashboard and Diagnostics page
- No automatic retry — admin can manually resend/resync

## Deduplication

- Uses `booking_id` (RCC reference) and Supabase `id` (UUID) as stable keys
- Apps Script `handleBookingAction_()` upserts by booking reference
- Prevents duplicate Sheet rows on retry

## Security

- `record_booking_sheet_sync_v3` RPC: anon access revoked (was a security concern)
- Sheet sync now happens client-side via authenticated admin actions
- Public booking sync uses the Apps Script web endpoint directly (POST)

## Configuration

- Apps Script URL configured in `src/data/bookingConfig.js` as `BOOKING_API_URL`
- `isGoogleSheetSyncConfigured()` checks for valid Apps Script URL format
- If not configured, sync silently skips with a dev-mode warning
