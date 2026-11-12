-- ==============================================================================
-- THE ARTIST NETWORK — Phase 4.6: Artist Calendar & Availability Management
-- Migration: 20261112_artist_calendar.sql
--
-- STATUS: READY FOR MANUAL EXECUTION IN SUPABASE SQL EDITOR
--
-- This migration sets up the private calendar and availability system for artists:
--   1. Table public.artist_calendar_events with strict time & financial constraints
--      (Uses standard TEXT CHECK constraints matching all existing platform tables)
--   2. Anti-tampering triggers protecting source, artist_id, and platform bookings
--   3. Strict Row Level Security (RLS) ensuring 100% private data isolation
--   4. Direct client write privileges (INSERT, UPDATE, DELETE) explicitly REVOKED
--   5. Atomic RPC public.save_artist_calendar_event with per-artist locking
--      and transaction-safe conflict detection
--   6. Atomic RPC public.delete_artist_calendar_event with platform booking shield
--
-- PRIVACY INVARIANT:
--   - ZERO public SELECT policies. Public/anon roles have ZERO grants.
--   - Public availability RPC is deliberately DEFERRED to Phase 5.
-- ==============================================================================

BEGIN;

-- ============================================================
-- 1. Table: public.artist_calendar_events
-- ============================================================

CREATE TABLE IF NOT EXISTS public.artist_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Event classification (Uses TEXT CHECK matching platform conventions)
  source TEXT NOT NULL DEFAULT 'external_manual'
    CHECK (source IN ('external_manual', 'platform_booking')),
  event_type TEXT NOT NULL DEFAULT 'gig_booking'
    CHECK (event_type IN ('gig_booking', 'unavailable_block')),
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('tentative', 'confirmed', 'cancelled', 'completed')),
  
  -- Title & Scheduling (stored as UTC timestamptz, interpreted in Asia/Kolkata)
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0 AND char_length(title) <= 120),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  
  -- Location Metadata
  city TEXT,
  venue_name TEXT,
  venue_address TEXT,
  
  -- Private Data (Strictly Owner-Only: Zero Public Exposure)
  client_name TEXT,
  client_phone TEXT,
  client_email TEXT,
  agreed_fee NUMERIC(12, 2) CHECK (agreed_fee IS NULL OR agreed_fee >= 0),
  deposit_paid NUMERIC(12, 2) CHECK (deposit_paid IS NULL OR deposit_paid >= 0),
  private_notes TEXT,
  
  -- Future Phase 5 integration placeholder (immutable by client roles)
  platform_inquiry_id UUID DEFAULT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Timing Invariant: end_time must be strictly greater than start_time
  CONSTRAINT chk_calendar_time_order CHECK (end_time > start_time)
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_artist_calendar_events_range 
  ON public.artist_calendar_events (artist_id, start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_artist_calendar_events_conflict 
  ON public.artist_calendar_events (artist_id, status, event_type)
  WHERE status = 'confirmed';


-- ============================================================
-- 2. Anti-Tampering Triggers
-- ============================================================

-- Function: Trigger for INSERT protection
CREATE OR REPLACE FUNCTION public.enforce_calendar_event_insert_protection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- 1. Ensure authenticated session
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to create calendar events' USING ERRCODE = '42501';
  END IF;

  -- 2. Verify caller matches artist_id
  IF NEW.artist_id <> auth.uid() THEN
    RAISE EXCEPTION 'Access Denied: Cannot create calendar events for another account' USING ERRCODE = '42501';
  END IF;

  -- 3. Verify user has artist role in public.profiles
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role IS DISTINCT FROM 'artist' THEN
    RAISE EXCEPTION 'Access Denied: Only registered artists can manage calendar events' USING ERRCODE = '42501';
  END IF;

  -- 4. Invariant: Clients cannot fabricate platform bookings
  IF NEW.source IS DISTINCT FROM 'external_manual' THEN
    RAISE EXCEPTION 'Access Denied: Manual calendar events must have source = external_manual' USING ERRCODE = '42501';
  END IF;

  -- 5. Invariant: Clients cannot assign arbitrary platform inquiry IDs
  IF NEW.platform_inquiry_id IS NOT NULL THEN
    RAISE EXCEPTION 'Access Denied: Platform inquiry ID cannot be assigned manually' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calendar_event_insert_protection ON public.artist_calendar_events;
CREATE TRIGGER trg_calendar_event_insert_protection
  BEFORE INSERT ON public.artist_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_calendar_event_insert_protection();


-- Function: Trigger for UPDATE protection
CREATE OR REPLACE FUNCTION public.enforce_calendar_event_update_protection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- 1. Prevent reassigning event ownership
  IF NEW.artist_id IS DISTINCT FROM OLD.artist_id THEN
    RAISE EXCEPTION 'Access Denied: Cannot transfer calendar events to another account' USING ERRCODE = '42501';
  END IF;

  -- 2. Prevent tampering with source
  IF NEW.source IS DISTINCT FROM OLD.source THEN
    RAISE EXCEPTION 'Access Denied: Event source is immutable' USING ERRCODE = '42501';
  END IF;

  -- 3. Prevent modifying platform inquiry reference
  IF NEW.platform_inquiry_id IS DISTINCT FROM OLD.platform_inquiry_id THEN
    RAISE EXCEPTION 'Access Denied: Platform inquiry reference is immutable' USING ERRCODE = '42501';
  END IF;

  -- 4. Protect future platform bookings from manual direct modification
  IF OLD.source = 'platform_booking' AND auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Access Denied: Platform-generated bookings cannot be modified manually' USING ERRCODE = '42501';
  END IF;

  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calendar_event_update_protection ON public.artist_calendar_events;
CREATE TRIGGER trg_calendar_event_update_protection
  BEFORE UPDATE ON public.artist_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_calendar_event_update_protection();


-- Function: Trigger for DELETE protection
CREATE OR REPLACE FUNCTION public.enforce_calendar_event_delete_protection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Prevent clients from directly deleting platform-generated bookings
  IF OLD.source = 'platform_booking' AND auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Access Denied: Platform-generated bookings cannot be deleted directly' USING ERRCODE = '42501';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_calendar_event_delete_protection ON public.artist_calendar_events;
CREATE TRIGGER trg_calendar_event_delete_protection
  BEFORE DELETE ON public.artist_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_calendar_event_delete_protection();


-- ============================================================
-- 3. Row Level Security (RLS) Policies
-- ============================================================

ALTER TABLE public.artist_calendar_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Artists can view their own calendar events" ON public.artist_calendar_events;
DROP POLICY IF EXISTS "Artists can insert their own manual calendar events" ON public.artist_calendar_events;
DROP POLICY IF EXISTS "Artists can update their own manual calendar events" ON public.artist_calendar_events;
DROP POLICY IF EXISTS "Artists can delete their own manual calendar events" ON public.artist_calendar_events;

-- 1. SELECT: Strictly owner-only
CREATE POLICY "Artists can view their own calendar events"
  ON public.artist_calendar_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = artist_id);

