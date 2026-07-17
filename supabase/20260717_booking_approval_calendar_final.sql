-- ============================================================
-- FINAL MIGRATION: Booking Approval Workflow + Availability Calendar
-- Date: 2026-07-17
-- Adapted to ACTUAL production schema from preflight audit.
--
-- PRECONDITIONS (verified by preflight 2026-07-17):
--   PostgreSQL 17.6
--   bookings_mirror: 94 rows, statuses = pending/approved/rejected/cancelled
--   status CHECK = ('pending','approved','rejected','cancelled','completed','no_show')
--   cancelled_by: uuid FK to auth.users (NOT text)
--   activity_logs columns: actor_id, action, module, record_id, details
--   auth helpers: is_admin(), is_staff() exist
--   booking_date_overrides: DOES NOT EXIST
--   booking_slot_overrides: DOES NOT EXIST
--   Partial apply from failed migration: approved_at, approved_by, rejected_at,
--     rejected_by columns exist. rejection_reason + email columns do NOT.
--   status default already changed to 'pending' by partial apply.
--   create_booking_request_v4 has 14 args (no p_booking_reference).
--   cancel_confirmed_booking, record_booking_sheet_sync_v3 do NOT exist.
--   refresh_booking_slot_capacity(date,text) returns integer (original).
--
-- SAFETY:
--   All DDL is additive (ADD COLUMN IF NOT EXISTS, CREATE TABLE IF NOT EXISTS).
--   No DROP TABLE, TRUNCATE, DELETE, or data rewriting.
--   Status constraint expanded (never narrowed).
--   Existing 'approved'/'rejected' statuses preserved as-is.
--   Functions use CREATE OR REPLACE (idempotent).
--   Policies use DROP IF EXISTS + CREATE (idempotent).
--   Transaction-wrapped for atomicity.
-- ============================================================

BEGIN;

-- ============================================================
-- PRECONDITION CHECKS — fail early if schema doesn't match
-- ============================================================
DO $prechecks$
BEGIN
  -- Verify bookings_mirror exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'bookings_mirror'
  ) THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: bookings_mirror table does not exist';
  END IF;

  -- Verify booking_slot_capacity exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'booking_slot_capacity'
  ) THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: booking_slot_capacity table does not exist';
  END IF;

  -- Verify profiles table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: profiles table does not exist';
  END IF;

  -- Verify is_admin() and is_staff() exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'is_admin'
  ) THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: is_admin() function does not exist';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'is_staff'
  ) THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: is_staff() function does not exist';
  END IF;
END;
$prechecks$;


-- ============================================================
-- 1. Expand status CHECK constraint to include 'confirmed'
--    Production currently allows: pending, approved, rejected, cancelled, completed, no_show
--    We add 'confirmed' so both old ('approved') and new ('confirmed') coexist.
--    We do NOT remove 'approved' or 'rejected' — existing data uses them.
-- ============================================================
ALTER TABLE public.bookings_mirror
  DROP CONSTRAINT IF EXISTS bookings_mirror_status_check;

ALTER TABLE public.bookings_mirror
  ADD CONSTRAINT bookings_mirror_status_check
  CHECK (status IN ('pending', 'confirmed', 'approved', 'rejected', 'cancelled', 'completed', 'no_show'));


-- ============================================================
-- 2. Add missing columns from partially applied migration
--    approved_at, approved_by, rejected_at, rejected_by already exist.
--    Adding only: rejection_reason, confirmation_email_sent_at, rejection_email_sent_at
--    Also: cancellation_reason (may or may not exist from 20260711)
-- ============================================================
ALTER TABLE public.bookings_mirror
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS confirmation_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_reason text;


-- ============================================================
-- 3. Create booking_date_overrides table (full-day closures)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.booking_date_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_date date NOT NULL UNIQUE,
  is_closed boolean NOT NULL DEFAULT true,
  reason text,
  admin_note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_date_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read date overrides" ON public.booking_date_overrides;
