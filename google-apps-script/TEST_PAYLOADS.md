# RCC Cafe Apps Script V2 Test Payloads

Send requests as JSON with `Content-Type: text/plain;charset=utf-8` or `application/json`. Replace all `TODO_*` values before testing.

```bash
curl -X POST "TODO_WEB_APP_URL" \
  -H "Content-Type: text/plain;charset=utf-8" \
  --data-binary @payload.json
```

These are test records only. Supabase remains authoritative; use IDs from test records created in Supabase where applicable.

## Health

```text
GET TODO_WEB_APP_URL?action=health
```

## bookingCreated

```json
{
  "action": "bookingCreated",
  "timestamp": "2026-06-21T10:00:00+12:00",
  "booking_id": "TODO_TEST_BOOKING_ID",
  "supabase_booking_id": "TODO_SUPABASE_BOOKING_UUID",
  "customer_name": "RCC Test Customer",
  "phone": "0210000000",
  "email": "TODO_TEST_CUSTOMER_EMAIL",
  "booking_date": "2026-07-01",
  "day": "Wednesday",
  "slot_start": "09:00 AM",
  "slot_end": "10:00 AM",
  "slot_label": "09:00 AM - 10:00 AM",
  "remote_spots": 2,
  "gameplay_duration": "45 Minutes",
  "price_per_remote": 45,
  "total_price": 90,
  "toastie_selection": "Ham & Cheese",
  "drink_selection": "Any Black",
  "notes": "Apps Script V2 test",
  "status": "Confirmed",
  "payment_status": "Unpaid",
  "booking_source": "website-v3",
  "last_updated": "2026-06-21T10:00:00+12:00"
}
```

## bookingUpdated

```json
{
  "action": "bookingUpdated",
  "booking_id": "TODO_TEST_BOOKING_ID",
  "supabase_booking_id": "TODO_SUPABASE_BOOKING_UUID",
  "status": "Completed",
  "changed_by_email": "cafemteden@gmail.com",
  "source": "supabase-admin"
}
```

## bookingCancelled

```json
{
  "action": "bookingCancelled",
  "booking_id": "TODO_CANCELLED_TEST_BOOKING_ID",
  "supabase_booking_id": "TODO_CANCELLED_SUPABASE_UUID",
  "status": "Cancelled",
  "cancelled_by": "RCC Manager",
  "cancelled_at": "2026-06-21T10:15:00+12:00",
  "changed_by_email": "cafemteden@gmail.com",
  "reason": "Test cancellation",
  "source": "supabase-admin"
}
```

## rewardCardCreated

```json
{
  "action": "rewardCardCreated",
  "created_at": "2026-06-21T10:20:00+12:00",
  "updated_at": "2026-06-21T10:20:00+12:00",
  "supabase_user_id": "TODO_SUPABASE_USER_UUID",
  "reward_card_id": "TODO_REWARD_CARD_UUID",
  "card_number": "RCC1999",
  "card_token": "TODO_SECURE_TEST_TOKEN",
  "customer_name": "RCC Reward Test",
  "email_address": "TODO_TEST_CUSTOMER_EMAIL",
  "mobile_number": "0210000000",
  "date_of_birth": "1990-01-01",
  "card_status": "Active",
  "current_cycle": 1,
  "current_stamps": 0,
  "lifetime_stamps": 0,
  "total_rewards_redeemed": 0,
  "welcome_gift_status": "Unlocked",
  "notification_enabled": true,
  "home_screen_shortcut_enabled": false,
  "card_url": "https://remotecontrolcafe.co.nz/rewards/card/TODO_SECURE_TEST_TOKEN",
  "welcome_gift": "Buy 1 Get 1 Toastie",
  "last_updated": "2026-06-21T10:20:00+12:00"
}
```

`date_of_birth` and `card_token` are backed up to their dedicated reward-card columns but are redacted from Apps Script execution payload logs.

## rewardStampAdded

```json
{
  "action": "rewardStampAdded",
  "reward_card_id": "TODO_REWARD_CARD_UUID",
  "card_number": "RCC1999",
  "customer_name": "RCC Reward Test",
  "current_cycle": 1,
  "current_stamps": 1,
  "lifetime_stamps": 1,
  "last_stamp_date": "2026-06-21",
  "performed_by": "RCC Staff",
  "staff_email": "mtedencafestaff@gmail.com",
  "notes": "Test stamp from Supabase"
}
```

## rewardRedeemed

```json
{
  "action": "rewardRedeemed",
  "reward_card_id": "TODO_REWARD_CARD_UUID",
  "card_number": "RCC1999",
  "customer_name": "RCC Reward Test",
  "current_cycle": 2,
  "current_stamps": 0,
  "lifetime_stamps": 7,
  "total_rewards_redeemed": 1,
  "last_reward_date": "2026-06-21",
  "gift_name": "TODO_CURRENT_REWARD_NAME",
  "performed_by": "RCC Staff",
  "staff_email": "mtedencafestaff@gmail.com"
}
```

## websiteLeadCreated

```json
{
  "action": "websiteLeadCreated",
  "lead_id": "TODO_WEBSITE_LEAD_ID",
  "timestamp": "2026-06-21T10:30:00+12:00",
  "name": "Website Lead Test",
  "email": "TODO_TEST_CUSTOMER_EMAIL",
  "phone": "0210000000",
  "message": "Apps Script V2 website lead test",
  "source": "website"
}
```

## venueEnquiryCreated

```json
{
  "action": "venueEnquiryCreated",
  "enquiry_id": "TODO_VENUE_ENQUIRY_ID",
  "timestamp": "2026-06-21T10:35:00+12:00",
  "customer_name": "Venue Enquiry Test",
  "email": "TODO_TEST_CUSTOMER_EMAIL",
  "phone": "0210000000",
  "event_type": "Corporate Event",
  "preferred_date": "2026-08-01",
  "group_size": 20,
  "message": "Apps Script V2 venue enquiry test",
  "source": "website"
}
```

## sendEmail

```json
{
  "action": "sendEmail",
  "to": "TODO_TEST_RECIPIENT_EMAIL",
  "subject": "RCC Apps Script V2 email test",
  "plain_body": "This is a controlled RCC Apps Script V2 test email.",
  "html_body": "<p>This is a controlled <strong>RCC Apps Script V2</strong> test email.</p>",
  "metadata": {
    "emailType": "System Test",
    "referenceType": "Test",
    "referenceId": "TODO_EMAIL_TEST_ID",
    "customerName": "RCC Test",
    "recipientEmail": "TODO_TEST_RECIPIENT_EMAIL"
  }
}
```

## Additional Action Names

The same endpoint also supports:

- `backupBooking`
- `bookingUpdated`
- `rewardStampRemoved`
- `rewardUnlocked`
- `welcomeGiftRedeemed`
- `rewardNotificationSent`
- `retryFailedEmail`
- `logEvent`
- `updateSystemHealth`

The website compatibility action `createBooking` is internally mapped to `bookingCreated`. It performs backup/email/logging only and never calculates capacity.
