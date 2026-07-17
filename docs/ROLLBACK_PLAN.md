# Rollback Plan

## If Issues Arise After Deployment

### Frontend Rollback (immediate)
1. Revert to the previous `dist/` build on Hostinger
2. Or: `git checkout main -- src/` and rebuild

### Database Rollback (careful)
The migration is additive — no existing data was changed. To undo:

1. **New tables** (safe to drop if no closures were created):
   ```sql
   DROP TABLE IF EXISTS booking_slot_overrides;
   DROP TABLE IF EXISTS booking_date_overrides;
   ```

2. **New columns** (safe to leave — they're nullable):
   - approved_at, approved_by, rejected_at, rejected_by, rejection_reason
   - confirmation_email_sent_at, rejection_email_sent_at
   - These don't affect existing queries. Only drop if needed.

3. **RPCs** — restore previous versions from git:
   - `create_booking_request_v4` — remove closure checks, change default status back to 'confirmed'
   - `set_booking_status` — remove approval metadata
   - Restore `reject_booking`, `mark_*_email_sent`, `get_date_availability` can be dropped

4. **Status constraint** — remove 'pending' if reverting fully:
   ```sql
   ALTER TABLE bookings_mirror DROP CONSTRAINT IF EXISTS bookings_mirror_status_check;
   ALTER TABLE bookings_mirror ADD CONSTRAINT bookings_mirror_status_check
     CHECK (status IN ('confirmed','cancelled','completed','no_show'));
   ```
   **Warning**: Only do this if no bookings have `status = 'pending'`.

### Partial Rollback
If only the calendar is problematic:
- Remove the route from App.jsx
- Remove nav entry from adminConfig.js
- The calendar tables can stay — they're inert without the UI

If only the approval flow is problematic:
- Revert Booking.jsx to auto-confirm
- Revert AdminBookingsV2.jsx to remove approve/reject buttons
- Change RPC default status back to 'confirmed'

## Data Safety
- No production data was deleted or modified by this migration
- All changes are additive
- Rollback does not require data recovery
