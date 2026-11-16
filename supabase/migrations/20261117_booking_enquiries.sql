-- ==============================================================================
-- THE ARTIST NETWORK — Phase 5.1: Booking Enquiry System (Stage 1 Migration)
-- Migration File: supabase/migrations/20261117_booking_enquiries.sql
--
-- STATUS: DRAFT SPECIFICATION — AUDITED & CORRECTED FOR POSTGRESQL COMPATIBILITY
-- DO NOT EXECUTE AUTOMATICALLY. Must be reviewed and manually executed
-- in the Supabase Dashboard SQL Editor by the platform owner.
--
-- COMPATIBILITY & SECURITY FIXES APPLIED:
-- 1. NULLIF / COALESCE: Used bare keyword syntax NULLIF(...) and COALESCE(...)
--    instead of schema-qualified pg_catalog.* (as these are SQL grammatical
--    constructs, not procedural functions).
-- 2. BTRIM: Used pg_catalog.btrim(...) for whitespace trimming across all RPCs.
-- 3. STRICT SEARCH PATH: All 4 RPCs and the trigger maintain SECURITY DEFINER
--    and SET search_path = '' for maximum security.
-- 4. EXPLICIT NULL VALIDATION: Upfront checks for NULL artist ID, event date,
--    and event type before business logic.
-- 5. ROW LEVEL SECURITY (RLS): Tables use ENABLE ROW LEVEL SECURITY (without
--    FORCE). Authenticated users have SELECT only; direct table writes are
--    REVOKED. SECURITY DEFINER RPCs run as postgres to perform internal
--    mutations without RLS policy violations.
-- 6. ATOMIC CONCURRENCY & LIMITS:
--    - Max 3 OPEN enquiries per (business, artist) pair.
--    - Max 10 OPEN enquiries platform-wide per business.
--    - Max 5 submissions per business in last 1 hour.
--    - Duplicate open date guard.
--    - Concurrency safety guaranteed via strictly ordered transaction-level
--      advisory locks: (1) tan_enq_biz, then (2) tan_enq_pair.
-- 7. CALENDAR ISOLATION:
--    - Zero automatic calendar bookings or date blocks created.
-- ==============================================================================

BEGIN;

-- ============================================================
-- 1. Table: public.booking_enquiries
-- ============================================================

