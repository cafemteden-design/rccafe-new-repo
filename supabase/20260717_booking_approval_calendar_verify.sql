-- ============================================================
-- VERIFICATION: Post-migration checks
-- Run after applying 20260717_booking_approval_calendar_final.sql
-- 100% READ-ONLY — no DDL/DML/DCL
-- Returns a single JSON with pass/fail for each check.
-- ============================================================

SELECT jsonb_build_object(

  -- 1. Status CHECK includes 'confirmed'
  'status_check_includes_confirmed', (
    SELECT EXISTS (
      SELECT 1 FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE nsp.nspname = 'public' AND rel.relname = 'bookings_mirror'
        AND con.contype = 'c'
        AND pg_get_constraintdef(con.oid) LIKE '%confirmed%'
    )
  ),

  -- 2. New columns exist
  'has_rejection_reason', (
    SELECT EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'bookings_mirror' AND column_name = 'rejection_reason')
  ),
  'has_confirmation_email_sent_at', (
    SELECT EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'bookings_mirror' AND column_name = 'confirmation_email_sent_at')
  ),
  'has_rejection_email_sent_at', (
    SELECT EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'bookings_mirror' AND column_name = 'rejection_email_sent_at')
  ),
  'has_cancellation_reason', (
    SELECT EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'bookings_mirror' AND column_name = 'cancellation_reason')
  ),

  -- 3. Calendar tables exist
  'booking_date_overrides_exists', (
    SELECT EXISTS (SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'booking_date_overrides')
  ),
  'booking_slot_overrides_exists', (
    SELECT EXISTS (SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'booking_slot_overrides')
  ),

  -- 4. RLS enabled on new tables
  'date_overrides_rls', (
    SELECT relrowsecurity FROM pg_class
    JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
    WHERE pg_namespace.nspname = 'public' AND relname = 'booking_date_overrides'
  ),
  'slot_overrides_rls', (
    SELECT relrowsecurity FROM pg_class
    JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
    WHERE pg_namespace.nspname = 'public' AND relname = 'booking_slot_overrides'
  ),

  -- 5. New functions exist
  'fn_reject_booking', (
    SELECT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'reject_booking')
  ),
  'fn_cancel_confirmed_booking', (
    SELECT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'cancel_confirmed_booking')
  ),
  'fn_record_booking_sheet_sync_v3', (
    SELECT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'record_booking_sheet_sync_v3')
  ),
  'fn_mark_confirmation_email_sent', (
    SELECT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'mark_confirmation_email_sent')
  ),
  'fn_mark_rejection_email_sent', (
    SELECT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'mark_rejection_email_sent')
  ),
  'fn_get_date_availability', (
    SELECT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'get_date_availability')
  ),

  -- 6. Updated functions still have SECURITY DEFINER
  'v4_security_definer', (
    SELECT p.prosecdef FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'create_booking_request_v4'
  ),
  'set_status_security_definer', (
    SELECT p.prosecdef FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'set_booking_status'
  ),

  -- 7. Existing data unharmed
  'total_bookings', (SELECT count(*) FROM public.bookings_mirror),
  'booking_status_distribution', (
    SELECT jsonb_agg(jsonb_build_object('status', status, 'count', cnt))
    FROM (SELECT status, count(*) AS cnt FROM public.bookings_mirror GROUP BY status ORDER BY status) sub
  ),

  -- 8. Sequence untouched
  'booking_seq_last_value', (
    SELECT last_value FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'rcc_booking_number_seq'
  ),

  -- 9. Indexes created
  'idx_status', (SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_bookings_mirror_status')),
  'idx_date_overrides', (SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_booking_date_overrides_date')),
  'idx_slot_overrides', (SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_booking_slot_overrides_date')),

  -- 10. Policies on new tables
  'date_overrides_policies', (
    SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'booking_date_overrides'
  ),
  'slot_overrides_policies', (
    SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'booking_slot_overrides'
  ),

  -- 11. Function grants on new functions
  'grants_reject_booking', (
    SELECT jsonb_agg(grantee) FROM information_schema.routine_privileges
    WHERE routine_schema = 'public' AND routine_name = 'reject_booking'
  ),
  'grants_get_date_availability', (
    SELECT jsonb_agg(grantee) FROM information_schema.routine_privileges
    WHERE routine_schema = 'public' AND routine_name = 'get_date_availability'
  )

) AS verification_result;