CREATE POLICY "Public can read date overrides"
  ON public.booking_date_overrides FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Staff can manage date overrides" ON public.booking_date_overrides;
CREATE POLICY "Staff can manage date overrides"
  ON public.booking_date_overrides FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- 4. Create booking_slot_overrides table (slot-level closures)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.booking_slot_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_date date NOT NULL,
  slot_start text NOT NULL,
  is_closed boolean NOT NULL DEFAULT true,
  reason text,
  admin_note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_date, slot_start)
);

ALTER TABLE public.booking_slot_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read slot overrides" ON public.booking_slot_overrides;
CREATE POLICY "Public can read slot overrides"
  ON public.booking_slot_overrides FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Staff can manage slot overrides" ON public.booking_slot_overrides;
CREATE POLICY "Staff can manage slot overrides"
  ON public.booking_slot_overrides FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- 5. Update create_booking_request_v4
--    Adds: closure checks, pending+confirmed+approved capacity counting
--    Matches EXACT production signature (14 args, no p_booking_reference).
--    Uses hashtextextended() as original. Uses is_valid_booking_slot().
--    Uses rcc_booking_number_seq. Status = 'pending'.
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_booking_request_v4(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_booking_date date,
  p_booking_time text,
  p_gameplay_duration integer,
  p_price_per_remote numeric,
  p_remote_spots integer,
  p_toastie_selection text DEFAULT NULL,
  p_drink_selection text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_source text DEFAULT 'website-v4',
  p_business_hours_snapshot jsonb DEFAULT '{}'::jsonb,
  p_per_remote_selections jsonb DEFAULT '[]'::jsonb
)
RETURNS public.bookings_mirror
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn_create_v4$
DECLARE
  cfg public.booking_settings;
  created public.bookings_mirror;
  next_number bigint;
  configured_price numeric;
  selections jsonb := COALESCE(p_per_remote_selections, '[]'::jsonb);
  first_selection jsonb;
  hours_snapshot jsonb;
  capacity integer;
  used integer;
  normalized_drink text;
  v_day_closed boolean;
  v_slot_closed boolean;
