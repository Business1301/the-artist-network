-- ==============================================================================
-- THE ARTIST NETWORK — Phase 4.6: Safe Migration Recovery & Rollback Procedure
-- File: 20261112_artist_calendar_rollback.sql
--
-- STATUS: PLANNING / CONTINGENCY ONLY (DO NOT EXECUTE WITHOUT EXPLICIT APPROVAL)
--
-- SAFETY INVARIANT:
--   - This script NEVER performs an unqualified destructive DROP TABLE on live artist data.
--   - If records exist in public.artist_calendar_events, this script will deliberately
--     ABORT and require manual data archival/backup before proceeding.
-- ==============================================================================

DO $$
DECLARE
  v_table_exists BOOLEAN;
  v_record_count INTEGER := 0;
  v_force_destructive BOOLEAN := false; -- SAFETY LATCH: Must be explicitly changed by owner
BEGIN
  -- 1. Check if the table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'artist_calendar_events'
  ) INTO v_table_exists;

  -- 2. If table exists, inspect row count
  IF v_table_exists THEN
    EXECUTE 'SELECT count(*) FROM public.artist_calendar_events' INTO v_record_count;

    IF v_record_count > 0 AND NOT v_force_destructive THEN
      RAISE EXCEPTION 
        'SAFETY ABORT: Cannot drop public.artist_calendar_events because it contains % active calendar records. ' ||
        'Dropping would cause irreversible data loss. ' ||
        'Recovery procedure: ' ||
        '1) Export table data as CSV/JSON via Supabase Dashboard. ' ||
        '2) Or rename table: ALTER TABLE public.artist_calendar_events RENAME TO artist_calendar_events_backup_%s; ' ||
        '3) Set v_force_destructive := true only after verifying backup.',
        v_record_count,
        to_char(now(), 'YYYYMMDD_HH24MISS')
      USING ERRCODE = '55000';
    END IF;
  END IF;

  -- 3. If records exist but force_destructive was approved, archive rather than destroy
  IF v_table_exists AND v_record_count > 0 AND v_force_destructive THEN
    EXECUTE format(
      'ALTER TABLE public.artist_calendar_events RENAME TO artist_calendar_events_archive_%s',
      to_char(now(), 'YYYYMMDD_HH24MISS')
    );
    RAISE NOTICE 'Safety Archival: Table renamed to archive instead of permanent deletion.';
  ELSIF v_table_exists THEN
    -- Table is completely empty; safe to drop cleanly
    DROP TABLE public.artist_calendar_events CASCADE;
    RAISE NOTICE 'Clean Rollback: Empty table dropped successfully.';
  END IF;
END $$;

-- Drop RPCs
DROP FUNCTION IF EXISTS public.delete_artist_calendar_event(UUID);
DROP FUNCTION IF EXISTS public.save_artist_calendar_event(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, BOOLEAN);

-- Drop Triggers and Trigger Functions
DROP TRIGGER IF EXISTS trg_calendar_event_delete_protection ON public.artist_calendar_events;
DROP TRIGGER IF EXISTS trg_calendar_event_update_protection ON public.artist_calendar_events;
DROP TRIGGER IF EXISTS trg_calendar_event_insert_protection ON public.artist_calendar_events;

DROP FUNCTION IF EXISTS public.enforce_calendar_event_delete_protection();
DROP FUNCTION IF EXISTS public.enforce_calendar_event_update_protection();
DROP FUNCTION IF EXISTS public.enforce_calendar_event_insert_protection();

-- Drop Custom Types only if no other tables depend on them
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE udt_name = 'calendar_booking_status' AND table_name <> 'artist_calendar_events'
  ) THEN
    DROP TYPE IF EXISTS public.calendar_booking_status;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE udt_name = 'calendar_event_type' AND table_name <> 'artist_calendar_events'
  ) THEN
    DROP TYPE IF EXISTS public.calendar_event_type;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE udt_name = 'calendar_event_source' AND table_name <> 'artist_calendar_events'
  ) THEN
    DROP TYPE IF EXISTS public.calendar_event_source;
  END IF;
END $$;
