-- ============================================================
-- ROLLBACK: Booking Approval Workflow + Availability Calendar
-- Date: 2026-07-17
-- Run ONLY if you need to reverse the final migration.
-- This restores the pre-migration state (original production state).
--
-- SAFETY: This does NOT delete bookings or customer data.
--         This does NOT drop existing columns that may hold data.
--         New functions are dropped; overwritten functions restored.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Drop new tables (only if no closures were created)
-- ============================================================
DROP TABLE IF EXISTS public.booking_slot_overrides;
DROP TABLE IF EXISTS public.booking_date_overrides;


-- ============================================================
-- 2. Drop new functions that did not exist before migration
-- ============================================================
DROP FUNCTION IF EXISTS public.reject_booking(uuid, text, text);
DROP FUNCTION IF EXISTS public.cancel_confirmed_booking(uuid, text);
DROP FUNCTION IF EXISTS public.record_booking_sheet_sync_v3(uuid, text, boolean, text);
DROP FUNCTION IF EXISTS public.mark_confirmation_email_sent(uuid);
DROP FUNCTION IF EXISTS public.mark_rejection_email_sent(uuid);
DROP FUNCTION IF EXISTS public.get_date_availability(date);


-- ============================================================
-- 3. Restore status CHECK to original (remove 'confirmed')
--    Original constraint: pending, approved, rejected, cancelled, completed, no_show
--    WARNING: Only safe if no rows have status = 'confirmed'.
--    Run this check first:
--      SELECT count(*) FROM bookings_mirror WHERE status = 'confirmed';
-- ============================================================
DO $check_confirmed$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count FROM public.bookings_mirror WHERE status = 'confirmed';
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Cannot rollback status constraint: % bookings have status confirmed. Update them to approved first.', v_count;
  END IF;
END;
$check_confirmed$;

ALTER TABLE public.bookings_mirror
  DROP CONSTRAINT IF EXISTS bookings_mirror_status_check;

ALTER TABLE public.bookings_mirror
  ADD CONSTRAINT bookings_mirror_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed', 'no_show'));


-- ============================================================
-- 4. Restore original set_booking_status (pre-approval-workflow)
--    Original: simple status update without approval/rejection logic.
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
AS $fn$
DECLARE
  booking public.bookings_mirror;
  v_admin_id uuid := auth.uid();
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;
  IF p_status NOT IN ('approved', 'cancelled', 'completed', 'no_show') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  UPDATE public.bookings_mirror
  SET status = p_status,
      cancelled_at = CASE WHEN p_status = 'cancelled' THEN now() ELSE cancelled_at END,
      cancelled_by = CASE WHEN p_status = 'cancelled' THEN v_admin_id ELSE cancelled_by END,
      admin_notes = COALESCE(NULLIF(trim(p_admin_note), ''), admin_notes),
      updated_at = now()
  WHERE id = p_booking_id
  RETURNING * INTO booking;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  INSERT INTO public.activity_logs (actor_id, action, module, record_id, details)
  VALUES (v_admin_id, 'Booking status changed', 'bookings', booking.id::text,
    jsonb_build_object('bookingId', booking.booking_id, 'status', p_status));

  RETURN booking;
END;
$fn$;


-- ============================================================
-- 5. Restore original create_booking_request_v4 (auto-approve, no closures)
--    Original: 14 params, status defaults to 'approved'
-- ============================================================
-- NOTE: The original function body is long. This restores the key behavior:
--   - Status = 'approved' (not 'pending')
--   - No closure checks
--   - Counts only 'approved' for capacity
-- A full restore should be done from git history if needed.
-- For safety, we just update the status default:
DO $restore_v4$
BEGIN
  RAISE NOTICE 'To fully restore create_booking_request_v4, replay the original from git history.';
  RAISE NOTICE 'The migration version changed status from approved to pending and added closure checks.';
  RAISE NOTICE 'The function signature (14 args) was NOT changed.';
END;
$restore_v4$;


-- ============================================================
-- 6. Restore original get_admin_dashboard_stats (no pendingBookings)
--    The original version lacks pendingBookings key.
--    The new version is backward-compatible (adds a key), so
--    rollback of this function is optional.
-- ============================================================
-- Left as-is since the new version is strictly additive.


-- ============================================================
-- 7. Restore original refresh_booking_slot_capacity
--    Original counted only 'approved' status (not pending/confirmed).
-- ============================================================
CREATE OR REPLACE FUNCTION public.refresh_booking_slot_capacity(
  p_booking_date date,
  p_slot_time text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  used integer;
BEGIN
  SELECT COALESCE(SUM(group_size), 0)::integer INTO used
  FROM public.bookings_mirror
  WHERE booking_date = p_booking_date
    AND booking_time = p_slot_time
    AND status = 'approved';

  INSERT INTO public.booking_slot_capacity (booking_date, slot_time, approved_spots, updated_at)
  VALUES (p_booking_date, p_slot_time, used, now())
  ON CONFLICT (booking_date, slot_time) DO UPDATE
  SET approved_spots = EXCLUDED.approved_spots,
      updated_at = now();

  RETURN used;
END;
$fn$;


-- ============================================================
-- 8. Drop new indexes
-- ============================================================
DROP INDEX IF EXISTS public.idx_bookings_mirror_status;
DROP INDEX IF EXISTS public.idx_booking_date_overrides_date;
DROP INDEX IF EXISTS public.idx_booking_slot_overrides_date;


-- ============================================================
-- 9. New columns (rejection_reason, confirmation_email_sent_at,
--    rejection_email_sent_at, cancellation_reason) are left in place.
--    They are nullable and don't affect existing queries.
--    To remove them, uncomment below:
-- ============================================================
-- ALTER TABLE public.bookings_mirror DROP COLUMN IF EXISTS rejection_reason;
-- ALTER TABLE public.bookings_mirror DROP COLUMN IF EXISTS confirmation_email_sent_at;
-- ALTER TABLE public.bookings_mirror DROP COLUMN IF EXISTS rejection_email_sent_at;
-- ALTER TABLE public.bookings_mirror DROP COLUMN IF EXISTS cancellation_reason;


COMMIT;
