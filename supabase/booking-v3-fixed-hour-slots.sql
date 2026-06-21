-- RCC Cafe Booking V3 fixed-hour compatibility settings.
-- Run after booking-system-v2.sql. This is idempotent and does not alter booking data.

update public.booking_settings
set capacity_per_slot = 8,
    slot_capacity = 8,
    max_group_size = 8,
    maximum_group_size = 8,
    slot_count = 8,
    slot_duration = 60,
    slot_interval_minutes = 60,
    opening_time = '09:00'::time,
    closing_time = '17:00'::time,
    operating_hours = '{"start":"09:00","end":"17:00"}'::jsonb,
    weekend_enabled = true,
    monday_enabled = true,
    tuesday_enabled = true,
    wednesday_enabled = true,
    thursday_enabled = true,
    friday_enabled = true,
    saturday_enabled = true,
    sunday_enabled = true,
    notice_text = 'Online bookings are available 7 days a week. Choose one hourly slot with up to 8 remotes.'
where id = 1;
