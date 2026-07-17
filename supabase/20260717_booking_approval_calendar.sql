-- Migration: Booking Approval Workflow + Availability Calendar
-- Date: 2026-07-17
-- Purpose: Add pending status, approval/rejection workflow, date/slot closures, email idempotency
-- Safety: Additive only. No existing data is deleted, truncated, or overwritten.

-- ============================================================
-- 1. Expand status CHECK constraint to include 'pending'
-- ============================================================
ALTER TABLE bookings_mirror
  DROP CONSTRAINT IF EXISTS bookings_mirror_status_check;

ALTER TABLE bookings_mirror
  ADD CONSTRAINT bookings_mirror_status_check
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show'));

-- ============================================================
-- 2. Add approval/rejection and email idempotency columns
-- ============================================================
ALTER TABLE bookings_mirror
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS confirmation_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_email_sent_at timestamptz;

-- ============================================================
-- 3. Booking date/slot override tables for availability calendar
-- ============================================================
CREATE TABLE IF NOT EXISTS booking_date_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_date date NOT NULL UNIQUE,
  is_closed boolean NOT NULL DEFAULT true,
  reason text,
  admin_note text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE booking_date_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Public can read date overrides"
  ON booking_date_overrides FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Staff can manage date overrides"
  ON booking_date_overrides FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager') AND active = true)
  );

CREATE TABLE IF NOT EXISTS booking_slot_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_date date NOT NULL,
  slot_start text NOT NULL,
  is_closed boolean NOT NULL DEFAULT true,
  reason text,
  admin_note text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_date, slot_start)
);

ALTER TABLE booking_slot_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Public can read slot overrides"
  ON booking_slot_overrides FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Staff can manage slot overrides"
  ON booking_slot_overrides FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager') AND active = true)
  );

-- ============================================================
-- 4. Update create_booking_request_v4: default status = 'pending'
--    Also enforce date/slot closures at DB level
-- ============================================================
CREATE OR REPLACE FUNCTION create_booking_request_v4(
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
  p_source text DEFAULT 'website',
  p_booking_reference text DEFAULT NULL,
  p_business_hours_snapshot jsonb DEFAULT '{}'::jsonb,
  p_per_remote_selections jsonb DEFAULT '[]'::jsonb
)
RETURNS bookings_mirror
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result bookings_mirror;
  v_slot_key text;
  v_used integer;
  v_cap integer := 8;
  v_ref text;
  v_day_closed boolean;
  v_slot_closed boolean;
BEGIN
  IF p_remote_spots < 1 OR p_remote_spots > 8 THEN
    RAISE EXCEPTION 'VALIDATION: Remote spots must be between 1 and 8.';
  END IF;
  IF p_booking_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'VALIDATION: Cannot book a past date.';
  END IF;
  IF length(trim(p_customer_name)) < 2 THEN
    RAISE EXCEPTION 'VALIDATION: Customer name is required.';
  END IF;
  IF p_customer_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'VALIDATION: Valid email is required.';
  END IF;

  -- Check full-day closure
  SELECT is_closed INTO v_day_closed
  FROM booking_date_overrides
  WHERE booking_date = p_booking_date AND is_closed = true;

  IF v_day_closed THEN
    RAISE EXCEPTION 'CLOSURE: This date is closed for bookings.';
  END IF;

  -- Check slot closure
  SELECT is_closed INTO v_slot_closed
  FROM booking_slot_overrides
  WHERE booking_date = p_booking_date AND slot_start = p_booking_time AND is_closed = true;

  IF v_slot_closed THEN
    RAISE EXCEPTION 'CLOSURE: This time slot is closed for bookings.';
  END IF;

  v_slot_key := p_booking_date::text || '-' || p_booking_time;
  PERFORM pg_advisory_xact_lock(hashtext(v_slot_key));

  SELECT COALESCE(SUM(group_size), 0) INTO v_used
  FROM bookings_mirror
  WHERE booking_date = p_booking_date
    AND booking_time = p_booking_time
    AND status IN ('pending', 'confirmed');

  IF v_used + p_remote_spots > v_cap THEN
    RAISE EXCEPTION 'CAPACITY_EXCEEDED: Only % remote(s) remaining for this slot.', (v_cap - v_used);
  END IF;

  v_ref := COALESCE(NULLIF(trim(p_booking_reference), ''),
    'RCC-' || to_char(p_booking_date, 'YYYYMMDD') || '-' || to_char(now() AT TIME ZONE 'Pacific/Auckland', 'HH24MISS') || upper(substr(md5(random()::text), 1, 3))
  );

  INSERT INTO bookings_mirror (
    booking_id, customer_name, customer_email, customer_phone,
    booking_date, booking_time, slot_label,
    group_size, gameplay_duration, price_per_remote, total_price,
    toastie_selection, drink_selection, notes, source,
    status, business_hours_snapshot, per_remote_selections,
    created_at, updated_at
  ) VALUES (
    v_ref, trim(p_customer_name), lower(trim(p_customer_email)), trim(p_customer_phone),
    p_booking_date, p_booking_time, p_booking_time,
    p_remote_spots, p_gameplay_duration, p_price_per_remote, p_price_per_remote * p_remote_spots,
    p_toastie_selection, p_drink_selection, p_notes, p_source,
    'pending', p_business_hours_snapshot, p_per_remote_selections,
    now(), now()
  )
  RETURNING * INTO v_result;

  -- Refresh slot capacity view
  INSERT INTO booking_slot_capacity (booking_date, slot_time, approved_spots, updated_at)
  VALUES (p_booking_date, p_booking_time, v_used + p_remote_spots, now())
  ON CONFLICT (booking_date, slot_time)
  DO UPDATE SET approved_spots = v_used + p_remote_spots, updated_at = now();

  RETURN v_result;