-- 2. INSERT: Strictly owner-only for external_manual
CREATE POLICY "Artists can insert their own manual calendar events"
  ON public.artist_calendar_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = artist_id
    AND source = 'external_manual'
  );

-- 3. UPDATE: Strictly owner-only for external_manual
CREATE POLICY "Artists can update their own manual calendar events"
  ON public.artist_calendar_events
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = artist_id AND source = 'external_manual')
  WITH CHECK (auth.uid() = artist_id AND source = 'external_manual');

-- 4. DELETE: Strictly owner-only for external_manual
CREATE POLICY "Artists can delete their own manual calendar events"
  ON public.artist_calendar_events
  FOR DELETE
  TO authenticated
  USING (auth.uid() = artist_id AND source = 'external_manual');

-- Permissions: Revoke all from anon/public; grant SELECT to authenticated only.
-- Direct client INSERT, UPDATE, and DELETE table privileges are explicitly REVOKED.
-- All mutations are guaranteed to execute via the atomic RPCs:
--   public.save_artist_calendar_event
--   public.delete_artist_calendar_event
-- This prevents any client from bypassing the per-artist lock or conflict detection rules.
REVOKE ALL ON public.artist_calendar_events FROM public, anon;
REVOKE INSERT, UPDATE, DELETE ON public.artist_calendar_events FROM authenticated;
GRANT SELECT ON public.artist_calendar_events TO authenticated;


-- ============================================================
-- 4. Atomic Calendar Write & Conflict Detection RPC
-- ============================================================

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
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(v_user_id::text));

  -- 4. If updating, verify ownership and source
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
    IF v_conflicts IS NOT NULL AND jsonb_array_length(v_conflicts) > 0 AND NOT p_allow_overlap THEN
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

-- Permissions on save RPC
REVOKE ALL ON FUNCTION public.save_artist_calendar_event FROM public, anon;
GRANT EXECUTE ON FUNCTION public.save_artist_calendar_event TO authenticated;


-- ============================================================
-- 5. Atomic Calendar Delete RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_artist_calendar_event(
  p_event_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_event RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_event 
  FROM public.artist_calendar_events 
  WHERE id = p_event_id AND artist_id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Event not found or access denied');
  END IF;

  IF v_event.source = 'platform_booking' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Platform-generated bookings cannot be deleted manually');
  END IF;

  DELETE FROM public.artist_calendar_events 
  WHERE id = p_event_id AND artist_id = v_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Event deleted successfully');
END;
$$;

-- Permissions on delete RPC
REVOKE ALL ON FUNCTION public.delete_artist_calendar_event FROM public, anon;
GRANT EXECUTE ON FUNCTION public.delete_artist_calendar_event TO authenticated;

COMMIT;

-- Notify PostgREST immediately after commit to reload the schema cache
NOTIFY pgrst, 'reload schema';
