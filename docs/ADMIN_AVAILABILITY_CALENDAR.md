# Admin Availability Calendar

Route: `/admin/booking-calendar`

## Features

### Full-Year View
- 12 month cards in a responsive grid
- Each day shows visual state: open, booked, pending, closed, full
- Year navigation with prev/next buttons
- Today highlighted

### Visual Day States
- **White**: Open, no bookings
- **Green tint**: Has bookings, capacity available
- **Orange tint**: Fully booked (8/8 remotes)
- **Red tint**: Manually closed day
- **Lock icon**: Day closed
- **Red dot**: Has slot-level closures
- **Orange dot**: Has pending bookings

### Date Detail Panel
Click any date to open a slide-out panel showing:
- Date and day name
- Full-day closure status and reason
- Warning banner if existing bookings exist
- Reopen/close day button
- Link to filtered bookings page
- Per-slot breakdown:
  - Slot time label
  - Pending remotes count
  - Confirmed remotes count
  - Remaining capacity
  - Capacity bar visualization
  - Close/reopen slot button

### Full-Day Closure
- Admin selects a reason from predefined list or enters custom reason
- Predefined: Private booking, Venue fully booked, Public holiday, Maintenance, Staff unavailable, Special event, Operational closure, Other
- All slots become unavailable for new public bookings
- Existing bookings are **not** cancelled — admin sees warning
- Stored in `booking_date_overrides` table

### Slot-Level Closure
- Admin can close individual time slots on any date
- Same reason selection as full-day
- Only the closed slot becomes unavailable
- Other slots remain open
- Stored in `booking_slot_overrides` table

### Public Impact
- Closed dates/slots appear as "Unavailable" in the public booking page
- `get_date_availability` RPC returns closure info
- `create_booking_request_v4` rejects bookings for closed dates/slots at database level

## Access Control
- Only super_admin, admin, manager roles can access
- RLS enforces: anon can read closures (for public availability), only admin can write