END;
$$;

-- ============================================================
-- 5. Update set_booking_status: allow pending->confirmed with approval metadata
-- ============================================================
CREATE OR REPLACE FUNCTION set_booking_status(
  p_booking_id uuid,
  p_status text,
  p_admin_note text DEFAULT NULL
)
RETURNS bookings_mirror
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking bookings_mirror;
  v_old_status text;
  v_admin_id uuid := auth.uid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_admin_id AND role IN ('super_admin', 'admin', 'manager', 'staff') AND active) THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Staff access required.';
  END IF;

  SELECT * INTO v_booking FROM bookings_mirror WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Booking not found.';
  END IF;

  v_old_status := v_booking.status;

  -- Validate transitions
  IF p_status = 'confirmed' AND v_old_status = 'pending' THEN
    -- Approval: recheck capacity atomically
    DECLARE
      v_slot_key text;
      v_used integer;
      v_cap integer := 8;
    BEGIN
      v_slot_key := v_booking.booking_date::text || '-' || v_booking.booking_time;
      PERFORM pg_advisory_xact_lock(hashtext(v_slot_key));

      SELECT COALESCE(SUM(group_size), 0) INTO v_used
      FROM bookings_mirror
      WHERE booking_date = v_booking.booking_date
        AND booking_time = v_booking.booking_time
        AND status IN ('pending', 'confirmed')
        AND id != p_booking_id;

      IF v_used + v_booking.group_size > v_cap THEN
        RAISE EXCEPTION 'CAPACITY_EXCEEDED: Cannot approve - only % remote(s) available.', (v_cap - v_used);
      END IF;
    END;

    UPDATE bookings_mirror SET
      status = 'confirmed',
      approved_at = now(),
      approved_by = v_admin_id,
      admin_notes = COALESCE(p_admin_note, admin_notes),
      updated_at = now()
    WHERE id = p_booking_id
    RETURNING * INTO v_booking;

  ELSIF p_status = 'cancelled' AND v_old_status IN ('pending', 'confirmed') THEN
    UPDATE bookings_mirror SET
      status = 'cancelled',
      cancelled_at = now(),
      cancelled_by = v_admin_id::text,
      admin_notes = COALESCE(p_admin_note, admin_notes),
      updated_at = now()
    WHERE id = p_booking_id
    RETURNING * INTO v_booking;

    PERFORM refresh_booking_slot_capacity_for(v_booking.booking_date, v_booking.booking_time);

  ELSIF p_status = 'completed' AND v_old_status = 'confirmed' THEN
    UPDATE bookings_mirror SET
      status = 'completed',
      admin_notes = COALESCE(p_admin_note, admin_notes),
      updated_at = now()
    WHERE id = p_booking_id
    RETURNING * INTO v_booking;

  ELSIF p_status = 'no_show' AND v_old_status = 'confirmed' THEN
    UPDATE bookings_mirror SET
      status = 'no_show',
      admin_notes = COALESCE(p_admin_note, admin_notes),
      updated_at = now()
    WHERE id = p_booking_id
    RETURNING * INTO v_booking;

  ELSE
    RAISE EXCEPTION 'INVALID_TRANSITION: Cannot change from % to %.', v_old_status, p_status;
  END IF;

  INSERT INTO activity_logs (entity_type, entity_id, action, details, performed_by, created_at)
  VALUES ('booking', p_booking_id, 'status_change',
    jsonb_build_object('old_status', v_old_status, 'new_status', p_status, 'note', p_admin_note),
    v_admin_id, now()
  );

  RETURN v_booking;
END;
$$;

