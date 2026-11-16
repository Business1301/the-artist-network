-- ==============================================================================
-- THE ARTIST NETWORK — Phase 5.1: Booking Enquiry System (Stage 1 Migration)
-- Migration File: supabase/migrations/20261117_booking_enquiries.sql
--
-- STATUS: DRAFT SPECIFICATION — PENDING MANUAL EXECUTION APPROVAL
-- DO NOT EXECUTE AUTOMATICALLY. Must be reviewed and manually executed
-- in the Supabase Dashboard SQL Editor by the platform owner.
--
-- ARCHITECTURAL INVARIANTS:
--   1. NON-BINDING ENQUIRIES ONLY:
--      Status 'interested' replaces any notion of booking acceptance.
--      An enquiry carries ZERO legal obligation, ZERO payment processing,
--      and ZERO automatic calendar reservations.
--   2. CALENDAR ISOLATION:
--      Phase 5.1 enquiries DO NOT write to public.artist_calendar_events.
--      The existing platform_inquiry_id column in calendar events remains
--      an untouched placeholder for future confirmed bookings (Phase 5.2+).
--   3. ATOMIC CONCURRENCY & SPAM DEFENSE:
--      - Max 3 active enquiries per business-artist pair.
--      - Max 10 active enquiries platform-wide per business account.
--      - Max 5 enquiries submitted per business account in any 1-hour window.
--      - Concurrency safety enforced via PostgreSQL transaction-level
--        advisory locks (pg_advisory_xact_lock) inside the submission RPC.
--   4. TIME ZONE POLICY:
--      Event dates validated in Indian Standard Time (Asia/Kolkata = UTC+5:30).
--      No static table-level CHECK (event_date >= CURRENT_DATE), ensuring
--      historical records remain valid across time without restore issues.
--   5. SINGLE STRUCTURED CLARIFICATION:
--      When an artist sets status to 'info_requested', the business can submit
--      one structured clarification message via clarify_booking_enquiry().
--      The enquiry cannot become stuck in an unusable state.
--   6. READ-SAFETY:
--      Fetching records does NOT mark them as seen. The 'seen' status requires
--      an explicit call to respond_to_booking_enquiry(id, 'seen').
--   7. COMPLETE RLS PRIVACY:
--      Direct client write access is completely REVOKED from PUBLIC, anon,
--      and authenticated. All mutations execute via SECURITY DEFINER RPCs
--      with SET search_path = ''.
--
-- ==============================================================================

BEGIN;

-- ============================================================
-- 1. Table: public.booking_enquiries
-- ============================================================

