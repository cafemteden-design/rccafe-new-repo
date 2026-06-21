# RCC Booking Capacity Backend Contract

The Apps Script source is not included in this repository, so the frontend endpoint and Google Sheet submission have not been replaced. Apply these rules in the deployed Apps Script before treating capacity as race-condition safe.

## Google Sheet settings

- Slot capacity: `8`
- Operating days: `Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday`
- MINI / 30-minute package: inactive or unavailable
- POWER / 45-minute package: active
- MASTER / 60-minute package: active

## Availability GET

For the requested date and slot:

1. Ignore rows whose status is `cancelled` or `canceled`.
2. Read group size from `groupSize`, `group_size`, `players`, or the matching Sheet column.
3. Calculate `usedSpots` as the sum of group size, not the number of rows.
4. Return `available = Math.max(8 - usedSpots, 0)`.
5. Return `status = "FULLY BOOKED"` when available is zero.

Recommended response item:

```json
{
  "slot": "09:00 AM",
  "usedSpots": 6,
  "available": 2,
  "status": "AVAILABLE"
}
```

## Booking POST

Before inserting a booking:

1. Acquire an Apps Script document/script lock.
2. Re-read non-cancelled bookings for the same date and slot.
3. Sum their group sizes.
4. Reject with `{ "status": "slot_full" }` when `usedSpots + requestedGroupSize > 8`.
5. Insert the booking only after this atomic recheck, then release the lock.

The frontend continues to send both legacy and current aliases, including `groupSize`, `group_size`, `players`, `numberOfPlayers`, date/time/package fields, food selections, status and source.