-- ============================================================
-- 6. Reject booking function (sets cancelled + rejection metadata)
-- ============================================================
CREATE OR REPLACE FUNCTION reject_booking(
  p_booking_id uuid,
  p_rejection_reason text DEFAULT NULL,
  p_admin_note text DEFAULT NULL
)
RETURNS bookings_mirror
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking bookings_mirror;
  v_admin_id uuid := auth.uid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_admin_id AND role IN ('super_admin', 'admin', 'manager') AND active) THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Admin access required.';
  END IF;

  SELECT * INTO v_booking FROM bookings_mirror WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Booking not found.';
  END IF;

  IF v_booking.status != 'pending' THEN
    RAISE EXCEPTION 'INVALID_TRANSITION: Can only reject pending bookings. Current status: %.', v_booking.status;
  END IF;

  UPDATE bookings_mirror SET
    status = 'cancelled',
    rejected_at = now(),
    rejected_by = v_admin_id,
    rejection_reason = COALESCE(p_rejection_reason, 'No reason provided'),
    cancelled_at = now(),
    cancelled_by = v_admin_id::text,
    admin_notes = COALESCE(p_admin_note, admin_notes),
    updated_at = now()
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  -- Release capacity
  PERFORM refresh_booking_slot_capacity_for(v_booking.booking_date, v_booking.booking_time);

  INSERT INTO activity_logs (entity_type, entity_id, action, details, performed_by, created_at)
  VALUES ('booking', p_booking_id, 'booking_rejected',
    jsonb_build_object('reason', p_rejection_reason, 'note', p_admin_note),
    v_admin_id, now()
  );

  RETURN v_booking;
END;
$$;

-- ============================================================
-- 7. Update cancel_confirmed_booking to also handle pending
-- ============================================================
CREATE OR REPLACE FUNCTION cancel_confirmed_booking(
  p_booking_id uuid,
  p_cancellation_reason text DEFAULT NULL
)
RETURNS bookings_mirror
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking bookings_mirror;
  v_admin_id uuid := auth.uid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_admin_id AND role IN ('super_admin', 'admin') AND active) THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Admin access required.';
  END IF;

  SELECT * INTO v_booking FROM bookings_mirror WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Booking not found.';
  END IF;

  IF v_booking.status NOT IN ('confirmed', 'pending') THEN
    RAISE EXCEPTION 'INVALID_TRANSITION: Can only cancel confirmed or pending bookings.';
  END IF;

  UPDATE bookings_mirror SET
    status = 'cancelled',
    cancellation_reason = COALESCE(p_cancellation_reason, cancellation_reason),
    cancelled_at = now(),
    cancelled_by = v_admin_id::text,
    updated_at = now()
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  PERFORM refresh_booking_slot_capacity_for(v_booking.booking_date, v_booking.booking_time);

  INSERT INTO activity_logs (entity_type, entity_id, action, details, performed_by, created_at)
  VALUES ('booking', p_booking_id, 'booking_cancelled',
    jsonb_build_object('reason', p_cancellation_reason),
    v_admin_id, now()
  );

  RETURN v_booking;
END;
$$;

