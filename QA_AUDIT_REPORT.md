# RC Cafe Booking QA Audit

Date: 2026-06-05

## Summary

Frontend booking flow is production-ready after fixes in this audit.

Remaining production blocker is the live Google Apps Script backend:

- Availability GET returns Google Apps Script HTML error: `Script function not found: doGet`.
- Booking POST returns JSON error: `phone is not defined`.
- Because of this, Google Sheet save, email notification, and admin status persistence cannot be verified from the frontend.

The frontend is sending the correct booking payload, including phone and status fields.

## Tested Scenarios

### New Booking Flow

Passed until backend submit:

- Date selection auto-advances to package selection.
- Package selection auto-advances to slot selection.
- Slot selection auto-advances to customer details.
- Customer details advance to review.
- Final review displays trust card, important info, checkbox, and `Reserve My Slot`.
- Submit handles backend failure with a friendly inline error.

### Validation

Passed:

- Empty name shows validation.
- Empty phone shows `Please enter your phone number`.
- Invalid phone shows `Please enter your phone number`.
- Empty email shows validation.
- Invalid email shows validation.
- Checkbox unchecked shows `Please confirm your attendance before reserving your slot`.
- Weekend date is not selectable.
- Past dates are disabled.

### Slot Logic

Passed:

- 15-minute slots: 28 slots, last slot ends at 4:00 PM.
- 30-minute slots: 14 slots, last slot ends at 4:00 PM.
- 45-minute slots: 9 slots, last slot ends at 3:45 PM.
- 60-minute slots: 7 slots, last slot ends at 4:00 PM.
- Weekend slot generation returns zero slots.
- Mock fully booked availability disables matching slot.

Backend-dependent:

- Same-slot double booking requires Apps Script capacity enforcement.
- Live fully booked refresh requires Apps Script `doGet`.

### Browser/Console

Passed:

- Production preview routes return 200:
  - `/`
  - `/booking`
  - `/menu`
  - `/contact`
- In-app browser loaded `/booking`.
- No browser console warnings/errors were reported during the tested flow.

### Responsive/UI

Reviewed:

- Booking page uses responsive grid/card layout.
- Slot buttons are large tap targets.
- Form fields are full-width on mobile layouts.
- Final review card is compact and mobile-friendly.
- Horizontal overflow check passed in browser DOM audit.

Fixed in this audit:

- Booking fields now have accessible label/input wiring.
- Phone validation now rejects non-phone text such as `abcdef`.
- Final attendance checkbox now shows a validation message instead of silently blocking submission.

### Google Sheet / Email / Admin Status

Blocked by backend:

- Booking ID storage not verified.
- Name storage not verified.
- Phone storage not verified.
- Email storage not verified.
- Date/time/package storage not verified.
- Email confirmation not verified.
- Admin statuses not verified.

Frontend sends:

- `bookingStatus: "Pending Confirmation"`
- `adminStatus: "Pending Confirmation"`

Admin status options documented:

- Pending Confirmation
- Confirmed
- Completed
- Cancelled
- No Show

## Required Backend Fix Before Final Launch

Update Google Apps Script using the guidance in:

`APPS_SCRIPT_BOOKING_FIX.md`

Minimum required fixes:

- Add/fix `doGet(e)` so availability endpoint returns JSON for `?date=YYYY-MM-DD`.
- In `doPost(e)`, define `phone` from parsed request data before using it.
- Return success as:

```json
{
  "status": "success",
  "bookingId": "RCC-0001"
}
```

After backend fix, rerun:

- Date -> Package -> Slot -> Details -> Submit.
- Confirm row appears in Google Sheet.
- Confirm admin/client email is sent.
- Confirm status defaults to `Pending Confirmation`.
