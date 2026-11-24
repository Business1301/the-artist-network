-- ==============================================================================
-- THE ARTIST NETWORK — Phase 5.2B: Individual Booking Accounts (Corrected)
-- Migration: 20261125000000_individual_booking.sql
--
-- ⚠️  REVIEW-ONLY — DO NOT EXECUTE ON PRODUCTION WITHOUT OWNER SIGN-OFF
--
-- Tasks Addressed:
--   1. Fix business_id nullability (DROP NOT NULL safely, add requester check constraint)
--   2. Restore shared concurrency protection (tan_enq_biz lock namespace shared between v1 and v2)
--   3. Idempotent backfill of historical Business enquiries (requester_id = business_id, requester_type = 'business')
--   4. Guest count persistence (guest_count INTEGER column, parameter, validation)
--   5. Consistent account deletion and retention policy (ON DELETE CASCADE alignment, non-destructive forward recovery)
--   6. Standardize withdrawal (allow withdrawal after artist interest: submitted, seen, info_requested, clarified, interested)
--   7. Security hardening (explicit role validation, NULL prevention, strict search_path = '', direct client writes revoked)
-- ==============================================================================

BEGIN;

-- ============================================================
-- 1. Add 'individual' role to public.profiles CHECK constraint
-- ============================================================

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('artist', 'business', 'admin', 'individual'));

-- ============================================================
-- 2. Hardened handle_new_user() Trigger Function
--    (SECURITY DEFINER, search_path = '', fully-qualified catalog)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  assigned_role     TEXT;
  user_full_name    TEXT;
  user_biz_name     TEXT;
  user_contact_name TEXT;
BEGIN
  -- Restrict role: only 'artist', 'business', or 'individual' permitted
  -- from signup metadata. Admin role CANNOT be self-assigned.
  IF (NEW.raw_user_meta_data->>'role') = 'business' THEN
    assigned_role := 'business';
  ELSIF (NEW.raw_user_meta_data->>'role') = 'individual' THEN
    assigned_role := 'individual';
  ELSE
    assigned_role := 'artist';
  END IF;

  user_full_name    := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  user_biz_name     := COALESCE(NEW.raw_user_meta_data->>'business_name', '');
  user_contact_name := COALESCE(NEW.raw_user_meta_data->>'contact_name', user_full_name);

  -- Insert profile with validated role
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    assigned_role,
    CASE
      WHEN assigned_role = 'business' AND user_contact_name <> '' THEN user_contact_name
      WHEN user_full_name <> '' THEN user_full_name
      ELSE pg_catalog.split_part(NEW.email, '@', 1)
    END
  );

  -- If business, initialize business_profile
  IF assigned_role = 'business' AND user_biz_name <> '' THEN
    INSERT INTO public.business_profiles (id, business_name, contact_name)
    VALUES (NEW.id, user_biz_name, user_contact_name);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. Schema Adjustments on public.booking_enquiries:
--    - Make business_id NULLABLE (for individual enquiries)
--    - Add requester_id (UUID FK -> profiles ON DELETE CASCADE)
--    - Add requester_type ('business' | 'individual')
--    - Add guest_count (INTEGER, 1 to 100,000)
-- ============================================================

-- Safely make business_id nullable
ALTER TABLE public.booking_enquiries
  ALTER COLUMN business_id DROP NOT NULL;

-- Add new columns
ALTER TABLE public.booking_enquiries
  ADD COLUMN IF NOT EXISTS requester_id UUID
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS requester_type TEXT
    CHECK (requester_type IN ('business', 'individual')),
  ADD COLUMN IF NOT EXISTS guest_count INTEGER
    CHECK (guest_count IS NULL OR (guest_count > 0 AND guest_count <= 100000));

-- ============================================================
-- 4. Idempotent Backfill of Historical Business Enquiries
--    (Must execute BEFORE enforcing column-level NOT NULL constraints)
-- ============================================================