BEGIN
  SELECT * INTO cfg FROM public.booking_settings WHERE id = 1;
  IF NOT FOUND OR NOT COALESCE(cfg.online_booking_enabled, true) THEN
    RAISE EXCEPTION 'Online booking is currently unavailable';
  END IF;
  IF length(trim(COALESCE(p_customer_name, ''))) < 2 THEN
    RAISE EXCEPTION 'Customer name is required';
  END IF;
  IF trim(COALESCE(p_customer_phone, '')) = '' THEN
    RAISE EXCEPTION 'Phone is required';
  END IF;
  IF trim(COALESCE(p_customer_email, '')) !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' THEN
    RAISE EXCEPTION 'A valid email is required';
  END IF;
  IF p_booking_date < (now() AT TIME ZONE 'Pacific/Auckland')::date THEN
    RAISE EXCEPTION 'Past dates cannot be booked';
  END IF;
  IF NOT public.is_valid_booking_slot(p_booking_date, p_booking_time) THEN
    RAISE EXCEPTION 'This booking slot is unavailable';
  END IF;
  IF p_remote_spots < 1 OR p_remote_spots > LEAST(COALESCE(cfg.max_group_size, 8), COALESCE(cfg.capacity_per_slot, 8)) THEN
    RAISE EXCEPTION 'Remote spots must be between 1 and %', LEAST(COALESCE(cfg.max_group_size, 8), COALESCE(cfg.capacity_per_slot, 8));
  END IF;
  IF p_gameplay_duration NOT IN (45, 60) THEN
    RAISE EXCEPTION 'Gameplay duration must be 45 or 60 minutes';
  END IF;
  IF jsonb_typeof(selections) <> 'array' OR jsonb_array_length(selections) <> p_remote_spots THEN
    RAISE EXCEPTION 'One toastie and one drink selection is required for every remote';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(selections) item WHERE trim(COALESCE(item ->> 'toastie', '')) = '') THEN
    RAISE EXCEPTION 'Every remote requires a toastie selection';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(selections) item WHERE COALESCE(item ->> 'coffee', item ->> 'drink') NOT IN ('Any Black', 'Flat White / Latte', 'Hot Choco', 'Cappuccino', 'Fluffy')) THEN
    RAISE EXCEPTION 'Every remote requires a valid RCC coffee choice';
  END IF;

  first_selection := selections -> 0;
  normalized_drink := COALESCE(NULLIF(trim(COALESCE(p_drink_selection, '')), ''), first_selection ->> 'coffee', first_selection ->> 'drink');
  IF normalized_drink NOT IN ('Any Black', 'Flat White / Latte', 'Hot Choco', 'Cappuccino', 'Fluffy') THEN
    RAISE EXCEPTION 'Drink selection must be a valid RCC coffee choice';
  END IF;

  -- Check full-day closure
  SELECT bdo.is_closed INTO v_day_closed
  FROM public.booking_date_overrides bdo
  WHERE bdo.booking_date = p_booking_date AND bdo.is_closed = true;
  IF v_day_closed THEN
    RAISE EXCEPTION 'CLOSURE: This date is closed for bookings.';
  END IF;

  -- Check slot closure
  SELECT bso.is_closed INTO v_slot_closed
  FROM public.booking_slot_overrides bso
  WHERE bso.booking_date = p_booking_date AND bso.slot_start = trim(p_booking_time) AND bso.is_closed = true;
  IF v_slot_closed THEN
    RAISE EXCEPTION 'CLOSURE: This time slot is closed for bookings.';
  END IF;

  -- Atomic capacity lock
  PERFORM pg_advisory_xact_lock(hashtextextended(p_booking_date::text || '|' || trim(p_booking_time), 0));
  capacity := COALESCE(cfg.capacity_per_slot, 8);
  SELECT COALESCE(SUM(group_size), 0)::integer INTO used
  FROM public.bookings_mirror
  WHERE booking_date = p_booking_date
    AND booking_time = trim(p_booking_time)
    AND status IN ('pending', 'confirmed', 'approved');
  IF used + p_remote_spots > capacity THEN
    RAISE EXCEPTION 'CAPACITY_EXCEEDED: Only % remotes are available.', GREATEST(capacity - used, 0);
  END IF;

  configured_price := NULLIF(cfg.gameplay_prices ->> p_gameplay_duration::text, '')::numeric;
  configured_price := COALESCE(configured_price, CASE WHEN p_gameplay_duration = 45 THEN 45 ELSE 55 END);
  hours_snapshot := CASE WHEN p_business_hours_snapshot = '{}'::jsonb THEN jsonb_build_object(
    'day', trim(to_char(p_booking_date, 'FMDay')),
    'open', cfg.business_hours -> lower(trim(to_char(p_booking_date, 'FMDay'))) ->> 'open',
    'close', cfg.business_hours -> lower(trim(to_char(p_booking_date, 'FMDay'))) ->> 'close',
    'timezone', 'Pacific/Auckland'
  ) ELSE p_business_hours_snapshot END;
  next_number := nextval('public.rcc_booking_number_seq');

  INSERT INTO public.bookings_mirror (
    booking_id, customer_name, customer_email, customer_phone, booking_date, booking_time,
    gameplay_duration, package_duration, price_per_remote, package_price, total_price,
    group_size, toastie_selection, drink_selection, food_items, per_remote_selections,
    business_hours_snapshot, notes, status, payment_status, source, package_name, slot_label
  ) VALUES (
    'RCC-' || lpad(next_number::text, 4, '0'), trim(p_customer_name), lower(trim(p_customer_email)),
    trim(p_customer_phone), p_booking_date, trim(p_booking_time), p_gameplay_duration,
    p_gameplay_duration, configured_price, configured_price * p_remote_spots,
    configured_price * p_remote_spots, p_remote_spots,
    COALESCE(NULLIF(trim(COALESCE(p_toastie_selection, '')), ''), NULLIF(trim(first_selection ->> 'toastie'), '')),
    normalized_drink,
    selections, selections, hours_snapshot, NULLIF(trim(COALESCE(p_notes, '')), ''),
    'pending', 'not_required', COALESCE(NULLIF(trim(p_source), ''), 'website-v4'), null, trim(p_booking_time)
  ) RETURNING * INTO created;

  INSERT INTO public.activity_logs (action, module, record_id, details)
  VALUES ('Booking created (pending)', 'bookings', created.id::text,
    jsonb_build_object('bookingId', created.booking_id, 'status', 'pending', 'remoteSpots', created.group_size, 'foodRows', jsonb_array_length(selections)));

  RETURN created;
