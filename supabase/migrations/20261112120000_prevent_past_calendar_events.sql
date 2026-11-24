-- ==============================================================================
-- THE ARTIST NETWORK — Phase 4.6 Calendar Migration: Prevent Past-Date Bookings
-- Migration file: supabase/migrations/20261112_prevent_past_calendar_events.sql
-- 
-- DESCRIPTION:
--   Updates the save_artist_calendar_event RPC to enforce database-level
--   protection against past-date bookings and historical event modification:
--   1. Rejects creation of any new booking whose start_time <= clock_timestamp()
--   2. For events that have already started (start_time <= clock_timestamp()),
--      strictly forbids modifying scheduling fields (start_time, end_time, is_all_day).
--      Allows editing metadata (notes, venue, contacts, fee, deposit, title, status).
--   3. For future events, strictly rejects rescheduling start_time to a past timestamp.
--
-- STATUS:
--   PREPARED FOR OWNER REVIEW — DO NOT AUTO-EXECUTE.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.save_artist_calendar_event(
  p_event_id UUID DEFAULT NULL,
  p_title TEXT DEFAULT NULL,
  p_event_type TEXT DEFAULT 'gig_booking',
  p_status TEXT DEFAULT 'confirmed',
  p_start_time TIMESTAMPTZ DEFAULT NULL,
  p_end_time TIMESTAMPTZ DEFAULT NULL,
  p_is_all_day BOOLEAN DEFAULT false,
  p_city TEXT DEFAULT NULL,
  p_venue_name TEXT DEFAULT NULL,
  p_venue_address TEXT DEFAULT NULL,
  p_client_name TEXT DEFAULT NULL,
  p_client_phone TEXT DEFAULT NULL,
  p_client_email TEXT DEFAULT NULL,
  p_agreed_fee NUMERIC DEFAULT NULL,
  p_deposit_paid NUMERIC DEFAULT NULL,
  p_private_notes TEXT DEFAULT NULL,
  p_allow_overlap BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
  v_existing_event RECORD;
  v_conflicts JSONB;
  v_saved_id UUID;
BEGIN
  -- 1. Authorization & Role Verification
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = v_user_id;
  IF v_role IS DISTINCT FROM 'artist' THEN
    RAISE EXCEPTION 'Only registered artists can manage calendar events' USING ERRCODE = '42501';
  END IF;

  -- 2. Input validation
  IF p_title IS NULL OR char_length(trim(p_title)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Event title is required');
  END IF;

  IF char_length(p_title) > 120 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Event title cannot exceed 120 characters');
  END IF;

  IF p_start_time IS NULL OR p_end_time IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Start time and end time are required');
  END IF;

  IF p_end_time <= p_start_time THEN
    RETURN jsonb_build_object('success', false, 'error', 'End time must be strictly after start time');
  END IF;

  IF p_event_type NOT IN ('gig_booking', 'unavailable_block') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid event_type. Must be gig_booking or unavailable_block');
  END IF;

  IF p_status NOT IN ('tentative', 'confirmed', 'cancelled', 'completed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid status. Must be tentative, confirmed, cancelled, or completed');
  END IF;

  -- 3. Acquire Per-Artist Advisory Lock (Serializes writes for this artist within transaction)
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(v_user_id::text)::bigint);

  -- 4. Ownership verification & Past-Date Enforcement
  IF p_event_id IS NOT NULL THEN
    SELECT * INTO v_existing_event 
    FROM public.artist_calendar_events 
    WHERE id = p_event_id AND artist_id = v_user_id;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Event not found or access denied');
    END IF;

    IF v_existing_event.source = 'platform_booking' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Platform-generated bookings cannot be modified manually');
    END IF;

    -- Once an event has started, do not permit changes to start_time, end_time, or is_all_day
    IF v_existing_event.start_time <= pg_catalog.clock_timestamp() THEN
      IF p_start_time <> v_existing_event.start_time 
         OR p_end_time <> v_existing_event.end_time 
         OR p_is_all_day <> v_existing_event.is_all_day THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Scheduling details (start time, end time, and all-day setting) cannot be modified for events that have already started or concluded.'
        );
      END IF;
    ELSE
      -- For future events being rescheduled, new start_time must strictly be in the future
      IF p_start_time <> v_existing_event.start_time AND p_start_time <= pg_catalog.clock_timestamp() THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Rescheduled events must start in the future. Please select a later date or time.'
        );
      END IF;
    END IF;
  ELSE
    -- Creation protection: new bookings must strictly start in the future
    IF p_start_time <= pg_catalog.clock_timestamp() THEN
      RETURN jsonb_build_object('success', false, 'error', 'Bookings must start in the future. Please select a later date or time.');
    END IF;
  END IF;

  -- 5. Conflict Detection (Only for confirmed events)
  IF p_status = 'confirmed' THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', e.id,
        'title', e.title,
        'start_time', e.start_time,
        'end_time', e.end_time,
        'event_type', e.event_type,
        'is_all_day', e.is_all_day
      )
    ) INTO v_conflicts
    FROM public.artist_calendar_events e
    WHERE e.artist_id = v_user_id
      AND e.status = 'confirmed'
      AND (p_event_id IS NULL OR e.id <> p_event_id)
      -- Half-open interval overlap check [start, end)
      AND e.start_time < p_end_time
      AND e.end_time > p_start_time;

    -- If conflicts found and explicit acknowledgment is false, return conflict payload without saving
    IF v_conflicts IS NOT NULL AND NOT p_allow_overlap THEN
      RETURN jsonb_build_object(
        'success', false,
        'conflict', true,
        'conflicts', v_conflicts,
        'message', 'Schedule overlaps with existing confirmed event(s). Explicit confirmation required.'
      );
    END IF;
  END IF;

  -- 6. Insert or Update Execution
  IF p_event_id IS NOT NULL THEN
    UPDATE public.artist_calendar_events
    SET
      title = trim(p_title),
      event_type = p_event_type,
      status = p_status,
      start_time = p_start_time,
      end_time = p_end_time,
      is_all_day = p_is_all_day,
      city = trim(p_city),
      venue_name = trim(p_venue_name),
      venue_address = trim(p_venue_address),
      client_name = trim(p_client_name),
      client_phone = trim(p_client_phone),
      client_email = trim(p_client_email),
      agreed_fee = p_agreed_fee,
      deposit_paid = p_deposit_paid,
      private_notes = trim(p_private_notes),
      updated_at = pg_catalog.now()
    WHERE id = p_event_id AND artist_id = v_user_id
    RETURNING id INTO v_saved_id;
  ELSE
    INSERT INTO public.artist_calendar_events (
      artist_id,
      source,
      event_type,
      status,
      title,
      start_time,
      end_time,
      is_all_day,
      city,
      venue_name,
      venue_address,
      client_name,
      client_phone,
      client_email,
      agreed_fee,
      deposit_paid,
      private_notes
    ) VALUES (
      v_user_id,
      'external_manual',
      p_event_type,
      p_status,
      trim(p_title),
      p_start_time,
      p_end_time,
      p_is_all_day,
      trim(p_city),
      trim(p_venue_name),
      trim(p_venue_address),
      trim(p_client_name),
      trim(p_client_phone),
      trim(p_client_email),
      p_agreed_fee,
      p_deposit_paid,
      trim(p_private_notes)
    )
    RETURNING id INTO v_saved_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'conflict', false,
    'event_id', v_saved_id,
    'message', 'Event saved successfully'
  );
END;
$$;

-- Permissions on save RPC (Explicit signatures and isolated role grants)
REVOKE ALL ON FUNCTION public.save_artist_calendar_event(
  UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, BOOLEAN
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.save_artist_calendar_event(
  UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, BOOLEAN
) FROM anon;

GRANT EXECUTE ON FUNCTION public.save_artist_calendar_event(
  UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, BOOLEAN
) TO authenticated;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