-- ============================================================
-- 8. Helper: refresh capacity for a single slot
-- ============================================================
CREATE OR REPLACE FUNCTION refresh_booking_slot_capacity_for(
  p_date date,
  p_time text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_used integer;
BEGIN
  SELECT COALESCE(SUM(group_size), 0) INTO v_used
  FROM bookings_mirror
  WHERE booking_date = p_date
    AND booking_time = p_time
    AND status IN ('pending', 'confirmed');

  INSERT INTO booking_slot_capacity (booking_date, slot_time, approved_spots, updated_at)
  VALUES (p_date, p_time, v_used, now())
  ON CONFLICT (booking_date, slot_time)
  DO UPDATE SET approved_spots = v_used, updated_at = now();
END;
$$;

-- ============================================================
-- 9. Mark confirmation/rejection email sent (idempotent)
-- ============================================================
CREATE OR REPLACE FUNCTION mark_confirmation_email_sent(
  p_booking_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager', 'staff') AND active) THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Staff access required.';
  END IF;

  UPDATE bookings_mirror
  SET confirmation_email_sent_at = COALESCE(confirmation_email_sent_at, now()),
      updated_at = now()
  WHERE id = p_booking_id AND confirmation_email_sent_at IS NULL;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION mark_rejection_email_sent(
  p_booking_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager', 'staff') AND active) THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Staff access required.';
  END IF;

  UPDATE bookings_mirror
  SET rejection_email_sent_at = COALESCE(rejection_email_sent_at, now()),
      updated_at = now()
  WHERE id = p_booking_id AND rejection_email_sent_at IS NULL;

  RETURN FOUND;
END;
$$;

-- ============================================================
-- 10. Get slot availability for a date (public RPC)
-- ============================================================
CREATE OR REPLACE FUNCTION get_date_availability(
  p_date date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day_closed boolean := false;
  v_day_reason text;
  v_slots jsonb;
BEGIN
  SELECT is_closed, reason INTO v_day_closed, v_day_reason
  FROM booking_date_overrides
  WHERE booking_date = p_date AND is_closed = true;

  SELECT jsonb_agg(jsonb_build_object(
    'slot_time', sc.slot_time,
    'reserved_remotes', sc.approved_spots,
    'manually_closed', COALESCE(so.is_closed, false),
    'closure_reason', so.reason
  ))
  INTO v_slots
  FROM booking_slot_capacity sc
  LEFT JOIN booking_slot_overrides so
    ON so.booking_date = sc.booking_date AND so.slot_start = sc.slot_time
  WHERE sc.booking_date = p_date;

  -- Also include manually closed slots that have no bookings yet
  SELECT COALESCE(v_slots, '[]'::jsonb) || COALESCE(
    jsonb_agg(jsonb_build_object(
      'slot_time', so2.slot_start,
      'reserved_remotes', 0,
      'manually_closed', true,
      'closure_reason', so2.reason
    )),
    '[]'::jsonb
  )
  INTO v_slots
  FROM booking_slot_overrides so2
  WHERE so2.booking_date = p_date
    AND so2.is_closed = true
    AND NOT EXISTS (
      SELECT 1 FROM booking_slot_capacity sc2
      WHERE sc2.booking_date = so2.booking_date AND sc2.slot_time = so2.slot_start
    );

  RETURN jsonb_build_object(
    'date', p_date,
    'day_closed', COALESCE(v_day_closed, false),
    'day_closure_reason', v_day_reason,
    'slots', COALESCE(v_slots, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_date_availability(date) TO anon, authenticated;

-- ============================================================
-- 11. Update dashboard stats to include pending count
-- ============================================================
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := (now() AT TIME ZONE 'Pacific/Auckland')::date;
  v_result jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND active) THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  SELECT jsonb_build_object(
    'todayBookings', (SELECT count(*) FROM bookings_mirror WHERE booking_date = v_today),
    'pendingBookings', (SELECT count(*) FROM bookings_mirror WHERE status = 'pending'),
    'confirmedBookings', (SELECT count(*) FROM bookings_mirror WHERE status = 'confirmed'),
    'cancelledBookings', (SELECT count(*) FROM bookings_mirror WHERE status = 'cancelled'),
    'completedBookings', (SELECT count(*) FROM bookings_mirror WHERE status = 'completed'),
    'noShowBookings', (SELECT count(*) FROM bookings_mirror WHERE status = 'no_show'),
    'todayRevenue', COALESCE((SELECT sum(total_price) FROM bookings_mirror WHERE booking_date = v_today AND status IN ('confirmed', 'completed')), 0),
    'remoteSpotsBooked', COALESCE((SELECT sum(group_size) FROM bookings_mirror WHERE booking_date = v_today AND status IN ('pending', 'confirmed')), 0),
    'rewardCards', (SELECT count(*) FROM reward_cards),
    'stampsToday', COALESCE((SELECT sum(abs(stamp_change)) FROM reward_events WHERE created_at::date = v_today), 0),
    'rewardsRedeemed', (SELECT count(*) FROM reward_events WHERE event_type = 'redeem'),
    'newLeads', (SELECT count(*) FROM website_leads WHERE status = 'new'),
    'failedSyncs', (SELECT count(*) FROM bookings_mirror WHERE sheet_sync_error IS NOT NULL),
    'systemAlerts', 0
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============================================================
-- 12. Tighten record_booking_sheet_sync_v3 to authenticated only
-- ============================================================
REVOKE EXECUTE ON FUNCTION record_booking_sheet_sync_v3(uuid, text, boolean, text) FROM anon;

-- ============================================================
-- 13. Grant execute on new functions
-- ============================================================
GRANT EXECUTE ON FUNCTION reject_booking(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_confirmation_email_sent(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_rejection_email_sent(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_booking_slot_capacity_for(date, text) TO authenticated;

-- ============================================================
-- 14. Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_bookings_mirror_status ON bookings_mirror (status);
CREATE INDEX IF NOT EXISTS idx_bookings_mirror_date_time_status ON bookings_mirror (booking_date, booking_time, status);
CREATE INDEX IF NOT EXISTS idx_booking_date_overrides_date ON booking_date_overrides (booking_date);
CREATE INDEX IF NOT EXISTS idx_booking_slot_overrides_date ON booking_slot_overrides (booking_date);