END;
$fn_create_v4$;


-- ============================================================
-- 6. Update set_booking_status: support pending→confirmed (approval)
--    Uses is_staff(). cancelled_by is uuid, use auth.uid() directly.
--    Counts pending+confirmed+approved for capacity.
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_booking_status(
  p_booking_id uuid,
  p_status text,
  p_admin_note text DEFAULT NULL
)
RETURNS public.bookings_mirror
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn_set_status$
DECLARE
  booking public.bookings_mirror;
  target_status text := lower(trim(p_status));
  v_admin_id uuid := auth.uid();
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;
  IF target_status NOT IN ('confirmed', 'cancelled', 'completed', 'no_show') THEN
    RAISE EXCEPTION 'Unsupported booking status';
  END IF;

  SELECT * INTO booking FROM public.bookings_mirror WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  -- Approval: pending → confirmed (with capacity recheck)
  IF target_status = 'confirmed' AND booking.status = 'pending' THEN
    DECLARE
      v_capacity integer;
      v_used integer;
    BEGIN
      PERFORM pg_advisory_xact_lock(hashtextextended(booking.booking_date::text || '|' || booking.booking_time, 0));
      SELECT COALESCE(capacity_per_slot, 8) INTO v_capacity FROM public.booking_settings WHERE id = 1;
      SELECT COALESCE(SUM(group_size), 0)::integer INTO v_used
      FROM public.bookings_mirror
      WHERE booking_date = booking.booking_date
        AND booking_time = booking.booking_time
        AND status IN ('pending', 'confirmed', 'approved')
        AND id != p_booking_id;
      IF v_used + booking.group_size > v_capacity THEN
        RAISE EXCEPTION 'CAPACITY_EXCEEDED: Cannot approve — only % remote(s) available.', GREATEST(v_capacity - v_used, 0);
      END IF;
    END;

    UPDATE public.bookings_mirror
    SET status = 'confirmed',
        approved_at = now(),
        approved_by = v_admin_id,
        admin_notes = COALESCE(NULLIF(trim(p_admin_note), ''), admin_notes),
        updated_at = now()
    WHERE id = booking.id
    RETURNING * INTO booking;

  -- Cancellation from confirmed or pending
  ELSIF target_status = 'cancelled' AND booking.status IN ('pending', 'confirmed', 'approved') THEN
    UPDATE public.bookings_mirror
    SET status = 'cancelled',
        cancelled_at = now(),
        cancelled_by = v_admin_id,
        admin_notes = COALESCE(NULLIF(trim(p_admin_note), ''), admin_notes),
        updated_at = now()
    WHERE id = booking.id
    RETURNING * INTO booking;

  -- Standard transitions from confirmed/approved
  ELSIF target_status IN ('completed', 'no_show') AND booking.status IN ('confirmed', 'approved') THEN
    UPDATE public.bookings_mirror
    SET status = target_status,
        admin_notes = COALESCE(NULLIF(trim(p_admin_note), ''), admin_notes),
        updated_at = now()
    WHERE id = booking.id
    RETURNING * INTO booking;

  -- Cancelled bookings cannot be restored
  ELSIF booking.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cancelled bookings cannot be restored by this action';

  ELSE
    RAISE EXCEPTION 'INVALID_TRANSITION: Cannot change from % to %.', booking.status, target_status;
  END IF;

  INSERT INTO public.activity_logs (actor_id, action, module, record_id, details)
  VALUES (v_admin_id, 'Booking status changed', 'bookings', booking.id::text,
    jsonb_build_object('bookingId', booking.booking_id, 'oldStatus', booking.status, 'newStatus', target_status, 'remoteSpots', booking.group_size));

  RETURN booking;