UPDATE public.booking_enquiries
SET requester_id = business_id,
    requester_type = 'business'
WHERE requester_id IS NULL AND business_id IS NOT NULL;

-- ============================================================
-- 5. Strict Requester Integrity Constraints
--    - Enforce NOT NULL at column level (eliminates UNKNOWN evaluation)
--    - Enforce relational integrity constraint:
--      * Business enquiries: business_id IS NOT NULL AND requester_id = business_id
--      * Individual enquiries: business_id IS NULL AND requester_id IS NOT NULL
-- ============================================================

ALTER TABLE public.booking_enquiries
  ALTER COLUMN requester_id SET NOT NULL;

ALTER TABLE public.booking_enquiries
  ALTER COLUMN requester_type SET NOT NULL;

ALTER TABLE public.booking_enquiries
  DROP CONSTRAINT IF EXISTS booking_enquiries_requester_check;

ALTER TABLE public.booking_enquiries
  ADD CONSTRAINT booking_enquiries_requester_check CHECK (
    requester_id IS NOT NULL AND
    requester_type IS NOT NULL AND
    (
      (requester_type = 'business' AND business_id IS NOT NULL AND requester_id = business_id) OR
      (requester_type = 'individual' AND business_id IS NULL)
    )
  );

-- ============================================================
-- 6. BEFORE INSERT Trigger: Backward Compatibility for Legacy RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.populate_legacy_requester()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- If inserted via legacy 7-argument submit_booking_enquiry (v1)
  IF NEW.requester_id IS NULL AND NEW.business_id IS NOT NULL THEN
    NEW.requester_id   := NEW.business_id;
    NEW.requester_type := 'business';
  END IF;

  -- Ensure business enquiries maintain business_id = requester_id
  IF NEW.requester_type = 'business' AND NEW.business_id IS NULL THEN
    NEW.business_id := NEW.requester_id;
  END IF;

  -- Ensure individual enquiries strictly have business_id IS NULL
  IF NEW.requester_type = 'individual' THEN
    NEW.business_id := NULL;
  END IF;

  -- Guard against NULL requester fields before constraint evaluation
  IF NEW.requester_id IS NULL OR NEW.requester_type IS NULL THEN
    RAISE EXCEPTION 'Requester integrity violation: requester_id and requester_type are required' USING ERRCODE = '23502';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.populate_legacy_requester() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.populate_legacy_requester() FROM anon;
REVOKE ALL ON FUNCTION public.populate_legacy_requester() FROM authenticated;

DROP TRIGGER IF EXISTS trg_populate_legacy_requester ON public.booking_enquiries;
CREATE TRIGGER trg_populate_legacy_requester
  BEFORE INSERT ON public.booking_enquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_legacy_requester();

-- ============================================================
-- 7. Add 'individual' to booking_enquiry_events.actor_role
-- ============================================================

ALTER TABLE public.booking_enquiry_events
  DROP CONSTRAINT IF EXISTS booking_enquiry_events_actor_role_check;

ALTER TABLE public.booking_enquiry_events
  ADD CONSTRAINT booking_enquiry_events_actor_role_check
    CHECK (actor_role IN ('business', 'artist', 'admin', 'individual'));

-- ============================================================
-- 8. RPC: submit_booking_enquiry_v2()
--
-- Concurrency Locks (Strict Uniform Order, SHARED with Phase 5.1):
--   1. pg_advisory_xact_lock('tan_enq_biz:' || requester_id)
--   2. pg_advisory_xact_lock('tan_enq_pair:' || requester_id || ':' || artist_id)
-- ============================================================