CREATE TABLE IF NOT EXISTS public.booking_enquiries (
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Key Relationships (Strictly tied to platform profiles)
  business_id             UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  artist_id               UUID          NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,

  -- Non-Binding State Machine
  -- Open: 'submitted', 'seen', 'info_requested', 'clarified'
  -- Terminal: 'interested', 'declined', 'withdrawn'
  status                  TEXT          NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'seen', 'info_requested', 'clarified', 'interested', 'declined', 'withdrawn')),

  -- Event Specifications
  event_date              DATE          NOT NULL,
  event_type              TEXT          NOT NULL
    CHECK (event_type IN ('wedding', 'corporate', 'restaurant', 'festival', 'private', 'concert', 'other')),
  event_location          TEXT          CHECK (event_location IS NULL OR char_length(event_location) <= 255),
  requirements            TEXT          CHECK (requirements IS NULL OR char_length(requirements) <= 2000),
  indicative_budget       NUMERIC(12,2) CHECK (indicative_budget IS NULL OR indicative_budget >= 0),
  business_message        TEXT          CHECK (business_message IS NULL OR char_length(business_message) <= 2000),

  -- Structured Two-Way Communication
  artist_response         TEXT          CHECK (artist_response IS NULL OR char_length(artist_response) <= 2000),
  business_clarification  TEXT          CHECK (business_clarification IS NULL OR char_length(business_clarification) <= 2000),

  -- Lifecycle Timestamps
  seen_at                 TIMESTAMPTZ,
  responded_at            TIMESTAMPTZ,
  clarified_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. Table: public.booking_enquiry_events (Append-Only Lifecycle History)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.booking_enquiry_events (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id    UUID        NOT NULL REFERENCES public.booking_enquiries(id) ON DELETE CASCADE,
  actor_id      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role    TEXT        NOT NULL CHECK (actor_role IN ('business', 'artist', 'admin')),
  action        TEXT        NOT NULL CHECK (action IN ('submitted', 'seen', 'info_requested', 'clarified', 'interested', 'declined', 'withdrawn')),
  notes         TEXT        CHECK (notes IS NULL OR char_length(notes) <= 2000),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. Performance, Active Filter & Audit Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_booking_enquiries_business 
  ON public.booking_enquiries (business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_booking_enquiries_artist 
  ON public.booking_enquiries (artist_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_booking_enquiries_status 
  ON public.booking_enquiries (status);

-- Partial index for active pair enquiries (accelerates pair quota lookup)
CREATE INDEX IF NOT EXISTS idx_booking_enquiries_open_pair 
  ON public.booking_enquiries (business_id, artist_id)
  WHERE status IN ('submitted', 'seen', 'info_requested', 'clarified');

-- Partial index for platform-wide open enquiries per business
CREATE INDEX IF NOT EXISTS idx_booking_enquiries_open_biz 
  ON public.booking_enquiries (business_id)
  WHERE status IN ('submitted', 'seen', 'info_requested', 'clarified');

-- Chronological events index
CREATE INDEX IF NOT EXISTS idx_booking_enquiry_events_enquiry 
  ON public.booking_enquiry_events (enquiry_id, created_at ASC);

-- ============================================================
-- 4. Row Level Security (RLS) & Client Privilege Revocation
-- ============================================================

ALTER TABLE public.booking_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_enquiry_events ENABLE ROW LEVEL SECURITY;

-- Revoke all direct client writes
REVOKE ALL ON TABLE public.booking_enquiries FROM PUBLIC;
REVOKE ALL ON TABLE public.booking_enquiries FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.booking_enquiries FROM authenticated;
GRANT SELECT ON TABLE public.booking_enquiries TO authenticated;

REVOKE ALL ON TABLE public.booking_enquiry_events FROM PUBLIC;
REVOKE ALL ON TABLE public.booking_enquiry_events FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.booking_enquiry_events FROM authenticated;
GRANT SELECT ON TABLE public.booking_enquiry_events TO authenticated;

-- SELECT Policies for booking_enquiries
DROP POLICY IF EXISTS "Business can view own sent enquiries" ON public.booking_enquiries;
CREATE POLICY "Business can view own sent enquiries"
  ON public.booking_enquiries
  FOR SELECT
  TO authenticated
  USING (business_id = auth.uid());

DROP POLICY IF EXISTS "Artist can view own received enquiries" ON public.booking_enquiries;
CREATE POLICY "Artist can view own received enquiries"
  ON public.booking_enquiries
  FOR SELECT
  TO authenticated
  USING (artist_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all enquiries" ON public.booking_enquiries;
CREATE POLICY "Admins can view all enquiries"
  ON public.booking_enquiries
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- SELECT Policy for booking_enquiry_events
DROP POLICY IF EXISTS "Participants can view enquiry events" ON public.booking_enquiry_events;
CREATE POLICY "Participants can view enquiry events"
  ON public.booking_enquiry_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.booking_enquiries e
      WHERE e.id = enquiry_id
        AND (e.business_id = auth.uid() OR e.artist_id = auth.uid())
    )
    OR public.is_admin()
  );

-- ============================================================
-- 5. Trigger: Auto-update updated_at timestamp
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_booking_enquiry_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_booking_enquiry_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_booking_enquiry_updated_at() FROM anon;
REVOKE ALL ON FUNCTION public.set_booking_enquiry_updated_at() FROM authenticated;

DROP TRIGGER IF EXISTS trg_booking_enquiries_updated_at ON public.booking_enquiries;
CREATE TRIGGER trg_booking_enquiries_updated_at
  BEFORE UPDATE ON public.booking_enquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_booking_enquiry_updated_at();

-- ============================================================
-- 6. RPC: public.submit_booking_enquiry()
--
-- Security Definer: Authenticated Business accounts only.
-- Strict search path: ''
--
-- Concurrency Locks (Strict Uniform Order):
--   1. pg_advisory_xact_lock('tan_enq_biz:' || business_id)
--   2. pg_advisory_xact_lock('tan_enq_pair:' || business_id || ':' || artist_id)
--
-- Rate Limits & Invariants:
--   - Role = 'business' in public.profiles.
--   - Target artist profile_status = 'published'.
--   - No self-enquiry (business_id <> artist_id).
--   - Event date >= tomorrow in Indian Standard Time (Asia/Kolkata).
--   - Max 3 OPEN enquiries per (business, artist) pair.
--   - Duplicate check: No other OPEN enquiry for exact same artist and date.
--   - Max 10 OPEN enquiries platform-wide for this business.
--   - Velocity rate limit: Max 5 submissions in last 1 hour.
-- ============================================================

CREATE OR REPLACE FUNCTION public.submit_booking_enquiry(
  p_artist_id         UUID,
  p_event_date        DATE,
  p_event_type        TEXT,
  p_event_location    TEXT    DEFAULT NULL,
  p_requirements      TEXT    DEFAULT NULL,
  p_indicative_budget NUMERIC DEFAULT NULL,
  p_business_message  TEXT    DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_business_id         UUID;
  v_business_role       TEXT;
  v_artist_status       TEXT;
  v_min_date            DATE;
  v_active_pair_count   INTEGER;
  v_duplicate_count     INTEGER;
  v_active_biz_count    INTEGER;
  v_hourly_count        INTEGER;
  v_enquiry_id          UUID;
  v_trimmed_location    TEXT;
  v_trimmed_reqs        TEXT;
  v_trimmed_msg         TEXT;
BEGIN
  -- 1. Parameter null checks
  IF p_artist_id IS NULL THEN
    RAISE EXCEPTION 'Missing Parameter: Target artist ID is required' USING ERRCODE = '23502';
  END IF;

  IF p_event_date IS NULL THEN
    RAISE EXCEPTION 'Missing Parameter: Event date is required' USING ERRCODE = '23502';
  END IF;

  IF p_event_type IS NULL OR pg_catalog.btrim(p_event_type) = '' THEN
    RAISE EXCEPTION 'Missing Parameter: Event type is required' USING ERRCODE = '23502';
  END IF;

  -- 2. Session verification
  v_business_id := auth.uid();
  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to submit a booking enquiry' USING ERRCODE = '42501';
  END IF;

  -- 3. Verify caller role from public.profiles
  SELECT role INTO v_business_role 
  FROM public.profiles 
  WHERE id = v_business_id;

  IF v_business_role IS DISTINCT FROM 'business' THEN
    RAISE EXCEPTION 'Access Denied: Only registered business accounts can submit booking enquiries' USING ERRCODE = '42501';
  END IF;

  -- 4. Prevent self-enquiries
  IF v_business_id = p_artist_id THEN
    RAISE EXCEPTION 'Invalid Target: You cannot submit a booking enquiry to your own account' USING ERRCODE = '23514';
  END IF;

  -- 5. Verify target artist exists and is published (not draft, pending, suspended, or rejected)
  SELECT profile_status INTO v_artist_status 
  FROM public.artist_profiles 
  WHERE id = p_artist_id;

  IF v_artist_status IS NULL THEN
    RAISE EXCEPTION 'Artist Not Found: The specified artist profile does not exist' USING ERRCODE = 'P0002';
  END IF;
  IF v_artist_status <> 'published' THEN
    RAISE EXCEPTION 'Artist Unavailable: Enquiries can only be submitted to published artists' USING ERRCODE = '23514';
  END IF;

  -- 6. Validate event date (Must be at least tomorrow in Indian Standard Time)
  v_min_date := (pg_catalog.now() AT TIME ZONE 'Asia/Kolkata')::DATE + INTERVAL '1 day';
  IF p_event_date < v_min_date THEN
    RAISE EXCEPTION 'Invalid Date: Event date must be in the future (at least tomorrow in Indian Standard Time)' USING ERRCODE = '23514';
  END IF;

  IF p_event_date > (pg_catalog.now() AT TIME ZONE 'Asia/Kolkata')::DATE + INTERVAL '730 days' THEN
    RAISE EXCEPTION 'Invalid Date: Event date cannot be more than 2 years in advance' USING ERRCODE = '23514';
  END IF;

  -- 7. Validate event type
  IF p_event_type NOT IN ('wedding', 'corporate', 'restaurant', 'festival', 'private', 'concert', 'other') THEN
    RAISE EXCEPTION 'Invalid Event Type: Must be wedding, corporate, restaurant, festival, private, concert, or other' USING ERRCODE = '23514';
  END IF;

  -- 8. Validate budget if provided
  IF p_indicative_budget IS NOT NULL AND p_indicative_budget < 0 THEN
    RAISE EXCEPTION 'Invalid Budget: Indicative budget cannot be negative' USING ERRCODE = '23514';
  END IF;

  -- 9. Trim string parameters using pg_catalog.btrim and standard NULLIF
  v_trimmed_location := NULLIF(pg_catalog.btrim(p_event_location), '');
  v_trimmed_reqs     := NULLIF(pg_catalog.btrim(p_requirements), '');
  v_trimmed_msg      := NULLIF(pg_catalog.btrim(p_business_message), '');

  IF v_trimmed_location IS NOT NULL AND pg_catalog.char_length(v_trimmed_location) > 255 THEN
    RAISE EXCEPTION 'Location text cannot exceed 255 characters' USING ERRCODE = '23514';
  END IF;

  IF v_trimmed_reqs IS NOT NULL AND pg_catalog.char_length(v_trimmed_reqs) > 2000 THEN
    RAISE EXCEPTION 'Requirements text cannot exceed 2000 characters' USING ERRCODE = '23514';
  END IF;

  IF v_trimmed_msg IS NOT NULL AND pg_catalog.char_length(v_trimmed_msg) > 2000 THEN
    RAISE EXCEPTION 'Business message cannot exceed 2000 characters' USING ERRCODE = '23514';
  END IF;

  -- 10. Acquire transaction-level advisory locks in STRICT UNIFORM ORDER
  -- Lock 1: Business Lock (serializes all submissions by this business)
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('tan_enq_biz:' || v_business_id::text)::bigint);
  -- Lock 2: Pair Lock (serializes submissions between this business and target artist)
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('tan_enq_pair:' || v_business_id::text || ':' || p_artist_id::text)::bigint);

  -- 11. Check 11a: Max 3 OPEN enquiries per (business, artist) pair
  SELECT pg_catalog.count(*) INTO v_active_pair_count
  FROM public.booking_enquiries
  WHERE business_id = v_business_id
    AND artist_id   = p_artist_id
    AND status IN ('submitted', 'seen', 'info_requested', 'clarified');

  IF v_active_pair_count >= 3 THEN
    RAISE EXCEPTION 'Active Limit Reached: You have 3 open enquiries with this artist. Please await a response before sending more.' USING ERRCODE = '23514';
  END IF;

  -- Check 11b: Duplicate open enquiry for exact same event date
  SELECT pg_catalog.count(*) INTO v_duplicate_count
  FROM public.booking_enquiries
  WHERE business_id = v_business_id
    AND artist_id   = p_artist_id
    AND event_date  = p_event_date
    AND status IN ('submitted', 'seen', 'info_requested', 'clarified');

  IF v_duplicate_count > 0 THEN
    RAISE EXCEPTION 'Duplicate Enquiry: You already have an open enquiry with this artist for %', p_event_date USING ERRCODE = '23514';
  END IF;

  -- Check 11c: Max 10 OPEN enquiries platform-wide per business
  SELECT pg_catalog.count(*) INTO v_active_biz_count
  FROM public.booking_enquiries
  WHERE business_id = v_business_id
    AND status IN ('submitted', 'seen', 'info_requested', 'clarified');

  IF v_active_biz_count >= 10 THEN
    RAISE EXCEPTION 'Platform Limit Reached: You have 10 open enquiries across all artists. Please wait for responses before sending more.' USING ERRCODE = '23514';
  END IF;

  -- Check 11d: Velocity Rate Limit (Max 5 submissions in last 1 hour)
  SELECT pg_catalog.count(*) INTO v_hourly_count
  FROM public.booking_enquiries
  WHERE business_id = v_business_id
    AND created_at > (pg_catalog.now() - INTERVAL '1 hour');

  IF v_hourly_count >= 5 THEN
    RAISE EXCEPTION 'Rate Limit Exceeded: Maximum 5 enquiries per hour permitted. Please try again later.' USING ERRCODE = '23514';
  END IF;

  -- 12. Insert enquiry record
  INSERT INTO public.booking_enquiries (
    business_id, artist_id, status, event_date, event_type,
    event_location, requirements, indicative_budget, business_message
  ) VALUES (
    v_business_id, p_artist_id, 'submitted', p_event_date, p_event_type,
    v_trimmed_location, v_trimmed_reqs, p_indicative_budget, v_trimmed_msg
  )
  RETURNING id INTO v_enquiry_id;

  -- 13. Append audit history event
  INSERT INTO public.booking_enquiry_events (
    enquiry_id, actor_id, actor_role, action, notes
  ) VALUES (
    v_enquiry_id, v_business_id, 'business', 'submitted',
    'Enquiry submitted for event on ' || p_event_date::TEXT || ' (' || p_event_type || ')'
  );

  RETURN v_enquiry_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_booking_enquiry(UUID, DATE, TEXT, TEXT, TEXT, NUMERIC, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_booking_enquiry(UUID, DATE, TEXT, TEXT, TEXT, NUMERIC, TEXT) FROM anon;
GRANT  EXECUTE ON FUNCTION public.submit_booking_enquiry(UUID, DATE, TEXT, TEXT, TEXT, NUMERIC, TEXT) TO authenticated;

-- ============================================================
-- 7. RPC: public.respond_to_booking_enquiry()
--
-- Security Definer: Authenticated Artist accounts only.
-- Strict search path: ''
--
-- Actions:
--   - 'seen': Mark enquiry viewed when expanded (idempotent; safe on repeat calls).
--   - 'interested': Express non-binding interest (terminal enquiry state).
--   - 'decline': Politely decline enquiry (terminal enquiry state).
--   - 'request_info': Ask business for clarification (requires response >= 5 chars).
-- ============================================================

CREATE OR REPLACE FUNCTION public.respond_to_booking_enquiry(
  p_enquiry_id      UUID,
  p_action          TEXT,
  p_response        TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_artist_id      UUID;
  v_artist_role    TEXT;
  v_current_status TEXT;
  v_trimmed_resp   TEXT;
BEGIN
  -- 1. Parameter null checks
  IF p_enquiry_id IS NULL THEN
    RAISE EXCEPTION 'Missing Parameter: Enquiry ID is required' USING ERRCODE = '23502';
  END IF;

  IF p_action IS NULL OR pg_catalog.btrim(p_action) = '' THEN
    RAISE EXCEPTION 'Missing Parameter: Action is required' USING ERRCODE = '23502';
  END IF;

  -- 2. Session verification
  v_artist_id := auth.uid();
  IF v_artist_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  -- 3. Verify artist role from public.profiles
  SELECT role INTO v_artist_role 
  FROM public.profiles 
  WHERE id = v_artist_id;

  IF v_artist_role IS DISTINCT FROM 'artist' THEN
    RAISE EXCEPTION 'Access Denied: Only artist accounts can respond to booking enquiries' USING ERRCODE = '42501';
  END IF;

  -- 4. Lock enquiry row FOR UPDATE (prevents concurrent race conditions)
  SELECT status INTO v_current_status
  FROM public.booking_enquiries
  WHERE id = p_enquiry_id AND artist_id = v_artist_id
  FOR UPDATE;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Enquiry Not Found or Access Denied' USING ERRCODE = 'P0002';
  END IF;

  v_trimmed_resp := NULLIF(pg_catalog.btrim(p_response), '');
  IF v_trimmed_resp IS NOT NULL AND pg_catalog.char_length(v_trimmed_resp) > 2000 THEN
    RAISE EXCEPTION 'Response text cannot exceed 2000 characters' USING ERRCODE = '23514';
  END IF;

  -- 5. State transition rules
  CASE p_action
    -- Action 5a: 'seen'
    WHEN 'seen' THEN
      IF v_current_status NOT IN ('submitted') THEN
        -- Idempotent: If already seen, info_requested, clarified, or terminal, safe no-op
        RETURN;
      END IF;

      UPDATE public.booking_enquiries
      SET status = 'seen', 
          seen_at = pg_catalog.now(), 
          updated_at = pg_catalog.now()
      WHERE id = p_enquiry_id AND artist_id = v_artist_id;

      INSERT INTO public.booking_enquiry_events (enquiry_id, actor_id, actor_role, action, notes)
      VALUES (p_enquiry_id, v_artist_id, 'artist', 'seen', 'Enquiry opened and viewed by artist');
      RETURN;

    -- Action 5b: 'interested' (Non-binding terminal expression of interest)
    WHEN 'interested' THEN
      IF v_current_status = 'interested' THEN
        RETURN; -- Idempotent
      END IF;

      IF v_current_status NOT IN ('submitted', 'seen', 'clarified') THEN
        RAISE EXCEPTION 'Cannot express interest: enquiry is currently in status "%"', v_current_status USING ERRCODE = '23514';
      END IF;

      UPDATE public.booking_enquiries
      SET status = 'interested',
          artist_response = COALESCE(v_trimmed_resp, artist_response),
          responded_at = pg_catalog.now(),
          seen_at = COALESCE(seen_at, pg_catalog.now()),
          updated_at = pg_catalog.now()
      WHERE id = p_enquiry_id AND artist_id = v_artist_id;

      INSERT INTO public.booking_enquiry_events (enquiry_id, actor_id, actor_role, action, notes)
      VALUES (p_enquiry_id, v_artist_id, 'artist', 'interested', COALESCE(v_trimmed_resp, 'Artist expressed non-binding interest'));
      RETURN;

    -- Action 5c: 'decline' (Terminal refusal)
    WHEN 'decline' THEN
      IF v_current_status = 'declined' THEN
        RETURN; -- Idempotent
      END IF;

      IF v_current_status NOT IN ('submitted', 'seen', 'info_requested', 'clarified') THEN
        RAISE EXCEPTION 'Cannot decline enquiry: enquiry is already concluded in status "%"', v_current_status USING ERRCODE = '23514';
      END IF;

      UPDATE public.booking_enquiries
      SET status = 'declined',
          artist_response = COALESCE(v_trimmed_resp, artist_response),
          responded_at = pg_catalog.now(),
          seen_at = COALESCE(seen_at, pg_catalog.now()),
          updated_at = pg_catalog.now()
      WHERE id = p_enquiry_id AND artist_id = v_artist_id;

      INSERT INTO public.booking_enquiry_events (enquiry_id, actor_id, actor_role, action, notes)
      VALUES (p_enquiry_id, v_artist_id, 'artist', 'declined', COALESCE(v_trimmed_resp, 'Artist declined enquiry'));
      RETURN;

    -- Action 5d: 'request_info' (Request structured clarification)
    WHEN 'request_info' THEN
      IF v_current_status NOT IN ('submitted', 'seen') THEN
        RAISE EXCEPTION 'Cannot request information: enquiry is currently in status "%"', v_current_status USING ERRCODE = '23514';
      END IF;

      IF v_trimmed_resp IS NULL OR pg_catalog.char_length(v_trimmed_resp) < 5 THEN
        RAISE EXCEPTION 'Clarification request requires a descriptive question or note (at least 5 characters)' USING ERRCODE = '23514';
      END IF;

      UPDATE public.booking_enquiries
      SET status = 'info_requested',
          artist_response = v_trimmed_resp,
          responded_at = pg_catalog.now(),
          seen_at = COALESCE(seen_at, pg_catalog.now()),
          updated_at = pg_catalog.now()
      WHERE id = p_enquiry_id AND artist_id = v_artist_id;

      INSERT INTO public.booking_enquiry_events (enquiry_id, actor_id, actor_role, action, notes)
      VALUES (p_enquiry_id, v_artist_id, 'artist', 'info_requested', v_trimmed_resp);
      RETURN;

    ELSE
      RAISE EXCEPTION 'Invalid Action: "%". Allowed actions: seen, interested, decline, request_info', p_action USING ERRCODE = '23514';
  END CASE;
END;
$$;

REVOKE ALL ON FUNCTION public.respond_to_booking_enquiry(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.respond_to_booking_enquiry(UUID, TEXT, TEXT) FROM anon;
GRANT  EXECUTE ON FUNCTION public.respond_to_booking_enquiry(UUID, TEXT, TEXT) TO authenticated;

-- ============================================================
-- 8. RPC: public.clarify_booking_enquiry()
--
-- Security Definer: Authenticated Business accounts only.
-- Strict search path: ''
--
-- Allows the business to provide exactly ONE structured clarification message
-- in response to an artist's 'info_requested' query.
-- Transitions status: 'info_requested' -> 'clarified'.
-- ============================================================

CREATE OR REPLACE FUNCTION public.clarify_booking_enquiry(
  p_enquiry_id     UUID,
  p_clarification  TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_business_id    UUID;
  v_business_role  TEXT;
  v_current_status TEXT;
  v_trimmed_clar   TEXT;
BEGIN
  -- 1. Parameter null checks
  IF p_enquiry_id IS NULL THEN
    RAISE EXCEPTION 'Missing Parameter: Enquiry ID is required' USING ERRCODE = '23502';
  END IF;

  -- 2. Session verification
  v_business_id := auth.uid();
  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  -- 3. Verify business role from public.profiles
  SELECT role INTO v_business_role 
  FROM public.profiles 
  WHERE id = v_business_id;

  IF v_business_role IS DISTINCT FROM 'business' THEN
    RAISE EXCEPTION 'Access Denied: Only business accounts can clarify booking enquiries' USING ERRCODE = '42501';
  END IF;

  -- 4. Validate clarification text
  v_trimmed_clar := NULLIF(pg_catalog.btrim(p_clarification), '');
  IF v_trimmed_clar IS NULL OR pg_catalog.char_length(v_trimmed_clar) < 5 THEN
    RAISE EXCEPTION 'Clarification message must be at least 5 characters long' USING ERRCODE = '23514';
  END IF;
  IF pg_catalog.char_length(v_trimmed_clar) > 2000 THEN
    RAISE EXCEPTION 'Clarification message cannot exceed 2000 characters' USING ERRCODE = '23514';
  END IF;

  -- 5. Lock enquiry row FOR UPDATE
  SELECT status INTO v_current_status
  FROM public.booking_enquiries
  WHERE id = p_enquiry_id AND business_id = v_business_id
  FOR UPDATE;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Enquiry Not Found or Access Denied' USING ERRCODE = 'P0002';
  END IF;

  IF v_current_status <> 'info_requested' THEN
    RAISE EXCEPTION 'Cannot clarify enquiry: status is currently "%" (must be "info_requested")', v_current_status USING ERRCODE = '23514';
  END IF;

  -- 6. Update status to 'clarified'
  UPDATE public.booking_enquiries
  SET status = 'clarified',
      business_clarification = v_trimmed_clar,
      clarified_at = pg_catalog.now(),
      updated_at = pg_catalog.now()
  WHERE id = p_enquiry_id AND business_id = v_business_id;

  -- 7. Append audit history event
  INSERT INTO public.booking_enquiry_events (
    enquiry_id, actor_id, actor_role, action, notes
  ) VALUES (
    p_enquiry_id, v_business_id, 'business', 'clarified', v_trimmed_clar
  );
END;
$$;

REVOKE ALL ON FUNCTION public.clarify_booking_enquiry(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.clarify_booking_enquiry(UUID, TEXT) FROM anon;
GRANT  EXECUTE ON FUNCTION public.clarify_booking_enquiry(UUID, TEXT) TO authenticated;

-- ============================================================
-- 9. RPC: public.withdraw_booking_enquiry()
--
-- Security Definer: Authenticated Business accounts only.
-- Strict search path: ''
--
-- Allows the business to withdraw an open enquiry before conclusion.
-- Permitted from open statuses: 'submitted', 'seen', 'info_requested', 'clarified'.
-- Transitions status -> 'withdrawn' (terminal).
-- ============================================================

CREATE OR REPLACE FUNCTION public.withdraw_booking_enquiry(
  p_enquiry_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_business_id    UUID;
  v_business_role  TEXT;
  v_current_status TEXT;
BEGIN
  -- 1. Parameter null checks
  IF p_enquiry_id IS NULL THEN
    RAISE EXCEPTION 'Missing Parameter: Enquiry ID is required' USING ERRCODE = '23502';
  END IF;

  -- 2. Session verification
  v_business_id := auth.uid();
  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  -- 3. Verify business role from public.profiles
  SELECT role INTO v_business_role 
  FROM public.profiles 
  WHERE id = v_business_id;

  IF v_business_role IS DISTINCT FROM 'business' THEN
    RAISE EXCEPTION 'Access Denied: Only business accounts can withdraw booking enquiries' USING ERRCODE = '42501';
  END IF;

  -- 4. Lock enquiry row FOR UPDATE
  SELECT status INTO v_current_status
  FROM public.booking_enquiries
  WHERE id = p_enquiry_id AND business_id = v_business_id
  FOR UPDATE;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Enquiry Not Found or Access Denied' USING ERRCODE = 'P0002';
  END IF;

  IF v_current_status = 'withdrawn' THEN
    RETURN; -- Idempotent
  END IF;

  IF v_current_status NOT IN ('submitted', 'seen', 'info_requested', 'clarified') THEN
    RAISE EXCEPTION 'Enquiry cannot be withdrawn: status is already concluded in "%"', v_current_status USING ERRCODE = '23514';
  END IF;

  -- 5. Update status to 'withdrawn'
  UPDATE public.booking_enquiries
  SET status = 'withdrawn', 
      updated_at = pg_catalog.now()
  WHERE id = p_enquiry_id AND business_id = v_business_id;

  -- 6. Append audit history event
  INSERT INTO public.booking_enquiry_events (
    enquiry_id, actor_id, actor_role, action, notes
  ) VALUES (
    p_enquiry_id, v_business_id, 'business', 'withdrawn', 'Enquiry withdrawn by business'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.withdraw_booking_enquiry(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.withdraw_booking_enquiry(UUID) FROM anon;
GRANT  EXECUTE ON FUNCTION public.withdraw_booking_enquiry(UUID) TO authenticated;

COMMIT;

-- ==============================================================================
-- POST-MIGRATION VERIFICATION SCRIPT (RUN AFTER EXECUTING IN SQL EDITOR)
-- ==============================================================================
--
-- 1. Confirm tables exist:
--    SELECT table_name FROM information_schema.tables 
--    WHERE table_schema = 'public' AND table_name IN ('booking_enquiries', 'booking_enquiry_events');
--
-- 2. Confirm RLS is enabled:
--    SELECT relname, relrowsecurity FROM pg_class 
--    WHERE relname IN ('booking_enquiries', 'booking_enquiry_events');
--
-- 3. Confirm all 4 RPCs exist and have search_path = '':
--    SELECT proname, prosecdef, proconfig FROM pg_proc 
--    WHERE proname IN ('submit_booking_enquiry', 'respond_to_booking_enquiry', 'clarify_booking_enquiry', 'withdraw_booking_enquiry');
--
-- 4. Confirm default PUBLIC execute is revoked:
--    SELECT routine_name, grantee, privilege_type 
--    FROM information_schema.routine_privileges 
--    WHERE routine_schema = 'public' 
--      AND routine_name IN ('submit_booking_enquiry', 'respond_to_booking_enquiry', 'clarify_booking_enquiry', 'withdraw_booking_enquiry');
--
-- ==============================================================================
-- ROLLBACK SCRIPT (IF REVERSAL IS EVER REQUIRED)
-- ==============================================================================
--
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.withdraw_booking_enquiry(UUID);
-- DROP FUNCTION IF EXISTS public.clarify_booking_enquiry(UUID, TEXT);
-- DROP FUNCTION IF EXISTS public.respond_to_booking_enquiry(UUID, TEXT, TEXT);
-- DROP FUNCTION IF EXISTS public.submit_booking_enquiry(UUID, DATE, TEXT, TEXT, TEXT, NUMERIC, TEXT);
-- DROP TRIGGER IF EXISTS trg_booking_enquiries_updated_at ON public.booking_enquiries;
-- DROP FUNCTION IF EXISTS public.set_booking_enquiry_updated_at();
-- DROP TABLE IF EXISTS public.booking_enquiry_events;
-- DROP TABLE IF EXISTS public.booking_enquiries;
-- COMMIT;
-- ==============================================================================
