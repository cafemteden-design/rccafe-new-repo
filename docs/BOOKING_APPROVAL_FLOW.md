# Booking Approval Flow

## Customer Submits Booking

1. Customer fills booking form on `/booking`
2. Frontend calls `createPendingBooking()` → Supabase RPC `create_booking_request_v4`
3. RPC atomically: checks date not closed, slot not closed, capacity available, creates booking with `status = 'pending'`
4. Customer sees "Booking Request Received — Pending Approval" with RCC reference
5. Google Sheet sync fires asynchronously (non-blocking)

## Admin Approves

1. Admin opens Bookings page → filters by "Pending"
2. Clicks Approve on a pending booking
3. Frontend calls `approveBooking(id)` → RPC `set_booking_status('confirmed')`
4. RPC atomically rechecks capacity, sets `status = 'confirmed'`, records `approved_at`
5. If capacity exceeded since booking was created, returns error — booking stays pending
6. Frontend sends confirmation email via Apps Script (`syncGoogleSheet('sendEmail', { emailType: 'booking_confirmed', ... })`)
7. On success, calls `markConfirmationEmailSent(id)` — idempotent, prevents duplicate emails
8. Sheet sync fires to update status

## Admin Rejects

1. Admin clicks Reject on a pending booking
2. Modal shows predefined reasons + optional custom note
3. Frontend calls `rejectBooking(id, reason, note)` → RPC `reject_booking`
4. RPC sets `status = 'cancelled'`, records `rejected_at`, `rejected_by`, `rejection_reason`
5. Capacity is released
6. Frontend sends rejection email via Apps Script (`emailType: 'booking_rejected'`)
7. On success, calls `markRejectionEmailSent(id)`
8. Sheet sync fires to update status

## Email Idempotency

- `confirmation_email_sent_at`: set once on first successful send, checked before sending
- `rejection_email_sent_at`: set once on first successful send, checked before sending
- If email fails, booking status is preserved. Admin sees warning and can retry via Resend Email button.

## Capacity During Approval

- Pending bookings hold/consume capacity from the moment they're created
- This prevents double-booking while awaiting admin review
- Approval rechecks atomically — if another booking filled the slot in the meantime, approval fails safely
- Rejection releases held capacity immediately
