# RCC Cafe Final QA Report

Date: 2026-06-21

## Result

- Production build: PASS
- Static build validation: PASS
- Admin V3 contract suite: PASS
- Supabase schema migration: ready in `supabase/final-admin-v3.sql`
- Browser automation: not completed in this run because the in-app browser connection could not be initialized. No live customer records were mutated.

## Verified Contracts

- New bookings are created as `pending` in Supabase.
- Pending, rejected and cancelled bookings consume no capacity.
- Approval is serialized by a Postgres advisory transaction lock.
- Approved capacity is the sum of `group_size`, not booking rows.
- Capacity scenarios: `5+3` pass, `6+2` pass, `6+3` reject, `8+1` reject.
- Booking V3 has no MINI/POWER/MASTER dependency; it stores gameplay duration, remote spots and per-remote pricing.
- Admin bookings support view, edit, approve, reject, cancel, resend email and Sheet sync.
- Google Sheet failures return warnings and never roll back Supabase success.
- Rewards support Email + DOB login, duplicate email/mobile checking, multiple stamps, undo, reward redemption, welcome gift, block/unblock and customer notifications.
- Customer-specific notifications are filtered by reward card ID.
- Existing reward cards, events, cycles and identifiers are preserved.

## Automated Commands

```text
npm run test:admin-v3
npm run build
```

## Live Integration QA Required After Migration

Run these with a dedicated test booking/card, then archive or cancel the test records:

1. Create booking and confirm status is Pending.
2. Approve `5+3` and `6+2` remote scenarios.
3. Confirm `6+3` and `8+1` approvals return remaining-capacity errors.
4. Reject and cancel an approved test booking; confirm capacity is released in real time.
5. Confirm Apps Script receives bookingCreated/Approved/Rejected/Cancelled backup events.
6. Register a new reward card with a unique email/mobile and log in with Email + DOB.
7. Add one and multiple stamps, undo the last stamp, reach 7/7 and redeem.
8. Publish global and customer-specific notifications; verify visibility on the correct card only.
9. Verify admin and customer emails in `EMAIL_LOGS`.

## Known Deployment Dependency

`supabase/final-admin-v3.sql` must be run in the target Supabase project before deploying this frontend. The latest `google-apps-script/Code.gs` must be deployed as a new Web App version from `cafemteden@gmail.com` for V2 Sheet/email actions to work.