END;
$fn_set_status$;


-- ============================================================
-- 7. reject_booking (NEW function)
--    Sets status to 'cancelled' with rejection metadata.
--    cancelled_by is uuid, not text.
-- ============================================================
CREATE OR REPLACE FUNCTION public.reject_booking(
  p_booking_id uuid,
  p_rejection_reason text DEFAULT NULL,
  p_admin_note text DEFAULT NULL
)
RETURNS public.bookings_mirror
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn_reject$
DECLARE
  booking public.bookings_mirror;
  v_admin_id uuid := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  SELECT * INTO booking FROM public.bookings_mirror WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF booking.status != 'pending' THEN
    RAISE EXCEPTION 'INVALID_TRANSITION: Can only reject pending bookings. Current status: %.', booking.status;
  END IF;

  UPDATE public.bookings_mirror
  SET status = 'cancelled',
      rejected_at = now(),
      rejected_by = v_admin_id,
      rejection_reason = COALESCE(p_rejection_reason, 'No reason provided'),
      cancelled_at = now(),
      cancelled_by = v_admin_id,
      admin_notes = COALESCE(NULLIF(trim(COALESCE(p_admin_note, '')), ''), admin_notes),
      updated_at = now()
  WHERE id = booking.id
  RETURNING * INTO booking;

  INSERT INTO public.activity_logs (actor_id, action, module, record_id, details)
  VALUES (v_admin_id, 'Booking rejected', 'bookings', booking.id::text,
    jsonb_build_object('bookingId', booking.booking_id, 'reason', p_rejection_reason));

  RETURN booking;
END;
$fn_reject$;


-- ============================================================
-- 8. cancel_confirmed_booking (NEW — did not exist in production)
--    Handles confirmed, approved, and pending bookings.
--    cancelled_by is uuid.
-- ============================================================
CREATE OR REPLACE FUNCTION public.cancel_confirmed_booking(
  p_booking_id uuid,
  p_cancellation_reason text DEFAULT NULL
)
RETURNS public.bookings_mirror
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn_cancel$
DECLARE
  booking public.bookings_mirror;
  v_admin_id uuid := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  SELECT * INTO booking FROM public.bookings_mirror WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF booking.status NOT IN ('confirmed', 'approved', 'pending') THEN
    RAISE EXCEPTION 'INVALID_TRANSITION: Can only cancel confirmed, approved, or pending bookings.';
  END IF;

  UPDATE public.bookings_mirror
  SET status = 'cancelled',
      cancellation_reason = NULLIF(trim(COALESCE(p_cancellation_reason, '')), ''),
      cancelled_at = now(),
      cancelled_by = v_admin_id,
      updated_at = now()
  WHERE id = booking.id
  RETURNING * INTO booking;

  INSERT INTO public.activity_logs (actor_id, action, module, record_id, details)
  VALUES (v_admin_id, 'Booking cancelled', 'bookings', booking.id::text,
    jsonb_build_object('bookingId', booking.booking_id, 'reason', booking.cancellation_reason));

  RETURN booking;
END;
$fn_cancel$;