CREATE OR REPLACE FUNCTION public.submit_booking_enquiry_v2(
  p_artist_id         UUID,
  p_event_date        DATE,
  p_event_type        TEXT,
  p_event_location    TEXT    DEFAULT NULL,
  p_requirements      TEXT    DEFAULT NULL,
  p_indicative_budget NUMERIC DEFAULT NULL,
  p_message           TEXT    DEFAULT NULL,
  p_requester_type    TEXT    DEFAULT 'business',
  p_guest_count       INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_requester_id        UUID;
  v_requester_role      TEXT;
  v_artist_status       TEXT;
  v_min_date            DATE;
  v_active_pair_count   INTEGER;
  v_duplicate_count     INTEGER;
  v_active_req_count    INTEGER;
  v_hourly_count        INTEGER;
  v_enquiry_id          UUID;
  v_trimmed_location    TEXT;
  v_trimmed_reqs        TEXT;
  v_trimmed_msg         TEXT;
  v_safe_requester_type TEXT;
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
  v_requester_id := auth.uid();
  IF v_requester_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to submit a booking enquiry' USING ERRCODE = '42501';
  END IF;

  -- 3. Verify caller role from public.profiles (fail closed, never trust client parameters or metadata)
  SELECT role INTO v_requester_role
  FROM public.profiles
  WHERE id = v_requester_id;

  IF v_requester_role IS NULL OR v_requester_role NOT IN ('business', 'individual') THEN
    RAISE EXCEPTION 'Access Denied: Only registered business or individual accounts can submit booking enquiries' USING ERRCODE = '42501';
  END IF;

  -- 4. Validate requester_type parameter (must strictly match verified DB role)
  IF p_requester_type IS NULL OR p_requester_type NOT IN ('business', 'individual') THEN
    RAISE EXCEPTION 'Invalid Requester Type: Must be business or individual' USING ERRCODE = '23514';
  END IF;

  IF p_requester_type <> v_requester_role THEN
    RAISE EXCEPTION 'Access Denied: Requester type parameter does not match your verified account role' USING ERRCODE = '42501';
  END IF;

  v_safe_requester_type := v_requester_role;

  -- 5. Prevent self-enquiries
  IF v_requester_id = p_artist_id THEN
    RAISE EXCEPTION 'Invalid Target: You cannot submit a booking enquiry to your own account' USING ERRCODE = '23514';
  END IF;

  -- 6. Verify target artist exists and is published
  SELECT profile_status INTO v_artist_status
  FROM public.artist_profiles
  WHERE id = p_artist_id;

  IF v_artist_status IS NULL THEN
    RAISE EXCEPTION 'Artist Not Found: The specified artist profile does not exist' USING ERRCODE = 'P0002';
  END IF;
  IF v_artist_status <> 'published' THEN
    RAISE EXCEPTION 'Artist Unavailable: Enquiries can only be submitted to published artists' USING ERRCODE = '23514';
  END IF;

  -- 7. Validate event date (Must be at least tomorrow in Indian Standard Time)
  v_min_date := (pg_catalog.now() AT TIME ZONE 'Asia/Kolkata')::DATE + INTERVAL '1 day';
  IF p_event_date < v_min_date THEN
    RAISE EXCEPTION 'Invalid Date: Event date must be in the future (at least tomorrow in Indian Standard Time)' USING ERRCODE = '23514';
  END IF;

  IF p_event_date > (pg_catalog.now() AT TIME ZONE 'Asia/Kolkata')::DATE + INTERVAL '730 days' THEN
    RAISE EXCEPTION 'Invalid Date: Event date cannot be more than 2 years in advance' USING ERRCODE = '23514';
  END IF;

  -- 8. Validate event type
  IF p_event_type NOT IN ('wedding', 'corporate', 'restaurant', 'festival', 'private', 'concert', 'other') THEN
    RAISE EXCEPTION 'Invalid Event Type: Must be wedding, corporate, restaurant, festival, private, concert, or other' USING ERRCODE = '23514';
  END IF;

  -- 9. Validate budget if provided
  IF p_indicative_budget IS NOT NULL AND p_indicative_budget < 0 THEN
    RAISE EXCEPTION 'Invalid Budget: Indicative budget cannot be negative' USING ERRCODE = '23514';
  END IF;

  -- 10. Validate guest count if provided
  IF p_guest_count IS NOT NULL AND (p_guest_count <= 0 OR p_guest_count > 100000) THEN
    RAISE EXCEPTION 'Invalid Guest Count: Estimated guests must be between 1 and 100,000' USING ERRCODE = '23514';
  END IF;

  -- 11. Trim string parameters
  v_trimmed_location := NULLIF(pg_catalog.btrim(p_event_location), '');
  v_trimmed_reqs     := NULLIF(pg_catalog.btrim(p_requirements), '');
  v_trimmed_msg      := NULLIF(pg_catalog.btrim(p_message), '');

  IF v_trimmed_location IS NOT NULL AND pg_catalog.char_length(v_trimmed_location) > 255 THEN
    RAISE EXCEPTION 'Location text cannot exceed 255 characters' USING ERRCODE = '23514';
  END IF;

  IF v_trimmed_reqs IS NOT NULL AND pg_catalog.char_length(v_trimmed_reqs) > 2000 THEN
    RAISE EXCEPTION 'Requirements text cannot exceed 2000 characters' USING ERRCODE = '23514';
  END IF;

  IF v_trimmed_msg IS NOT NULL AND pg_catalog.char_length(v_trimmed_msg) > 2000 THEN
    RAISE EXCEPTION 'Message cannot exceed 2000 characters' USING ERRCODE = '23514';
  END IF;

  -- 12. Acquire transaction-level advisory locks in STRICT UNIFORM ORDER
  -- SHARED LOCK KEY: Uses 'tan_enq_biz:' prefix for all requesters, ensuring that
  -- legacy v1 and new v2 calls lock on the EXACT same namespace.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('tan_enq_biz:' || v_requester_id::text)::bigint);
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('tan_enq_pair:' || v_requester_id::text || ':' || p_artist_id::text)::bigint);

  -- 13. Anti-Spam Quota Checks
  -- Check 13a: Max 3 OPEN enquiries per (requester, artist) pair
  -- (Note: 'interested' is non-binding and intentionally excluded from open counts)
  SELECT pg_catalog.count(*) INTO v_active_pair_count
  FROM public.booking_enquiries
  WHERE requester_id = v_requester_id
    AND artist_id    = p_artist_id
    AND status IN ('submitted', 'seen', 'info_requested', 'clarified');

  IF v_active_pair_count >= 3 THEN
    RAISE EXCEPTION 'Active Limit Reached: You have 3 open enquiries with this artist. Please await a response before sending more.' USING ERRCODE = '23514';
  END IF;

  -- Check 13b: Duplicate open enquiry for exact same event date
  SELECT pg_catalog.count(*) INTO v_duplicate_count
  FROM public.booking_enquiries
  WHERE requester_id = v_requester_id
    AND artist_id    = p_artist_id
    AND event_date   = p_event_date
    AND status IN ('submitted', 'seen', 'info_requested', 'clarified');

  IF v_duplicate_count > 0 THEN
    RAISE EXCEPTION 'Duplicate Enquiry: You already have an open enquiry with this artist for %', p_event_date USING ERRCODE = '23514';
  END IF;

  -- Check 13c: Max 10 OPEN enquiries platform-wide per requester
  SELECT pg_catalog.count(*) INTO v_active_req_count
  FROM public.booking_enquiries
  WHERE requester_id = v_requester_id
    AND status IN ('submitted', 'seen', 'info_requested', 'clarified');

  IF v_active_req_count >= 10 THEN
    RAISE EXCEPTION 'Platform Limit Reached: You have 10 open enquiries across all artists. Please wait for responses before sending more.' USING ERRCODE = '23514';
  END IF;

  -- Check 13d: Velocity Rate Limit (Max 5 submissions in last 1 hour)
  SELECT pg_catalog.count(*) INTO v_hourly_count
  FROM public.booking_enquiries
  WHERE requester_id = v_requester_id
    AND created_at   > (pg_catalog.now() - INTERVAL '1 hour');

  IF v_hourly_count >= 5 THEN
    RAISE EXCEPTION 'Rate Limit Exceeded: Maximum 5 enquiries per hour permitted. Please try again later.' USING ERRCODE = '23514';
  END IF;

  -- 14. Insert enquiry record
  INSERT INTO public.booking_enquiries (
    business_id,
    requester_id,
    requester_type,
    artist_id,
    status,
    event_date,
    event_type,
    event_location,
    requirements,
    indicative_budget,
    business_message,
    guest_count
  ) VALUES (
    CASE WHEN v_safe_requester_type = 'business' THEN v_requester_id ELSE NULL END,
    v_requester_id,
    v_safe_requester_type,
    p_artist_id,
    'submitted',
    p_event_date,
    p_event_type,
    v_trimmed_location,
    v_trimmed_reqs,
    p_indicative_budget,
    v_trimmed_msg,
    p_guest_count
  )
  RETURNING id INTO v_enquiry_id;

  -- 15. Append audit history event
  INSERT INTO public.booking_enquiry_events (
    enquiry_id, actor_id, actor_role, action, notes
  ) VALUES (
    v_enquiry_id, v_requester_id, v_safe_requester_type, 'submitted',
    'Enquiry submitted for event on ' || p_event_date::TEXT || ' (' || p_event_type || ')'
  );

  RETURN v_enquiry_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_booking_enquiry_v2(UUID, DATE, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_booking_enquiry_v2(UUID, DATE, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, INTEGER) FROM anon;
GRANT  EXECUTE ON FUNCTION public.submit_booking_enquiry_v2(UUID, DATE, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, INTEGER) TO authenticated;

-- ============================================================
-- 9. RPC: withdraw_booking_enquiry_v2()
--    Permits withdrawal from: submitted, seen, info_requested, clarified, AND interested
-- ============================================================

CREATE OR REPLACE FUNCTION public.withdraw_booking_enquiry_v2(
  p_enquiry_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_requester_id   UUID;
  v_requester_role TEXT;
  v_current_status TEXT;
BEGIN
  IF p_enquiry_id IS NULL THEN
    RAISE EXCEPTION 'Missing Parameter: Enquiry ID is required' USING ERRCODE = '23502';
  END IF;

  v_requester_id := auth.uid();
  IF v_requester_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT role INTO v_requester_role
  FROM public.profiles
  WHERE id = v_requester_id;

  IF v_requester_role IS NULL OR v_requester_role NOT IN ('business', 'individual') THEN
    RAISE EXCEPTION 'Access Denied: Only business or individual accounts can withdraw booking enquiries' USING ERRCODE = '42501';
  END IF;

  SELECT status INTO v_current_status
  FROM public.booking_enquiries
  WHERE id = p_enquiry_id AND requester_id = v_requester_id
  FOR UPDATE;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Enquiry Not Found or Access Denied' USING ERRCODE = 'P0002';
  END IF;

  -- Idempotent if already withdrawn
  IF v_current_status = 'withdrawn' THEN
    RETURN;
  END IF;

  IF v_current_status = 'declined' THEN
    RAISE EXCEPTION 'Enquiry cannot be withdrawn: enquiry was already declined by the artist' USING ERRCODE = '23514';
  END IF;

  -- Permitted from open statuses AND non-binding 'interested' status
  IF v_current_status NOT IN ('submitted', 'seen', 'info_requested', 'clarified', 'interested') THEN
    RAISE EXCEPTION 'Enquiry cannot be withdrawn: status is currently "%"', v_current_status USING ERRCODE = '23514';
  END IF;

  UPDATE public.booking_enquiries
  SET status = 'withdrawn',
      updated_at = pg_catalog.now()
  WHERE id = p_enquiry_id AND requester_id = v_requester_id;

  INSERT INTO public.booking_enquiry_events (
    enquiry_id, actor_id, actor_role, action, notes
  ) VALUES (
    p_enquiry_id, v_requester_id, v_requester_role, 'withdrawn', 'Enquiry withdrawn by requester'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.withdraw_booking_enquiry_v2(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.withdraw_booking_enquiry_v2(UUID) FROM anon;
GRANT  EXECUTE ON FUNCTION public.withdraw_booking_enquiry_v2(UUID) TO authenticated;

-- ============================================================
-- 10. RPC: clarify_booking_enquiry_v2()
-- ============================================================

CREATE OR REPLACE FUNCTION public.clarify_booking_enquiry_v2(
  p_enquiry_id    UUID,
  p_clarification TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_requester_id   UUID;
  v_requester_role TEXT;
  v_current_status TEXT;
  v_trimmed_clar   TEXT;
BEGIN
  IF p_enquiry_id IS NULL THEN
    RAISE EXCEPTION 'Missing Parameter: Enquiry ID is required' USING ERRCODE = '23502';
  END IF;

  v_requester_id := auth.uid();
  IF v_requester_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT role INTO v_requester_role
  FROM public.profiles
  WHERE id = v_requester_id;

  IF v_requester_role IS NULL OR v_requester_role NOT IN ('business', 'individual') THEN
    RAISE EXCEPTION 'Access Denied: Only business or individual accounts can clarify booking enquiries' USING ERRCODE = '42501';
  END IF;

  v_trimmed_clar := NULLIF(pg_catalog.btrim(p_clarification), '');
  IF v_trimmed_clar IS NULL OR pg_catalog.char_length(v_trimmed_clar) < 5 THEN
    RAISE EXCEPTION 'Clarification message must be at least 5 characters long' USING ERRCODE = '23514';
  END IF;
  IF pg_catalog.char_length(v_trimmed_clar) > 2000 THEN
    RAISE EXCEPTION 'Clarification message cannot exceed 2000 characters' USING ERRCODE = '23514';
  END IF;

  SELECT status INTO v_current_status
  FROM public.booking_enquiries
  WHERE id = p_enquiry_id AND requester_id = v_requester_id
  FOR UPDATE;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Enquiry Not Found or Access Denied' USING ERRCODE = 'P0002';
  END IF;

  IF v_current_status <> 'info_requested' THEN
    RAISE EXCEPTION 'Cannot clarify enquiry: status is currently "%" (must be "info_requested")', v_current_status USING ERRCODE = '23514';
  END IF;

  UPDATE public.booking_enquiries
  SET status = 'clarified',
      business_clarification = v_trimmed_clar,
      clarified_at = pg_catalog.now(),
      updated_at = pg_catalog.now()
  WHERE id = p_enquiry_id AND requester_id = v_requester_id;

  INSERT INTO public.booking_enquiry_events (
    enquiry_id, actor_id, actor_role, action, notes
  ) VALUES (
    p_enquiry_id, v_requester_id, v_requester_role, 'clarified', v_trimmed_clar
  );
END;
$$;

REVOKE ALL ON FUNCTION public.clarify_booking_enquiry_v2(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.clarify_booking_enquiry_v2(UUID, TEXT) FROM anon;
GRANT  EXECUTE ON FUNCTION public.clarify_booking_enquiry_v2(UUID, TEXT) TO authenticated;

-- ============================================================
-- 11. RLS Policies for Individual Isolation
-- ============================================================

DROP POLICY IF EXISTS "Individual can view own sent enquiries" ON public.booking_enquiries;
CREATE POLICY "Individual can view own sent enquiries"
  ON public.booking_enquiries
  FOR SELECT
  TO authenticated
  USING (requester_id = auth.uid() AND requester_type = 'individual');

DROP POLICY IF EXISTS "Individual can view own enquiry events" ON public.booking_enquiry_events;
CREATE POLICY "Individual can view own enquiry events"
  ON public.booking_enquiry_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.booking_enquiries e
      WHERE e.id = enquiry_id
        AND e.requester_id = auth.uid()
        AND e.requester_type = 'individual'
    )
  );

-- ============================================================
-- 12. Performance & Quota Lookup Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_booking_enquiries_requester_id
  ON public.booking_enquiries (requester_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_booking_enquiries_requester_type
  ON public.booking_enquiries (requester_type);

-- Partial index for active pair enquiries by requester_id
CREATE INDEX IF NOT EXISTS idx_booking_enquiries_open_pair_requester
  ON public.booking_enquiries (requester_id, artist_id)
  WHERE status IN ('submitted', 'seen', 'info_requested', 'clarified');

-- Partial index for platform-wide open enquiries per requester
CREATE INDEX IF NOT EXISTS idx_booking_enquiries_open_requester
  ON public.booking_enquiries (requester_id)
  WHERE status IN ('submitted', 'seen', 'info_requested', 'clarified');

COMMIT;

-- ==============================================================================
-- POST-MIGRATION VERIFICATION QUERIES (RUN IN SUPABASE SQL EDITOR AFTER EXECUTION)
-- ==============================================================================
--
-- 1. Confirm business_id is nullable:
--    SELECT column_name, is_nullable
--    FROM information_schema.columns
--    WHERE table_schema = 'public' AND table_name = 'booking_enquiries' AND column_name = 'business_id';
--    -- Expected: YES
--
-- 2. Confirm requester columns and guest_count exist:
--    SELECT column_name, data_type, is_nullable
--    FROM information_schema.columns
--    WHERE table_schema = 'public' AND table_name = 'booking_enquiries'
--    AND column_name IN ('requester_id', 'requester_type', 'guest_count');
--
-- 3. Confirm all historical business rows were backfilled:
--    SELECT count(*) AS unbackfilled_count
--    FROM public.booking_enquiries
--    WHERE requester_id IS NULL OR requester_type IS NULL;
--    -- Expected: 0
--
-- 4. Confirm integrity constraint is active:
--    SELECT conname, pg_get_constraintdef(oid)
--    FROM pg_constraint
--    WHERE conrelid = 'public.booking_enquiries'::regclass AND conname = 'booking_enquiries_requester_check';
--
-- 5. Confirm trigger exists:
--    SELECT tgname FROM pg_trigger
--    WHERE tgrelid = 'public.booking_enquiries'::regclass AND tgname = 'trg_populate_legacy_requester';
--
-- 6. Confirm v2 RPCs exist:
--    SELECT proname, prosecdef, proconfig
--    FROM pg_proc
--    WHERE proname IN ('submit_booking_enquiry_v2', 'withdraw_booking_enquiry_v2', 'clarify_booking_enquiry_v2');
--
-- ==============================================================================
-- NON-DESTRUCTIVE FORWARD RECOVERY PROCEDURE (IF DEACTIVATION EVER REQUIRED)
-- ==============================================================================
--
-- DO NOT DROP COLUMNS OR RESTORE THE 3-ROLE CONSTRAINT IF REAL INDIVIDUAL ACCOUNTS EXIST.
-- Dropping columns or shrinking the role check constraint would orphan or delete real user data.
--
-- To safely deactivate Individual bookings without data loss:
-- 1. Revert client UI (disables individual signup tab and booking form).
-- 2. Revoke execute on the v2 submission RPC:
--    REVOKE EXECUTE ON FUNCTION public.submit_booking_enquiry_v2(UUID, DATE, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, INTEGER) FROM authenticated;
-- 3. Legacy Business submissions via submit_booking_enquiry (v1) will continue functioning normally.
-- 4. Existing Individual enquiries remain read-only accessible to their respective owners via RLS.
-- ==============================================================================
