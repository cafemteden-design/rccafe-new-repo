# Email Configuration

## Provider

Emails are sent via Google Apps Script using `MailApp.sendEmail()`. No paid email provider is introduced.

## Email Triggers

### Confirmation Email (on approval)
- Triggered by: Admin clicks Approve on a pending booking
- Flow: `approveBooking()` → `syncGoogleSheet('sendEmail', { emailType: 'booking_confirmed', ... })` → `markConfirmationEmailSent()`
- Subject: "Your RCC Booking Is Confirmed – [Reference]"
- Content: Customer name, reference, date, time, remotes, gameplay, food/drink, total, location

### Rejection Email (on rejection)
- Triggered by: Admin clicks Reject and confirms with reason
- Flow: `rejectBooking()` → `syncGoogleSheet('sendEmail', { emailType: 'booking_rejected', rejectionReason, ... })` → `markRejectionEmailSent()`
- Subject: "Update Regarding Your RCC Booking Request – [Reference]"
- Content: Polite notification, reason, rebooking link

## Idempotency

| Column | Purpose |
|--------|---------|
| `confirmation_email_sent_at` | Timestamp of first successful confirmation email |
| `rejection_email_sent_at` | Timestamp of first successful rejection email |

The frontend checks these before sending. If already set, the email step is skipped.

## Apps Script Updates Required

The existing `Code.gs` needs two new email handler cases in the `doPost()` / email routing:

1. `booking_confirmed` — send confirmation email template
2. `booking_rejected` — send rejection email with reason and rebooking link

These should be added to the existing `sendBookingCreatedEmails_()` pattern or as new handler functions.

## Failure Handling

- Email failure does not roll back the booking status change
- Admin sees a warning toast: "Booking approved but email failed"
- Admin can retry via the "Email" button on any booking row
- Failed email state is visible but does not block operations