-- ============================================================
-- 9. record_booking_sheet_sync_v3 (NEW — did not exist in production)
--    Called by Booking.jsx for public sheet sync recording.
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_booking_sheet_sync_v3(
  p_booking_id uuid,
  p_public_booking_id text,
  p_success boolean,
  p_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn_sync$
BEGIN
  UPDATE public.bookings_mirror
  SET synced_to_sheet_at = CASE WHEN p_success THEN now() ELSE NULL END,
      sheet_sync_error = CASE WHEN p_success THEN NULL ELSE left(COALESCE(p_message, 'Google Sheet sync failed.'), 500) END,
      updated_at = now()
  WHERE id = p_booking_id
    AND booking_id = p_public_booking_id
    AND created_at >= now() - interval '15 minutes';
END;
$fn_sync$;


-- ============================================================
-- 10. mark_confirmation_email_sent / mark_rejection_email_sent (NEW)
-- ============================================================
CREATE OR REPLACE FUNCTION public.mark_confirmation_email_sent(
  p_booking_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn_mark_conf$
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  UPDATE public.bookings_mirror
  SET confirmation_email_sent_at = COALESCE(confirmation_email_sent_at, now()),
      updated_at = now()
  WHERE id = p_booking_id AND confirmation_email_sent_at IS NULL;

  RETURN FOUND;
END;
$fn_mark_conf$;

CREATE OR REPLACE FUNCTION public.mark_rejection_email_sent(
  p_booking_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn_mark_rej$
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  UPDATE public.bookings_mirror
  SET rejection_email_sent_at = COALESCE(rejection_email_sent_at, now()),
      updated_at = now()
  WHERE id = p_booking_id AND rejection_email_sent_at IS NULL;

  RETURN FOUND;
END;
$fn_mark_rej$;


-- ============================================================
-- 11. get_date_availability (NEW — public RPC for slot availability)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_date_availability(
  p_date date
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn_avail$
DECLARE
  v_day_closed boolean := false;
  v_day_reason text;
  v_slots jsonb;
  v_closed_slots jsonb;
BEGIN
  -- Check full-day closure
  SELECT bdo.is_closed, bdo.reason INTO v_day_closed, v_day_reason
  FROM public.booking_date_overrides bdo
  WHERE bdo.booking_date = p_date AND bdo.is_closed = true;

  -- Slots with bookings
  SELECT jsonb_agg(jsonb_build_object(
    'slot_time', sc.slot_time,
    'reserved_remotes', sc.approved_spots,
    'manually_closed', COALESCE(so.is_closed, false),
    'closure_reason', so.reason
  ))
  INTO v_slots
  FROM public.booking_slot_capacity sc
  LEFT JOIN public.booking_slot_overrides so
    ON so.booking_date = sc.booking_date AND so.slot_start = sc.slot_time
  WHERE sc.booking_date = p_date;

  -- Closed slots that have no bookings yet
  SELECT jsonb_agg(jsonb_build_object(
    'slot_time', so2.slot_start,
    'reserved_remotes', 0,
    'manually_closed', true,
    'closure_reason', so2.reason
  ))
  INTO v_closed_slots
  FROM public.booking_slot_overrides so2
  WHERE so2.booking_date = p_date
    AND so2.is_closed = true
    AND NOT EXISTS (
      SELECT 1 FROM public.booking_slot_capacity sc2
      WHERE sc2.booking_date = so2.booking_date AND sc2.slot_time = so2.slot_start
    );

  RETURN jsonb_build_object(
    'date', p_date,
    'day_closed', COALESCE(v_day_closed, false),
    'day_closure_reason', v_day_reason,
    'slots', COALESCE(v_slots, '[]'::jsonb) || COALESCE(v_closed_slots, '[]'::jsonb)
  );
END;
$fn_avail$;


-- ============================================================
-- 12. Update get_admin_dashboard_stats — add pendingBookings
--     Uses is_staff(), activity_logs.deleted_at, exact production schema.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn_stats$
DECLARE
  today_nz date;
BEGIN
  today_nz := (now() AT TIME ZONE 'Pacific/Auckland')::date;
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;
  RETURN jsonb_build_object(
    'todayBookings', (SELECT count(*) FROM public.bookings_mirror WHERE booking_date = today_nz),
    'pendingBookings', (SELECT count(*) FROM public.bookings_mirror WHERE status = 'pending'),
    'confirmedBookings', (SELECT count(*) FROM public.bookings_mirror WHERE status IN ('confirmed', 'approved')),
    'cancelledBookings', (SELECT count(*) FROM public.bookings_mirror WHERE status IN ('cancelled', 'rejected')),
    'completedBookings', (SELECT count(*) FROM public.bookings_mirror WHERE status = 'completed'),
    'noShowBookings', (SELECT count(*) FROM public.bookings_mirror WHERE status = 'no_show'),
    'todayRevenue', (SELECT COALESCE(sum(total_price), 0) FROM public.bookings_mirror WHERE booking_date = today_nz AND status IN ('confirmed', 'approved', 'completed')),
    'remoteSpotsBooked', (SELECT COALESCE(sum(group_size), 0) FROM public.bookings_mirror WHERE booking_date = today_nz AND status IN ('pending', 'confirmed', 'approved')),
    'rewardCards', (SELECT count(*) FROM public.reward_cards),
    'stampsToday', (SELECT COALESCE(sum(stamp_change), 0) FROM public.reward_events WHERE event_type = 'stamp_added' AND deleted_at IS NULL AND (created_at AT TIME ZONE 'Pacific/Auckland')::date = today_nz),
    'rewardsRedeemed', (SELECT count(*) FROM public.reward_events WHERE event_type = 'reward_redeemed' AND deleted_at IS NULL),
    'newLeads', (SELECT count(*) FROM public.website_leads WHERE status = 'new'),
    'failedSyncs', (SELECT count(*) FROM public.bookings_mirror WHERE sheet_sync_error IS NOT NULL),
    'systemAlerts', (SELECT count(*) FROM public.activity_logs WHERE created_at > now() - interval '24 hours' AND lower(action) LIKE '%fail%')
  );
END;
$fn_stats$;


-- ============================================================
-- 13. Update refresh_booking_slot_capacity to count pending+approved
--     Matches existing signature: (date, text) returns integer
-- ============================================================
CREATE OR REPLACE FUNCTION public.refresh_booking_slot_capacity(
  p_booking_date date,
  p_slot_time text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn_refresh$
DECLARE
  used integer;
BEGIN
  SELECT COALESCE(SUM(group_size), 0)::integer INTO used
  FROM public.bookings_mirror
  WHERE booking_date = p_booking_date
    AND booking_time = p_slot_time
    AND status IN ('pending', 'confirmed', 'approved');

  INSERT INTO public.booking_slot_capacity (booking_date, slot_time, approved_spots, updated_at)
  VALUES (p_booking_date, p_slot_time, used, now())
  ON CONFLICT (booking_date, slot_time) DO UPDATE
  SET approved_spots = EXCLUDED.approved_spots,
      updated_at = now();

  RETURN used;
END;
$fn_refresh$;


-- ============================================================
-- 14. Function permissions
--     Using exact verified signatures from preflight.
-- ============================================================

-- New functions: grant to authenticated (admin-only enforced inside function body)
GRANT EXECUTE ON FUNCTION public.reject_booking(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_confirmed_booking(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_confirmation_email_sent(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_rejection_email_sent(uuid) TO authenticated;

-- Public availability RPC: grant to anon + authenticated
GRANT EXECUTE ON FUNCTION public.get_date_availability(date) TO anon, authenticated;

-- Sheet sync: grant to anon (called from public booking page)
GRANT EXECUTE ON FUNCTION public.record_booking_sheet_sync_v3(uuid, text, boolean, text) TO anon, authenticated;


-- ============================================================
-- 15. Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_bookings_mirror_status ON public.bookings_mirror (status);
CREATE INDEX IF NOT EXISTS idx_booking_date_overrides_date ON public.booking_date_overrides (booking_date);
CREATE INDEX IF NOT EXISTS idx_booking_slot_overrides_date ON public.booking_slot_overrides (booking_date);


COMMIT;