CREATE TABLE IF NOT EXISTS public.booking_enquiries (
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Key Relationships
  business_id             UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  artist_id               UUID          NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,

  -- Non-Binding State Machine
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
  business_clarification   TEXT          CHECK (business_clarification IS NULL OR char_length(business_clarification) <= 2000),

  -- Lifecycle Timestamps
  seen_at                 TIMESTAMPTZ,
  responded_at            TIMESTAMPTZ,
  clarified_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. Table: public.booking_enquiry_events (Append-Only Audit History)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.booking_enquiry_events (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id    UUID        NOT NULL REFERENCES public.booking_enquiries(id) ON DELETE CASCADE,
  actor_id      UUID        NOT NULL REFERENCES public.profiles(id),
  actor_role    TEXT        NOT NULL CHECK (actor_role IN ('business', 'artist', 'admin')),
  action        TEXT        NOT NULL CHECK (action IN ('submitted', 'seen', 'info_requested', 'clarified', 'interested', 'declined', 'withdrawn')),
  notes         TEXT        CHECK (notes IS NULL OR char_length(notes) <= 2000),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. Performance & Audit Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_booking_enquiries_business 
  ON public.booking_enquiries (business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_booking_enquiries_artist 
  ON public.booking_enquiries (artist_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_booking_enquiries_status 
  ON public.booking_enquiries (status);

CREATE INDEX IF NOT EXISTS idx_booking_enquiries_active_pair 
  ON public.booking_enquiries (business_id, artist_id)
  WHERE status NOT IN ('declined', 'withdrawn');

CREATE INDEX IF NOT EXISTS idx_booking_enquiry_events_enquiry 
  ON public.booking_enquiry_events (enquiry_id, created_at ASC);

-- ============================================================
-- 4. Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.booking_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_enquiry_events ENABLE ROW LEVEL SECURITY;

-- Revoke all direct client writes
REVOKE INSERT, UPDATE, DELETE ON public.booking_enquiries FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.booking_enquiries FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.booking_enquiries FROM authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.booking_enquiry_events FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.booking_enquiry_events FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.booking_enquiry_events FROM authenticated;

-- SELECT Policies for booking_enquiries
CREATE POLICY "Business can view own sent enquiries"
  ON public.booking_enquiries
  FOR SELECT
  TO authenticated
  USING (business_id = auth.uid());

CREATE POLICY "Artist can view own received enquiries"
  ON public.booking_enquiries
  FOR SELECT
  TO authenticated
  USING (artist_id = auth.uid());

CREATE POLICY "Admins can view all enquiries"
  ON public.booking_enquiries
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- SELECT Policies for booking_enquiry_events
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
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_booking_enquiries_updated_at ON public.booking_enquiries;
CREATE TRIGGER trg_booking_enquiries_updated_at
  BEFORE UPDATE ON public.booking_enquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_booking_enquiry_updated_at();

-- ============================================================
-- 6. RPC: public.submit_booking_enquiry()
--
-- Security Definer: Authenticated Business accounts only.
-- Enforces:
--   - Role = 'business' in public.profiles.
--   - Target artist profile_status = 'published'.
--   - No self-enquiries.
--   - Event date in the future (at least tomorrow in Asia/Kolkata).
--   - Concurrency-safe advisory locks:
--       * Max 3 active enquiries per business-artist pair.
--       * Max 10 active enquiries platform-wide per business.
--       * Max 5 enquiries submitted per business in last 1 hour.
--   - Atomically records submission in booking_enquiry_events.
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
  v_active_biz_count    INTEGER;
  v_hourly_count        INTEGER;
  v_enquiry_id          UUID;
BEGIN
  -- 1. Session verification
  v_business_id := auth.uid();
  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to submit a booking enquiry' USING ERRCODE = '42501';
  END IF;

  -- 2. Verify business role from public.profiles
  SELECT role INTO v_business_role FROM public.profiles WHERE id = v_business_id;
  IF v_business_role IS DISTINCT FROM 'business' THEN
    RAISE EXCEPTION 'Access Denied: Only registered business accounts can submit booking enquiries' USING ERRCODE = '42501';
  END IF;

  -- 3. Prevent self-enquiries
  IF v_business_id = p_artist_id THEN
    RAISE EXCEPTION 'Invalid Target: You cannot submit a booking enquiry to your own account' USING ERRCODE = '23514';
  END IF;

  -- 4. Verify target artist exists and is published
  SELECT profile_status INTO v_artist_status FROM public.artist_profiles WHERE id = p_artist_id;
  IF v_artist_status IS NULL THEN
    RAISE EXCEPTION 'Artist Not Found: The specified artist profile does not exist' USING ERRCODE = 'P0002';
  END IF;
  IF v_artist_status <> 'published' THEN
    RAISE EXCEPTION 'Artist Unavailable: Enquiries can only be submitted to published artists' USING ERRCODE = '23514';
  END IF;

  -- 5. Validate event date (Must be at least tomorrow in Indian Standard Time)
  v_min_date := (now() AT TIME ZONE 'Asia/Kolkata')::DATE + INTERVAL '1 day';
  IF p_event_date < v_min_date THEN
    RAISE EXCEPTION 'Invalid Date: Event date must be in the future (at least tomorrow in Indian Standard Time)' USING ERRCODE = '23514';
  END IF;

  -- 6. Validate event type
  IF p_event_type NOT IN ('wedding', 'corporate', 'restaurant', 'festival', 'private', 'concert', 'other') THEN
    RAISE EXCEPTION 'Invalid Event Type: Must be wedding, corporate, restaurant, festival, private, concert, or other' USING ERRCODE = '23514';
  END IF;

  -- 7. Acquire transaction-level advisory locks for concurrency safety
  PERFORM pg_advisory_xact_lock(hashtext('enquiry_pair:' || v_business_id::text || ':' || p_artist_id::text)::bigint);
  PERFORM pg_advisory_xact_lock(hashtext('enquiry_biz:' || v_business_id::text)::bigint);

  -- Check 7a: Max 3 active enquiries per business-artist pair
  SELECT COUNT(*) INTO v_active_pair_count
  FROM public.booking_enquiries
  WHERE business_id = v_business_id
    AND artist_id   = p_artist_id
    AND status NOT IN ('declined', 'withdrawn');

  IF v_active_pair_count >= 3 THEN
    RAISE EXCEPTION 'Active Limit Reached: You have 3 active enquiries with this artist. Please await a response before sending more.' USING ERRCODE = '23514';
  END IF;

  -- Check 7b: Max 10 active enquiries platform-wide per business
  SELECT COUNT(*) INTO v_active_biz_count
  FROM public.booking_enquiries
  WHERE business_id = v_business_id
    AND status NOT IN ('declined', 'withdrawn');

  IF v_active_biz_count >= 10 THEN
    RAISE EXCEPTION 'Platform Limit Reached: A business account may have at most 10 active enquiries simultaneously.' USING ERRCODE = '23514';
  END IF;

  -- Check 7c: Max 5 enquiries in any 1-hour window (velocity anti-spam)
  SELECT COUNT(*) INTO v_hourly_count
  FROM public.booking_enquiries
  WHERE business_id = v_business_id
    AND created_at > (now() - INTERVAL '1 hour');

  IF v_hourly_count >= 5 THEN
    RAISE EXCEPTION 'Rate Limit Exceeded: Maximum 5 enquiries per hour permitted. Please try again later.' USING ERRCODE = '23514';
  END IF;

  -- 8. Insert enquiry row
  INSERT INTO public.booking_enquiries (
    business_id, artist_id, status, event_date, event_type,
    event_location, requirements, indicative_budget, business_message
  ) VALUES (
    v_business_id, p_artist_id, 'submitted', p_event_date, p_event_type,
    p_event_location, p_requirements, p_indicative_budget, p_business_message
  )
  RETURNING id INTO v_enquiry_id;

  -- 9. Append audit history event
  INSERT INTO public.booking_enquiry_events (
    enquiry_id, actor_id, actor_role, action, notes
  ) VALUES (
    v_enquiry_id, v_business_id, 'business', 'submitted',
    'Enquiry created for event on ' || p_event_date::TEXT || ' (' || p_event_type || ')'
  );

  RETURN v_enquiry_id;
END;
$$;

-- Revoke from public, grant to authenticated
REVOKE EXECUTE ON FUNCTION public.submit_booking_enquiry(UUID, DATE, TEXT, TEXT, TEXT, NUMERIC, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.submit_booking_enquiry(UUID, DATE, TEXT, TEXT, TEXT, NUMERIC, TEXT) FROM anon;
GRANT  EXECUTE ON FUNCTION public.submit_booking_enquiry(UUID, DATE, TEXT, TEXT, TEXT, NUMERIC, TEXT) TO authenticated;

-- ============================================================
-- 7. RPC: public.respond_to_booking_enquiry()
--
-- Security Definer: Authenticated Artist accounts only.
-- Actions:
--   - 'seen': Mark enquiry viewed when expanded (idempotent).
--   - 'interested': Express non-binding interest.
--   - 'decline': Politely decline enquiry (terminal).
--   - 'request_info': Ask business for clarification (requires message >= 5 chars).
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
  v_new_status     TEXT;
  v_trimmed_resp   TEXT;
BEGIN
  -- 1. Session check
  v_artist_id := auth.uid();
  IF v_artist_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  -- 2. Verify artist role
  SELECT role INTO v_artist_role FROM public.profiles WHERE id = v_artist_id;
  IF v_artist_role IS DISTINCT FROM 'artist' THEN
    RAISE EXCEPTION 'Access Denied: Only artists can respond to booking enquiries' USING ERRCODE = '42501';
  END IF;

  -- 3. Lock enquiry row FOR UPDATE
  SELECT status INTO v_current_status
  FROM public.booking_enquiries
  WHERE id = p_enquiry_id AND artist_id = v_artist_id
  FOR UPDATE;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Enquiry Not Found or Access Denied' USING ERRCODE = 'P0002';
  END IF;

  v_trimmed_resp := NULLIF(trim(p_response), '');

  -- 4. State transition rules
  CASE p_action
    WHEN 'seen' THEN
      IF v_current_status NOT IN ('submitted') THEN
        RETURN; -- Idempotent if already seen or progressed
      END IF;
      v_new_status := 'seen';

      UPDATE public.booking_enquiries
      SET status = v_new_status, seen_at = now(), updated_at = now()
      WHERE id = p_enquiry_id AND artist_id = v_artist_id;

      INSERT INTO public.booking_enquiry_events (enquiry_id, actor_id, actor_role, action, notes)
      VALUES (p_enquiry_id, v_artist_id, 'artist', 'seen', 'Enquiry opened and viewed by artist');
      RETURN;

    WHEN 'interested' THEN
      IF v_current_status NOT IN ('submitted', 'seen', 'clarified') THEN
        RAISE EXCEPTION 'Cannot express interest: enquiry is currently in status "%"', v_current_status USING ERRCODE = '23514';
      END IF;
      v_new_status := 'interested';

      UPDATE public.booking_enquiries
      SET status = v_new_status,
          artist_response = COALESCE(v_trimmed_resp, artist_response),
          responded_at = now(),
          seen_at = COALESCE(seen_at, now()),
          updated_at = now()
      WHERE id = p_enquiry_id AND artist_id = v_artist_id;

      INSERT INTO public.booking_enquiry_events (enquiry_id, actor_id, actor_role, action, notes)
      VALUES (p_enquiry_id, v_artist_id, 'artist', 'interested', COALESCE(v_trimmed_resp, 'Artist expressed non-binding interest'));
      RETURN;

    WHEN 'decline' THEN
      IF v_current_status NOT IN ('submitted', 'seen', 'info_requested', 'clarified') THEN
        RAISE EXCEPTION 'Cannot decline enquiry: enquiry is currently in status "%"', v_current_status USING ERRCODE = '23514';
      END IF;
      v_new_status := 'declined';

      UPDATE public.booking_enquiries
      SET status = v_new_status,
          artist_response = COALESCE(v_trimmed_resp, artist_response),
          responded_at = now(),
          seen_at = COALESCE(seen_at, now()),
          updated_at = now()
      WHERE id = p_enquiry_id AND artist_id = v_artist_id;

      INSERT INTO public.booking_enquiry_events (enquiry_id, actor_id, actor_role, action, notes)
      VALUES (p_enquiry_id, v_artist_id, 'artist', 'declined', COALESCE(v_trimmed_resp, 'Artist declined enquiry'));
      RETURN;

    WHEN 'request_info' THEN
      IF v_current_status NOT IN ('submitted', 'seen') THEN
        RAISE EXCEPTION 'Cannot request information: enquiry is currently in status "%"', v_current_status USING ERRCODE = '23514';
      END IF;
      IF v_trimmed_resp IS NULL OR char_length(v_trimmed_resp) < 5 THEN
        RAISE EXCEPTION 'Clarification request requires a descriptive question or note (at least 5 characters)' USING ERRCODE = '23514';
      END IF;
      v_new_status := 'info_requested';

      UPDATE public.booking_enquiries
      SET status = v_new_status,
          artist_response = v_trimmed_resp,
          responded_at = now(),
          seen_at = COALESCE(seen_at, now()),
          updated_at = now()
      WHERE id = p_enquiry_id AND artist_id = v_artist_id;

      INSERT INTO public.booking_enquiry_events (enquiry_id, actor_id, actor_role, action, notes)
      VALUES (p_enquiry_id, v_artist_id, 'artist', 'info_requested', v_trimmed_resp);
      RETURN;

    ELSE
      RAISE EXCEPTION 'Invalid Action: "%". Allowed actions: seen, interested, decline, request_info', p_action USING ERRCODE = '23514';
  END CASE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.respond_to_booking_enquiry(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.respond_to_booking_enquiry(UUID, TEXT, TEXT) FROM anon;
GRANT  EXECUTE ON FUNCTION public.respond_to_booking_enquiry(UUID, TEXT, TEXT) TO authenticated;

-- ============================================================
-- 8. RPC: public.clarify_booking_enquiry()
--
-- Security Definer: Authenticated Business accounts only.
-- Allows the business to provide one structured clarification message
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
  -- 1. Session check
  v_business_id := auth.uid();
  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  -- 2. Verify business role
  SELECT role INTO v_business_role FROM public.profiles WHERE id = v_business_id;
  IF v_business_role IS DISTINCT FROM 'business' THEN
    RAISE EXCEPTION 'Access Denied: Only business accounts can clarify booking enquiries' USING ERRCODE = '42501';
  END IF;

  -- 3. Validate clarification text
  v_trimmed_clar := NULLIF(trim(p_clarification), '');
  IF v_trimmed_clar IS NULL OR char_length(v_trimmed_clar) < 5 THEN
    RAISE EXCEPTION 'Clarification message must be at least 5 characters long' USING ERRCODE = '23514';
  END IF;

  -- 4. Lock enquiry row FOR UPDATE
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

  -- 5. Update enquiry status and store clarification
  UPDATE public.booking_enquiries
  SET status = 'clarified',
      business_clarification = v_trimmed_clar,
      clarified_at = now(),
      updated_at = now()
  WHERE id = p_enquiry_id AND business_id = v_business_id;

  -- 6. Append audit history event
  INSERT INTO public.booking_enquiry_events (
    enquiry_id, actor_id, actor_role, action, notes
  ) VALUES (
    p_enquiry_id, v_business_id, 'business', 'clarified', v_trimmed_clar
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.clarify_booking_enquiry(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.clarify_booking_enquiry(UUID, TEXT) FROM anon;
GRANT  EXECUTE ON FUNCTION public.clarify_booking_enquiry(UUID, TEXT) TO authenticated;

-- ============================================================
-- 9. RPC: public.withdraw_booking_enquiry()
--
-- Security Definer: Authenticated Business accounts only.
-- Allows the business to withdraw an enquiry before conclusion.
-- Allowed from statuses: 'submitted', 'seen', 'info_requested'.
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
  -- 1. Session check
  v_business_id := auth.uid();
  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  -- 2. Verify business role
  SELECT role INTO v_business_role FROM public.profiles WHERE id = v_business_id;
  IF v_business_role IS DISTINCT FROM 'business' THEN
    RAISE EXCEPTION 'Access Denied: Only business accounts can withdraw booking enquiries' USING ERRCODE = '42501';
  END IF;

  -- 3. Lock enquiry row FOR UPDATE
  SELECT status INTO v_current_status
  FROM public.booking_enquiries
  WHERE id = p_enquiry_id AND business_id = v_business_id
  FOR UPDATE;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Enquiry Not Found or Access Denied' USING ERRCODE = 'P0002';
  END IF;

  IF v_current_status NOT IN ('submitted', 'seen', 'info_requested') THEN
    RAISE EXCEPTION 'Enquiry cannot be withdrawn: status is already "%"', v_current_status USING ERRCODE = '23514';
  END IF;

  -- 4. Update status to withdrawn
  UPDATE public.booking_enquiries
  SET status = 'withdrawn', updated_at = now()
  WHERE id = p_enquiry_id AND business_id = v_business_id;

  -- 5. Append audit history event
  INSERT INTO public.booking_enquiry_events (
    enquiry_id, actor_id, actor_role, action, notes
  ) VALUES (
    p_enquiry_id, v_business_id, 'business', 'withdrawn', 'Enquiry withdrawn by business'
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.withdraw_booking_enquiry(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.withdraw_booking_enquiry(UUID) FROM anon;
GRANT  EXECUTE ON FUNCTION public.withdraw_booking_enquiry(UUID) TO authenticated;

COMMIT;

-- ==============================================================================
-- POST-MIGRATION VERIFICATION SCRIPT (RUN AFTER EXECUTING TO CONFIRM CORRECTNESS)
-- ==============================================================================
--
-- 1. Verify tables exist:
--    SELECT table_name FROM information_schema.tables 
--    WHERE table_schema = 'public' AND table_name IN ('booking_enquiries', 'booking_enquiry_events');
--
-- 2. Verify RLS is enabled:
--    SELECT relname, relrowsecurity FROM pg_class 
--    WHERE relname IN ('booking_enquiries', 'booking_enquiry_events');
--
-- 3. Verify RPCs exist:
--    SELECT routine_name FROM information_schema.routines 
--    WHERE routine_schema = 'public' 
--      AND routine_name IN ('submit_booking_enquiry', 'respond_to_booking_enquiry', 'clarify_booking_enquiry', 'withdraw_booking_enquiry');
--
-- ==============================================================================
-- ROLLBACK SCRIPT (IF REVERSAL IS EVER NEEDED)
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
