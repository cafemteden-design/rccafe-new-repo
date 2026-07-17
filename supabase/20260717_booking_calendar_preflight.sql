-- ============================================================
-- CONSOLIDATED PREFLIGHT DIAGNOSTIC — 100% READ-ONLY
-- Run in Supabase SQL Editor with Role: postgres
-- Date: 2026-07-17
-- Purpose: Single-query diagnostic returning all schema state as JSON.
-- Safety: One SELECT, no DDL/DML/DCL.
-- ============================================================
-- This returns ONE JSON result containing everything needed to
-- write a safe final migration.
-- ============================================================

SELECT jsonb_build_object(

  -- 1. PostgreSQL version
  'pg_version', version(),

  -- 2. Table existence and approximate row counts
  'tables', (
    SELECT jsonb_agg(jsonb_build_object(
      'schema', t.table_schema,
      'name', t.table_name,
      'columns', (SELECT count(*) FROM information_schema.columns c
                  WHERE c.table_schema = t.table_schema AND c.table_name = t.table_name),
      'approx_rows', COALESCE(s.n_live_tup, 0)
    ) ORDER BY t.table_name)
    FROM information_schema.tables t
    LEFT JOIN pg_stat_user_tables s
      ON s.schemaname = t.table_schema AND s.relname = t.table_name
    WHERE t.table_schema = 'public'
      AND t.table_name IN (
        'bookings_mirror','booking_settings','booking_slot_capacity',
        'booking_date_overrides','booking_slot_overrides',
        'profiles','activity_logs','reward_cards','reward_events',
        'website_leads','customers'
      )
  ),

  -- 3. bookings_mirror columns
  'bookings_mirror_columns', (
    SELECT jsonb_agg(jsonb_build_object(
      'col', column_name, 'type', data_type, 'udt', udt_name,
      'nullable', is_nullable, 'default', column_default
    ) ORDER BY ordinal_position)
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings_mirror'
  ),

  -- 4. bookings_mirror constraints (CHECK, PK, UNIQUE, FK)
  'bookings_mirror_constraints', (
    SELECT jsonb_agg(jsonb_build_object(
      'name', con.conname,
      'type', con.contype,
      'definition', pg_get_constraintdef(con.oid)
    ) ORDER BY con.conname)
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public' AND rel.relname = 'bookings_mirror'
  ),

  -- 5. Distinct booking status values in production data
  'booking_status_counts', (
    SELECT jsonb_agg(jsonb_build_object('status', status, 'count', cnt) ORDER BY status)
    FROM (SELECT status, count(*) AS cnt FROM public.bookings_mirror GROUP BY status) sub
  ),

  -- 6. booking_date_overrides columns (NULL if table doesn't exist)
  'booking_date_overrides_columns', (
    SELECT jsonb_agg(jsonb_build_object(
      'col', column_name, 'type', data_type, 'udt', udt_name,
      'nullable', is_nullable, 'default', column_default
    ) ORDER BY ordinal_position)
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'booking_date_overrides'
  ),

  -- 7. booking_slot_overrides columns (NULL if table doesn't exist)
  'booking_slot_overrides_columns', (
    SELECT jsonb_agg(jsonb_build_object(
      'col', column_name, 'type', data_type, 'udt', udt_name,
      'nullable', is_nullable, 'default', column_default
    ) ORDER BY ordinal_position)
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'booking_slot_overrides'
  ),

  -- 8. booking_slot_capacity columns
  'booking_slot_capacity_columns', (
    SELECT jsonb_agg(jsonb_build_object(
      'col', column_name, 'type', data_type, 'udt', udt_name,
      'nullable', is_nullable, 'default', column_default
    ) ORDER BY ordinal_position)
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'booking_slot_capacity'
  ),

  -- 9. booking_settings columns
  'booking_settings_columns', (
    SELECT jsonb_agg(jsonb_build_object(
      'col', column_name, 'type', data_type, 'udt', udt_name
    ) ORDER BY ordinal_position)
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'booking_settings'
  ),

  -- 10. activity_logs columns
  'activity_logs_columns', (
    SELECT jsonb_agg(jsonb_build_object(
      'col', column_name, 'type', data_type, 'udt', udt_name
    ) ORDER BY ordinal_position)
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'activity_logs'
  ),

  -- 11. profiles columns
  'profiles_columns', (
    SELECT jsonb_agg(jsonb_build_object(
      'col', column_name, 'type', data_type, 'udt', udt_name
    ) ORDER BY ordinal_position)
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ),

  -- 12. All RLS policies on relevant tables
  'rls_policies', (
    SELECT jsonb_agg(jsonb_build_object(
      'table', tablename, 'policy', policyname,
      'permissive', permissive, 'roles', roles,
      'cmd', cmd, 'using', qual, 'with_check', with_check
    ) ORDER BY tablename, policyname)
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'bookings_mirror','booking_slot_capacity',
        'booking_date_overrides','booking_slot_overrides',
        'profiles','activity_logs','booking_settings'
      )
  ),

  -- 13. RLS enabled status
  'rls_status', (
    SELECT jsonb_agg(jsonb_build_object(
      'table', relname, 'rls_enabled', relrowsecurity, 'rls_forced', relforcerowsecurity
    ) ORDER BY relname)
    FROM pg_class
    JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
    WHERE pg_namespace.nspname = 'public'
      AND relname IN (
        'bookings_mirror','booking_slot_capacity',
        'booking_date_overrides','booking_slot_overrides',
        'profiles','activity_logs','booking_settings'
      )
  ),

  -- 14. All indexes on relevant tables
  'indexes', (
    SELECT jsonb_agg(jsonb_build_object(
      'table', tablename, 'name', indexname, 'def', indexdef
    ) ORDER BY tablename, indexname)
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename IN (
        'bookings_mirror','booking_slot_capacity',
        'booking_date_overrides','booking_slot_overrides'
      )
  ),

  -- 15. Triggers on relevant tables
  'triggers', (
    SELECT jsonb_agg(jsonb_build_object(
      'trigger', trigger_name, 'event', event_manipulation,
      'table', event_object_table, 'action', action_statement
    ) ORDER BY event_object_table, trigger_name)
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
      AND event_object_table IN (
        'bookings_mirror','booking_slot_capacity',
        'booking_date_overrides','booking_slot_overrides'
      )
  ),

  -- 16. Function signatures, owner, security, config
  'functions', (
    SELECT jsonb_agg(jsonb_build_object(
      'name', p.proname,
      'args', pg_get_function_identity_arguments(p.oid),
      'returns', pg_get_function_result(p.oid),
      'security_definer', p.prosecdef,
      'config', p.proconfig,
      'owner', pg_get_userbyid(p.proowner),
      'volatility', p.provolatile,
      'language', l.lanname
    ) ORDER BY p.proname)
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_language l ON l.oid = p.prolang
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'create_booking_request_v3','create_booking_request_v4',
        'set_booking_status','cancel_confirmed_booking',
        'record_booking_sheet_sync_v3','get_admin_dashboard_stats',
        'is_valid_booking_slot','update_booking_admin_v3','update_booking_admin_v4',
        'reject_booking','mark_confirmation_email_sent','mark_rejection_email_sent',
        'get_date_availability','refresh_booking_slot_capacity_for',
        'refresh_booking_slot_capacity','get_slot_availability_v3',
        'is_admin','is_staff','touch_updated_at'
      )
  ),

  -- 17. Function GRANTs
  'function_grants', (
    SELECT jsonb_agg(jsonb_build_object(
      'function', routine_name, 'grantee', grantee, 'privilege', privilege_type
    ) ORDER BY routine_name, grantee)
    FROM information_schema.routine_privileges
    WHERE routine_schema = 'public'
      AND routine_name IN (
        'create_booking_request_v3','create_booking_request_v4',
        'set_booking_status','cancel_confirmed_booking',
        'record_booking_sheet_sync_v3','get_admin_dashboard_stats',
        'reject_booking','mark_confirmation_email_sent','mark_rejection_email_sent',
        'get_date_availability','refresh_booking_slot_capacity_for',
        'refresh_booking_slot_capacity','get_slot_availability_v3',
        'is_admin','is_staff'
      )
  ),

  -- 18. Constraints on override tables (if they exist)
  'override_table_constraints', (
    SELECT jsonb_agg(jsonb_build_object(
      'table', rel.relname, 'name', con.conname,
      'type', con.contype, 'def', pg_get_constraintdef(con.oid)
    ) ORDER BY rel.relname, con.conname)
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname IN ('booking_date_overrides', 'booking_slot_overrides')
  ),

  -- 19. Enum types (if any exist in the public schema)
  'enums', (
    SELECT count(*) FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
  ),

  -- 20. Migration tracking tables
  'migration_tables', (
    SELECT jsonb_agg(table_name ORDER BY table_name)
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('schema_migrations','supabase_migrations','migration_history','migrations')
  ),

  -- 21. Sequences (for booking reference numbering)
  'sequences', (
    SELECT jsonb_agg(jsonb_build_object(
      'name', sequencename, 'last_value', last_value, 'increment', increment_by
    ) ORDER BY sequencename)
    FROM pg_sequences
    WHERE schemaname = 'public'
      AND sequencename LIKE '%booking%'
  )

) AS preflight_result;
