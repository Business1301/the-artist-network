-- ==============================================================================
-- THE ARTIST NETWORK — Phase 6B-1: Least-Privilege Grants, Non-Circular RLS & RPCs
-- File:   supabase/migrations/20261201000100_phase6b1_business_gigs_rls_and_rpcs.sql
-- Type:   C. RLS / SECURITY POLICIES & AUTHORITATIVE RPCS
-- Target: STAGING (iqlbftywtueoozmfjjgy) FIRST — MANUAL SQL EDITOR EXECUTION
-- Order:  Step 3 of 4 (Run AFTER 20261201000000_phase6b1_business_gigs_schema.sql succeeds)
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. Enable RLS & Enforce Strict Least-Privilege Table Grants
--    PUBLIC & anon get 0 grants; authenticated gets strictly SELECT ONLY.
--    Removes DELETE, INSERT, UPDATE, TRUNCATE, TRIGGER, REFERENCES completely.
-- ==============================================================================

ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_gig_applications ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.business_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.business_profiles TO authenticated;

REVOKE ALL ON TABLE public.business_gigs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.business_gigs TO authenticated;

REVOKE ALL ON TABLE public.business_gig_applications FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.business_gig_applications TO authenticated;

-- Remove permissive client-side write policies from business_profiles
DROP POLICY IF EXISTS "Business users can insert their own business profile" ON public.business_profiles;
DROP POLICY IF EXISTS "Business users can update their own business profile" ON public.business_profiles;

-- ==============================================================================
-- 2. Acyclic Security Helper Functions (SET search_path = '')
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT p.role INTO v_role
  FROM public.profiles AS p
  WHERE p.id = auth.uid();

  RETURN v_role;
END;
$$;

ALTER FUNCTION public.current_user_role() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_active_business_account(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  IF auth.uid() IS NULL OR p_business_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Restricted to Artist role evaluation (blocks anon/business/individual UUID probing via PostgREST RPC)
  IF public.current_user_role() IS DISTINCT FROM 'artist' THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.business_profiles AS bp
    WHERE bp.id = p_business_id
      AND bp.account_status = 'active'
  );
END;
$$;

ALTER FUNCTION public.is_active_business_account(UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.is_active_business_account(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_business_account(UUID) TO authenticated;

-- ==============================================================================
-- 3. Non-Circular RLS SELECT Policies (Strict Acyclic DAG)
--    - business_profiles: owner (business) & admin only
--    - business_gigs: zero dependency on business_gig_applications
--    - business_gig_applications: one-way dependency -> business_gigs
-- ==============================================================================

DROP POLICY IF EXISTS "Business users can view their own business profile" ON public.business_profiles;
CREATE POLICY "Business users can view their own business profile"
  ON public.business_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() AND public.current_user_role() = 'business');

DROP POLICY IF EXISTS "Admins can view all business profiles" ON public.business_profiles;
CREATE POLICY "Admins can view all business profiles"
  ON public.business_profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Artists can view open gigs from active businesses" ON public.business_gigs;
CREATE POLICY "Artists can view open gigs from active businesses"
  ON public.business_gigs
  FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() = 'artist'
    AND status = 'open'
    AND moderation_status = 'active'
    AND public.is_active_business_account(business_id)
  );

DROP POLICY IF EXISTS "Businesses can view their own posted gigs" ON public.business_gigs;
CREATE POLICY "Businesses can view their own posted gigs"
  ON public.business_gigs
  FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() = 'business'
    AND business_id = auth.uid()
  );

DROP POLICY IF EXISTS "Admins can view all business gigs" ON public.business_gigs;
CREATE POLICY "Admins can view all business gigs"
  ON public.business_gigs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Artists can view their own gig applications" ON public.business_gig_applications;
CREATE POLICY "Artists can view their own gig applications"
  ON public.business_gig_applications
  FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() = 'artist'
    AND artist_id = auth.uid()
  );

DROP POLICY IF EXISTS "Businesses can view applications for their own gigs" ON public.business_gig_applications;
CREATE POLICY "Businesses can view applications for their own gigs"
  ON public.business_gig_applications
  FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() = 'business'
    AND EXISTS (
      SELECT 1
      FROM public.business_gigs AS g
      WHERE g.id = gig_id
        AND g.business_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all gig applications" ON public.business_gig_applications;
CREATE POLICY "Admins can view all gig applications"
  ON public.business_gig_applications
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ==============================================================================
-- 4. Authoritative SECURITY DEFINER RPCs (Business Gig Posting & Management)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public._validate_business_gig_inputs(
  p_title                TEXT,
  p_artist_category      TEXT,
  p_description          TEXT,
  p_requirements         TEXT,
  p_event_date           DATE,
  p_event_start_time     TIME,
  p_event_end_time       TIME,
  p_city                 TEXT,
  p_venue_location       TEXT,
  p_compensation_type    TEXT,
  p_budget_min           NUMERIC,
  p_budget_max           NUMERIC,
  p_application_deadline TIMESTAMPTZ,
  OUT out_title          TEXT,
  OUT out_category       TEXT,
  OUT out_description    TEXT,
  OUT out_requirements   TEXT,
  OUT out_city           TEXT,
  OUT out_venue          TEXT,
  OUT out_budget_min     NUMERIC,
  OUT out_budget_max     NUMERIC
)
RETURNS RECORD
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_today_ist DATE;
BEGIN
  -- p_event_end_time accepted for symmetry (overnight slots past midnight are permitted)
  out_title        := pg_catalog.btrim(COALESCE(p_title, ''));
  out_category     := pg_catalog.btrim(COALESCE(p_artist_category, ''));
  out_description  := pg_catalog.btrim(COALESCE(p_description, ''));
  out_requirements := NULLIF(pg_catalog.btrim(COALESCE(p_requirements, '')), '');
  out_city         := pg_catalog.btrim(COALESCE(p_city, ''));
  out_venue        := pg_catalog.btrim(COALESCE(p_venue_location, ''));

  IF pg_catalog.char_length(out_title) < 5 OR pg_catalog.char_length(out_title) > 120 THEN
    RAISE EXCEPTION 'Invalid Title: Gig title must be between 5 and 120 characters.' USING ERRCODE = '23514';
  END IF;
  IF pg_catalog.char_length(out_category) < 2 OR pg_catalog.char_length(out_category) > 100 THEN
    RAISE EXCEPTION 'Invalid Category: Artist category is required.' USING ERRCODE = '23514';
  END IF;
  IF pg_catalog.char_length(out_description) < 20 OR pg_catalog.char_length(out_description) > 3000 THEN
    RAISE EXCEPTION 'Invalid Description: Description must be between 20 and 3000 characters.' USING ERRCODE = '23514';
  END IF;
  IF out_requirements IS NOT NULL AND pg_catalog.char_length(out_requirements) > 2000 THEN
    RAISE EXCEPTION 'Invalid Requirements: Requirements cannot exceed 2000 characters.' USING ERRCODE = '23514';
  END IF;
  IF pg_catalog.char_length(out_city) < 2 OR pg_catalog.char_length(out_city) > 100 THEN
    RAISE EXCEPTION 'Invalid City: City is required (2-100 characters).' USING ERRCODE = '23514';
  END IF;
  IF pg_catalog.char_length(out_venue) < 2 OR pg_catalog.char_length(out_venue) > 200 THEN
    RAISE EXCEPTION 'Invalid Venue: Venue or locality is required (2-200 characters).' USING ERRCODE = '23514';
  END IF;

  v_today_ist := (pg_catalog.now() AT TIME ZONE 'Asia/Kolkata')::DATE;
  IF p_event_date IS NULL OR p_event_date < v_today_ist THEN
    RAISE EXCEPTION 'Invalid Event Date: Event date must be today or in the future (IST).' USING ERRCODE = '23514';
  END IF;
  IF p_event_date > v_today_ist + INTERVAL '730 days' THEN
    RAISE EXCEPTION 'Invalid Event Date: Event date cannot exceed 2 years ahead.' USING ERRCODE = '23514';
  END IF;

  IF p_event_start_time IS NULL THEN
    RAISE EXCEPTION 'Missing Start Time: Event start time is required.' USING ERRCODE = '23502';
  END IF;

  IF p_application_deadline IS NULL OR p_application_deadline <= pg_catalog.now() THEN
    RAISE EXCEPTION 'Invalid Deadline: Application deadline must be in the future.' USING ERRCODE = '23514';
  END IF;
  IF (p_application_deadline AT TIME ZONE 'Asia/Kolkata')::DATE > p_event_date THEN
    RAISE EXCEPTION 'Invalid Deadline: Application deadline cannot be after the event date.' USING ERRCODE = '23514';
  END IF;

  IF p_compensation_type NOT IN ('fixed', 'range', 'negotiable') THEN
    RAISE EXCEPTION 'Invalid Compensation Type: Must be fixed, range, or negotiable.' USING ERRCODE = '23514';
  END IF;
  IF (p_budget_min IS NOT NULL AND (p_budget_min < 0 OR p_budget_min > 100000000))
     OR (p_budget_max IS NOT NULL AND (p_budget_max < 0 OR p_budget_max > 100000000)) THEN
    RAISE EXCEPTION 'Invalid Budget: Budget must be a realistic non-negative amount in INR.' USING ERRCODE = '23514';
  END IF;
  IF p_compensation_type = 'fixed' THEN
    IF p_budget_min IS NULL OR p_budget_min <= 0 THEN
      RAISE EXCEPTION 'Invalid Budget: Fixed compensation requires a positive amount in INR.' USING ERRCODE = '23514';
    END IF;
    out_budget_min := p_budget_min;
    out_budget_max := p_budget_min;
  ELSIF p_compensation_type = 'range' THEN
    IF p_budget_min IS NULL OR p_budget_max IS NULL OR p_budget_min <= 0 OR p_budget_max < p_budget_min THEN
      RAISE EXCEPTION 'Invalid Budget Range: Please provide a valid minimum and maximum budget in INR.' USING ERRCODE = '23514';
    END IF;
    out_budget_min := p_budget_min;
    out_budget_max := p_budget_max;
  ELSE
    IF p_budget_max IS NOT NULL AND p_budget_min IS NOT NULL AND p_budget_max < p_budget_min THEN
      RAISE EXCEPTION 'Invalid Budget: Maximum budget must be >= minimum budget.' USING ERRCODE = '23514';
    END IF;
    out_budget_min := p_budget_min;
    out_budget_max := p_budget_max;
  END IF;
END;
$$;

ALTER FUNCTION public._validate_business_gig_inputs(TEXT, TEXT, TEXT, TEXT, DATE, TIME, TIME, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TIMESTAMPTZ) OWNER TO postgres;
REVOKE ALL ON FUNCTION public._validate_business_gig_inputs(TEXT, TEXT, TEXT, TEXT, DATE, TIME, TIME, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_business_gig(
  p_title                TEXT,
  p_artist_category      TEXT,
  p_description          TEXT,
  p_requirements         TEXT,
  p_event_date           DATE,
  p_event_start_time     TIME,
  p_event_end_time       TIME,
  p_city                 TEXT,
  p_venue_location       TEXT,
  p_compensation_type    TEXT,
  p_budget_min           NUMERIC,
  p_budget_max           NUMERIC,
  p_application_deadline TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_biz_id           UUID;
  v_role             TEXT;
  v_account_status   TEXT;
  v_is_verified      BOOLEAN;
  v_full_name        TEXT;
  v_open_count       INTEGER;
  v_hourly_count     INTEGER;
  v_dup_count        INTEGER;
  v_open_cap         INTEGER;
  v_validated        RECORD;
  v_gig_id           UUID;
BEGIN
  v_biz_id := auth.uid();
  IF v_biz_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to post a business gig.' USING ERRCODE = '42501';
  END IF;

  SELECT p.role, p.full_name INTO v_role, v_full_name
  FROM public.profiles AS p
  WHERE p.id = v_biz_id;

  IF v_role IS DISTINCT FROM 'business' THEN
    RAISE EXCEPTION 'Access Denied: Only registered business accounts can post gigs.' USING ERRCODE = '42501';
  END IF;

  -- Ensure business_profiles row exists for legacy business signups; check suspension strictly
  INSERT INTO public.business_profiles (id, business_name, contact_name)
  VALUES (
    v_biz_id,
    COALESCE(NULLIF(pg_catalog.btrim(v_full_name), ''), 'Business Account'),
    COALESCE(NULLIF(pg_catalog.btrim(v_full_name), ''), 'Primary Contact')
  )
  ON CONFLICT (id) DO NOTHING;

  SELECT bp.account_status, bp.is_verified
  INTO v_account_status, v_is_verified
  FROM public.business_profiles AS bp
  WHERE bp.id = v_biz_id;

  IF v_account_status = 'suspended' THEN
    RAISE EXCEPTION 'Access Denied: Your business account is currently suspended. Contact support.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_validated
  FROM public._validate_business_gig_inputs(
    p_title, p_artist_category, p_description, p_requirements,
    p_event_date, p_event_start_time, p_event_end_time,
    p_city, p_venue_location, p_compensation_type, p_budget_min, p_budget_max,
    p_application_deadline
  );

  -- Transaction-scoped advisory lock per business
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('tan_gig_biz:' || v_biz_id::text)::bigint);

  v_open_cap := CASE WHEN COALESCE(v_is_verified, false) THEN 15 ELSE 5 END;

  SELECT COUNT(*) INTO v_open_count
  FROM public.business_gigs
  WHERE business_id = v_biz_id
    AND status = 'open'
    AND moderation_status = 'active';

  IF v_open_count >= v_open_cap THEN
    RAISE EXCEPTION 'Active Gig Limit Reached: You can have at most % open gigs simultaneously.', v_open_cap USING ERRCODE = '23514';
  END IF;

  SELECT COUNT(*) INTO v_hourly_count
  FROM public.business_gigs
  WHERE business_id = v_biz_id
    AND created_at >= pg_catalog.now() - INTERVAL '1 hour';

  IF v_hourly_count >= 5 THEN
    RAISE EXCEPTION 'Rate Limit Exceeded: You can post at most 5 gigs per hour.' USING ERRCODE = '23514';
  END IF;

  SELECT COUNT(*) INTO v_dup_count
  FROM public.business_gigs
  WHERE business_id = v_biz_id
    AND status = 'open'
    AND event_date = p_event_date
    AND pg_catalog.lower(pg_catalog.btrim(title)) = pg_catalog.lower(v_validated.out_title);

  IF v_dup_count > 0 THEN
    RAISE EXCEPTION 'Duplicate Gig: You already have an open gig with this title and event date.' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.business_gigs (
    business_id,
    title,
    artist_category,
    description,
    requirements,
    event_date,
    event_start_time,
    event_end_time,
    city,
    venue_location,
    compensation_type,
    budget_min,
    budget_max,
    application_deadline,
    status,
    moderation_status,
    published_at
  ) VALUES (
    v_biz_id,
    v_validated.out_title,
    v_validated.out_category,
    v_validated.out_description,
    v_validated.out_requirements,
    p_event_date,
    p_event_start_time,
    p_event_end_time,
    v_validated.out_city,
    v_validated.out_venue,
    p_compensation_type,
    v_validated.out_budget_min,
    v_validated.out_budget_max,
    p_application_deadline,
    'open',
    'active',
    pg_catalog.now()
  )
  RETURNING id INTO v_gig_id;

  RETURN v_gig_id;
END;
$$;

ALTER FUNCTION public.create_business_gig(TEXT, TEXT, TEXT, TEXT, DATE, TIME, TIME, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TIMESTAMPTZ) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.create_business_gig(TEXT, TEXT, TEXT, TEXT, DATE, TIME, TIME, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_business_gig(TEXT, TEXT, TEXT, TEXT, DATE, TIME, TIME, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TIMESTAMPTZ) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_business_gig(
  p_gig_id               UUID,
  p_title                TEXT,
  p_artist_category      TEXT,
  p_description          TEXT,
  p_requirements         TEXT,
  p_event_date           DATE,
  p_event_start_time     TIME,
  p_event_end_time       TIME,
  p_city                 TEXT,
  p_venue_location       TEXT,
  p_compensation_type    TEXT,
  p_budget_min           NUMERIC,
  p_budget_max           NUMERIC,
  p_application_deadline TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_biz_id         UUID := auth.uid();
  v_role           TEXT;
  v_account_status TEXT;
  v_existing       RECORD;
  v_validated      RECORD;
  v_dup_count      INTEGER;
BEGIN
  IF v_biz_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;

  SELECT p.role INTO v_role FROM public.profiles AS p WHERE p.id = v_biz_id;
  IF v_role IS DISTINCT FROM 'business' THEN
    RAISE EXCEPTION 'Access Denied: Only business accounts can edit business gigs.' USING ERRCODE = '42501';
  END IF;

  SELECT bp.account_status INTO v_account_status FROM public.business_profiles AS bp WHERE bp.id = v_biz_id;
  IF v_account_status = 'suspended' THEN
    RAISE EXCEPTION 'Access Denied: Your business account is suspended.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_existing
  FROM public.business_gigs
  WHERE id = p_gig_id AND business_id = v_biz_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gig not found or access denied.' USING ERRCODE = 'P0002';
  END IF;
  IF v_existing.moderation_status = 'removed' THEN
    RAISE EXCEPTION 'Cannot edit a gig removed by moderation.' USING ERRCODE = '42501';
  END IF;
  IF v_existing.status = 'withdrawn' THEN
    RAISE EXCEPTION 'Cannot edit a withdrawn gig.' USING ERRCODE = '23514';
  END IF;

  SELECT * INTO v_validated
  FROM public._validate_business_gig_inputs(
    p_title, p_artist_category, p_description, p_requirements,
    p_event_date, p_event_start_time, p_event_end_time,
    p_city, p_venue_location, p_compensation_type, p_budget_min, p_budget_max,
    p_application_deadline
  );

  IF v_existing.status = 'open' THEN
    SELECT COUNT(*) INTO v_dup_count
    FROM public.business_gigs
    WHERE business_id = v_biz_id
      AND id <> p_gig_id
      AND status = 'open'
      AND event_date = p_event_date
      AND pg_catalog.lower(pg_catalog.btrim(title)) = pg_catalog.lower(v_validated.out_title);

    IF v_dup_count > 0 THEN
      RAISE EXCEPTION 'Duplicate Gig: You already have another open gig with this title and event date.' USING ERRCODE = '23505';
    END IF;
  END IF;

  UPDATE public.business_gigs
  SET
    title                = v_validated.out_title,
    artist_category      = v_validated.out_category,
    description          = v_validated.out_description,
    requirements         = v_validated.out_requirements,
    event_date           = p_event_date,
    event_start_time     = p_event_start_time,
    event_end_time       = p_event_end_time,
    city                 = v_validated.out_city,
    venue_location       = v_validated.out_venue,
    compensation_type    = p_compensation_type,
    budget_min           = v_validated.out_budget_min,
    budget_max           = v_validated.out_budget_max,
    application_deadline = p_application_deadline,
    updated_at           = pg_catalog.now()
  WHERE id = p_gig_id AND business_id = v_biz_id;

  RETURN p_gig_id;
END;
$$;

ALTER FUNCTION public.update_business_gig(UUID, TEXT, TEXT, TEXT, TEXT, DATE, TIME, TIME, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TIMESTAMPTZ) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.update_business_gig(UUID, TEXT, TEXT, TEXT, TEXT, DATE, TIME, TIME, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_business_gig(UUID, TEXT, TEXT, TEXT, TEXT, DATE, TIME, TIME, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TIMESTAMPTZ) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_business_gig_status(
  p_gig_id UUID,
  p_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_biz_id         UUID := auth.uid();
  v_role           TEXT;
  v_account_status TEXT;
  v_is_verified    BOOLEAN;
  v_open_cap       INTEGER;
  v_open_count     INTEGER;
  v_existing       RECORD;
BEGIN
  IF v_biz_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;

  SELECT p.role INTO v_role FROM public.profiles AS p WHERE p.id = v_biz_id;
  IF v_role IS DISTINCT FROM 'business' THEN
    RAISE EXCEPTION 'Access Denied: Only business accounts can update gig status.' USING ERRCODE = '42501';
  END IF;

  SELECT bp.account_status, bp.is_verified
  INTO v_account_status, v_is_verified
  FROM public.business_profiles AS bp
  WHERE bp.id = v_biz_id;

  IF v_account_status = 'suspended' THEN
    RAISE EXCEPTION 'Access Denied: Your business account is suspended.' USING ERRCODE = '42501';
  END IF;

  IF p_status NOT IN ('open', 'closed', 'withdrawn') THEN
    RAISE EXCEPTION 'Invalid Status: Must be open, closed, or withdrawn.' USING ERRCODE = '23514';
  END IF;

  IF p_status = 'open' THEN
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('tan_gig_biz:' || v_biz_id::text)::bigint);
  END IF;

  SELECT * INTO v_existing
  FROM public.business_gigs
  WHERE id = p_gig_id AND business_id = v_biz_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gig not found or access denied.' USING ERRCODE = 'P0002';
  END IF;

  IF v_existing.moderation_status = 'removed' THEN
    RAISE EXCEPTION 'Action Denied: This gig was removed by moderation.' USING ERRCODE = '42501';
  END IF;

  IF v_existing.status = 'withdrawn' AND p_status <> 'withdrawn' THEN
    RAISE EXCEPTION 'Withdrawn gigs cannot be reopened.' USING ERRCODE = '23514';
  END IF;

  IF p_status = 'open' AND v_existing.application_deadline <= pg_catalog.now() THEN
    RAISE EXCEPTION 'Update deadline to a future time before reopening this gig.' USING ERRCODE = '23514';
  END IF;

  IF p_status = 'open' AND v_existing.status <> 'open' THEN
    v_open_cap := CASE WHEN COALESCE(v_is_verified, false) THEN 15 ELSE 5 END;
    SELECT COUNT(*) INTO v_open_count
    FROM public.business_gigs
    WHERE business_id = v_biz_id
      AND status = 'open'
      AND moderation_status = 'active';
    IF v_open_count >= v_open_cap THEN
      RAISE EXCEPTION 'Active Gig Limit Reached: You can have at most % open gigs simultaneously.', v_open_cap USING ERRCODE = '23514';
    END IF;
  END IF;

  UPDATE public.business_gigs
  SET status = p_status,
      updated_at = pg_catalog.now()
  WHERE id = p_gig_id AND business_id = v_biz_id;

  RETURN TRUE;
END;
$$;

ALTER FUNCTION public.set_business_gig_status(UUID, TEXT) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.set_business_gig_status(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_business_gig_status(UUID, TEXT) TO authenticated;

-- ==============================================================================
-- 5. Authoritative RPCs: Artist Discovery & Applications (Strict Role Enforcement)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_artist_business_gigs(
  p_category   TEXT DEFAULT NULL,
  p_city       TEXT DEFAULT NULL,
  p_date_from  DATE DEFAULT NULL,
  p_date_to    DATE DEFAULT NULL,
  p_min_budget NUMERIC DEFAULT NULL,
  p_max_budget NUMERIC DEFAULT NULL,
  p_query      TEXT DEFAULT NULL
)
RETURNS TABLE (
  id                     UUID,
  business_id            UUID,
  business_name          TEXT,
  business_verified      BOOLEAN,
  business_category      TEXT,
  title                  TEXT,
  artist_category        TEXT,
  description            TEXT,
  requirements           TEXT,
  event_date             DATE,
  event_start_time       TIME,
  event_end_time         TIME,
  city                   TEXT,
  venue_location         TEXT,
  compensation_type      TEXT,
  budget_min             NUMERIC,
  budget_max             NUMERIC,
  application_deadline   TIMESTAMPTZ,
  published_at           TIMESTAMPTZ,
  my_application_id      UUID,
  my_application_status  TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid  UUID := auth.uid();
  v_role TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required: Please log in as an Artist to see business gigs.' USING ERRCODE = '42501';
  END IF;

  SELECT p.role INTO v_role FROM public.profiles AS p WHERE p.id = v_uid;
  IF v_role IS DISTINCT FROM 'artist' THEN
    RAISE EXCEPTION 'Access Denied: Business Gigs are exclusively accessible to registered Artist accounts.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    g.id,
    g.business_id,
    bp.business_name,
    bp.is_verified AS business_verified,
    bp.business_category,
    g.title,
    g.artist_category,
    g.description,
    g.requirements,
    g.event_date,
    g.event_start_time,
    g.event_end_time,
    g.city,
    g.venue_location,
    g.compensation_type,
    g.budget_min,
    g.budget_max,
    g.application_deadline,
    g.published_at,
    app.id AS my_application_id,
    app.status AS my_application_status
  FROM public.business_gigs AS g
  JOIN public.business_profiles AS bp
    ON bp.id = g.business_id
  LEFT JOIN public.business_gig_applications AS app
    ON app.gig_id = g.id AND app.artist_id = v_uid
  WHERE g.status = 'open'
    AND g.moderation_status = 'active'
    AND bp.account_status = 'active'
    AND g.application_deadline > pg_catalog.now()
    AND (p_category IS NULL OR pg_catalog.btrim(p_category) = '' OR g.artist_category = pg_catalog.btrim(p_category))
    AND (p_city IS NULL OR pg_catalog.btrim(p_city) = '' OR g.city ILIKE '%' || pg_catalog.btrim(p_city) || '%')
    AND (p_date_from IS NULL OR g.event_date >= p_date_from)
    AND (p_date_to IS NULL OR g.event_date <= p_date_to)
    AND (
      p_min_budget IS NULL
      OR g.compensation_type = 'negotiable'
      OR COALESCE(g.budget_max, g.budget_min, 0) >= p_min_budget
    )
    AND (
      p_max_budget IS NULL
      OR g.compensation_type = 'negotiable'
      OR COALESCE(g.budget_min, 0) <= p_max_budget
    )
    AND (
      p_query IS NULL
      OR pg_catalog.btrim(p_query) = ''
      OR g.title ILIKE '%' || pg_catalog.btrim(p_query) || '%'
      OR g.description ILIKE '%' || pg_catalog.btrim(p_query) || '%'
      OR g.venue_location ILIKE '%' || pg_catalog.btrim(p_query) || '%'
      OR bp.business_name ILIKE '%' || pg_catalog.btrim(p_query) || '%'
    )
  ORDER BY g.published_at DESC;
END;
$$;

ALTER FUNCTION public.get_artist_business_gigs(TEXT, TEXT, DATE, DATE, NUMERIC, NUMERIC, TEXT) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_artist_business_gigs(TEXT, TEXT, DATE, DATE, NUMERIC, NUMERIC, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_artist_business_gigs(TEXT, TEXT, DATE, DATE, NUMERIC, NUMERIC, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_artist_business_gig_detail(p_gig_id UUID)
RETURNS TABLE (
  id                     UUID,
  business_id            UUID,
  business_name          TEXT,
  business_verified      BOOLEAN,
  business_category      TEXT,
  business_active        BOOLEAN,
  title                  TEXT,
  artist_category        TEXT,
  description            TEXT,
  requirements           TEXT,
  event_date             DATE,
  event_start_time       TIME,
  event_end_time         TIME,
  city                   TEXT,
  venue_location         TEXT,
  compensation_type      TEXT,
  budget_min             NUMERIC,
  budget_max             NUMERIC,
  application_deadline   TIMESTAMPTZ,
  status                 TEXT,
  published_at           TIMESTAMPTZ,
  my_application_id      UUID,
  my_application_status  TEXT,
  my_pitch_message       TEXT,
  my_proposed_fee        NUMERIC,
  my_business_feedback   TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid  UUID := auth.uid();
  v_role TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required: Please log in as an Artist to see business gigs.' USING ERRCODE = '42501';
  END IF;

  SELECT p.role INTO v_role FROM public.profiles AS p WHERE p.id = v_uid;
  IF v_role IS DISTINCT FROM 'artist' THEN
    RAISE EXCEPTION 'Access Denied: Business Gigs are exclusively accessible to registered Artist accounts.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    g.id,
    g.business_id,
    bp.business_name,
    bp.is_verified AS business_verified,
    bp.business_category,
    (bp.account_status = 'active') AS business_active,
    g.title,
    g.artist_category,
    g.description,
    g.requirements,
    g.event_date,
    g.event_start_time,
    g.event_end_time,
    g.city,
    g.venue_location,
    g.compensation_type,
    g.budget_min,
    g.budget_max,
    g.application_deadline,
    g.status,
    g.published_at,
    app.id AS my_application_id,
    app.status AS my_application_status,
    app.pitch_message AS my_pitch_message,
    app.proposed_fee AS my_proposed_fee,
    app.business_feedback AS my_business_feedback
  FROM public.business_gigs AS g
  JOIN public.business_profiles AS bp
    ON bp.id = g.business_id
  LEFT JOIN public.business_gig_applications AS app
    ON app.gig_id = g.id AND app.artist_id = v_uid
  WHERE g.id = p_gig_id
    AND g.moderation_status = 'active'
    AND (
      (g.status = 'open' AND bp.account_status = 'active')
      OR app.id IS NOT NULL
    );
END;
$$;

ALTER FUNCTION public.get_artist_business_gig_detail(UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_artist_business_gig_detail(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_artist_business_gig_detail(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_gig_application(
  p_gig_id        UUID,
  p_pitch_message TEXT,
  p_proposed_fee  NUMERIC DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_artist_id       UUID := auth.uid();
  v_role            TEXT;
  v_profile_status  TEXT;
  v_gig             RECORD;
  v_biz_status      TEXT;
  v_trimmed_pitch   TEXT;
  v_active_count    INTEGER;
  v_hourly_count    INTEGER;
  v_app_id          UUID;
BEGIN
  IF v_artist_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to apply for a gig.' USING ERRCODE = '42501';
  END IF;

  SELECT p.role INTO v_role FROM public.profiles AS p WHERE p.id = v_artist_id;
  IF v_role IS DISTINCT FROM 'artist' THEN
    RAISE EXCEPTION 'Access Denied: Only Artist accounts can apply to Business Gigs.' USING ERRCODE = '42501';
  END IF;

  SELECT ap.profile_status INTO v_profile_status
  FROM public.artist_profiles AS ap
  WHERE ap.id = v_artist_id;

  IF v_profile_status IS NULL OR v_profile_status IN ('draft', 'rejected') THEN
    RAISE EXCEPTION 'Profile Incomplete: Complete and publish your Artist Profile before applying to gigs.' USING ERRCODE = '23514';
  END IF;
  IF v_profile_status = 'suspended' THEN
    RAISE EXCEPTION 'Account Suspended: Suspended artist profiles cannot apply for gigs.' USING ERRCODE = '42501';
  END IF;
  IF v_profile_status <> 'published' THEN
    RAISE EXCEPTION 'Profile Unavailable: Your artist profile must be published to submit applications.' USING ERRCODE = '23514';
  END IF;

  v_trimmed_pitch := pg_catalog.btrim(COALESCE(p_pitch_message, ''));
  IF pg_catalog.char_length(v_trimmed_pitch) < 15 OR pg_catalog.char_length(v_trimmed_pitch) > 2000 THEN
    RAISE EXCEPTION 'Invalid Pitch: Application message must be between 15 and 2000 characters.' USING ERRCODE = '23514';
  END IF;

  IF p_proposed_fee IS NOT NULL AND (p_proposed_fee < 0 OR p_proposed_fee > 100000000) THEN
    RAISE EXCEPTION 'Invalid Proposed Fee: Proposed fee must be a realistic non-negative amount in INR.' USING ERRCODE = '23514';
  END IF;

  -- Strictly ordered transaction advisory locks
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('tan_gig_app_artist:' || v_artist_id::text)::bigint);
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('tan_gig_app_pair:' || p_gig_id::text || ':' || v_artist_id::text)::bigint);

  SELECT g.* INTO v_gig
  FROM public.business_gigs AS g
  WHERE g.id = p_gig_id
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gig Not Found: The specified business gig does not exist.' USING ERRCODE = 'P0002';
  END IF;

  SELECT bp.account_status INTO v_biz_status
  FROM public.business_profiles AS bp
  WHERE bp.id = v_gig.business_id;

  IF v_biz_status = 'suspended' OR v_gig.moderation_status <> 'active' THEN
    RAISE EXCEPTION 'Gig Unavailable: This business opportunity is currently unavailable.' USING ERRCODE = '23514';
  END IF;

  IF v_gig.business_id = v_artist_id THEN
    RAISE EXCEPTION 'Invalid Target: Cannot apply to your own gig.' USING ERRCODE = '23514';
  END IF;

  IF v_gig.status <> 'open' THEN
    RAISE EXCEPTION 'Gig Closed: This gig is no longer accepting applications.' USING ERRCODE = '23514';
  END IF;

  IF v_gig.application_deadline <= pg_catalog.now() THEN
    RAISE EXCEPTION 'Deadline Passed: The application deadline for this gig has expired.' USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.business_gig_applications
    WHERE gig_id = p_gig_id AND artist_id = v_artist_id
  ) THEN
    RAISE EXCEPTION 'Duplicate Application: You have already applied to this gig.' USING ERRCODE = '23505';
  END IF;

  SELECT COUNT(*) INTO v_active_count
  FROM public.business_gig_applications
  WHERE artist_id = v_artist_id AND status IN ('submitted', 'shortlisted');

  IF v_active_count >= 25 THEN
    RAISE EXCEPTION 'Application Limit Reached: Maximum 25 active applications allowed at once.' USING ERRCODE = '23514';
  END IF;

  SELECT COUNT(*) INTO v_hourly_count
  FROM public.business_gig_applications
  WHERE artist_id = v_artist_id AND created_at >= pg_catalog.now() - INTERVAL '1 hour';

  IF v_hourly_count >= 10 THEN
    RAISE EXCEPTION 'Rate Limit Exceeded: You can submit at most 10 gig applications per hour.' USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.business_gig_applications (
    gig_id,
    artist_id,
    pitch_message,
    proposed_fee,
    status
  ) VALUES (
    p_gig_id,
    v_artist_id,
    v_trimmed_pitch,
    p_proposed_fee,
    'submitted'
  )
  RETURNING id INTO v_app_id;

  RETURN v_app_id;
END;
$$;

ALTER FUNCTION public.submit_gig_application(UUID, TEXT, NUMERIC) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.submit_gig_application(UUID, TEXT, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_gig_application(UUID, TEXT, NUMERIC) TO authenticated;

CREATE OR REPLACE FUNCTION public.withdraw_gig_application(p_application_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_artist_id UUID := auth.uid();
  v_role      TEXT;
  v_app       RECORD;
BEGIN
  IF v_artist_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;

  SELECT p.role INTO v_role FROM public.profiles AS p WHERE p.id = v_artist_id;
  IF v_role IS DISTINCT FROM 'artist' THEN
    RAISE EXCEPTION 'Access Denied: Only artists can withdraw gig applications.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_app
  FROM public.business_gig_applications
  WHERE id = p_application_id AND artist_id = v_artist_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found or access denied.' USING ERRCODE = 'P0002';
  END IF;

  IF v_app.status = 'withdrawn' THEN
    RETURN TRUE;
  END IF;

  IF v_app.status = 'rejected' THEN
    RAISE EXCEPTION 'Cannot withdraw an application that has already been rejected.' USING ERRCODE = '23514';
  END IF;

  UPDATE public.business_gig_applications
  SET status = 'withdrawn',
      updated_at = pg_catalog.now()
  WHERE id = p_application_id AND artist_id = v_artist_id;

  RETURN TRUE;
END;
$$;

ALTER FUNCTION public.withdraw_gig_application(UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.withdraw_gig_application(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.withdraw_gig_application(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_artist_gig_applications()
RETURNS TABLE (
  application_id        UUID,
  gig_id                UUID,
  gig_title             TEXT,
  artist_category       TEXT,
  event_date            DATE,
  event_start_time      TIME,
  event_end_time        TIME,
  city                  TEXT,
  venue_location        TEXT,
  compensation_type     TEXT,
  budget_min            NUMERIC,
  budget_max            NUMERIC,
  application_deadline  TIMESTAMPTZ,
  gig_status            TEXT,
  gig_moderation_status TEXT,
  business_name         TEXT,
  business_verified     BOOLEAN,
  business_suspended    BOOLEAN,
  pitch_message         TEXT,
  proposed_fee          NUMERIC,
  application_status    TEXT,
  business_feedback     TEXT,
  reviewed_at           TIMESTAMPTZ,
  applied_at            TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_artist_id UUID := auth.uid();
  v_role      TEXT;
BEGIN
  IF v_artist_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;

  SELECT p.role INTO v_role FROM public.profiles AS p WHERE p.id = v_artist_id;
  IF v_role IS DISTINCT FROM 'artist' THEN
    RAISE EXCEPTION 'Access Denied: Only artist accounts can view their gig applications.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    app.id AS application_id,
    g.id AS gig_id,
    CASE WHEN g.moderation_status = 'removed' THEN 'Removed Business Listing' ELSE g.title END AS gig_title,
    g.artist_category,
    g.event_date,
    g.event_start_time,
    g.event_end_time,
    g.city,
    CASE WHEN g.moderation_status = 'removed' THEN '' ELSE g.venue_location END AS venue_location,
    g.compensation_type,
    g.budget_min,
    g.budget_max,
    g.application_deadline,
    g.status AS gig_status,
    g.moderation_status AS gig_moderation_status,
    bp.business_name,
    bp.is_verified AS business_verified,
    (bp.account_status = 'suspended') AS business_suspended,
    app.pitch_message,
    app.proposed_fee,
    app.status AS application_status,
    app.business_feedback,
    app.reviewed_at,
    app.created_at AS applied_at
  FROM public.business_gig_applications AS app
  JOIN public.business_gigs AS g
    ON g.id = app.gig_id
  JOIN public.business_profiles AS bp
    ON bp.id = g.business_id
  WHERE app.artist_id = v_artist_id
  ORDER BY app.created_at DESC;
END;
$$;

ALTER FUNCTION public.get_artist_gig_applications() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_artist_gig_applications() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_artist_gig_applications() TO authenticated;

CREATE OR REPLACE FUNCTION public.review_gig_application(
  p_application_id UUID,
  p_decision       TEXT,
  p_feedback       TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_biz_id         UUID := auth.uid();
  v_role           TEXT;
  v_account_status TEXT;
  v_app            RECORD;
  v_trimmed_fb     TEXT;
BEGIN
  IF v_biz_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;

  SELECT p.role INTO v_role FROM public.profiles AS p WHERE p.id = v_biz_id;
  IF v_role IS DISTINCT FROM 'business' THEN
    RAISE EXCEPTION 'Access Denied: Only business accounts can review gig applicants.' USING ERRCODE = '42501';
  END IF;

  SELECT bp.account_status INTO v_account_status FROM public.business_profiles AS bp WHERE bp.id = v_biz_id;
  IF v_account_status = 'suspended' THEN
    RAISE EXCEPTION 'Access Denied: Suspended businesses cannot review applications.' USING ERRCODE = '42501';
  END IF;

  IF p_decision NOT IN ('shortlisted', 'rejected') THEN
    RAISE EXCEPTION 'Invalid Decision: Must be shortlisted or rejected.' USING ERRCODE = '23514';
  END IF;

  v_trimmed_fb := NULLIF(pg_catalog.btrim(COALESCE(p_feedback, '')), '');
  IF v_trimmed_fb IS NOT NULL AND pg_catalog.char_length(v_trimmed_fb) > 1000 THEN
    RAISE EXCEPTION 'Feedback cannot exceed 1000 characters.' USING ERRCODE = '23514';
  END IF;

  SELECT app.*, g.business_id
  INTO v_app
  FROM public.business_gig_applications AS app
  JOIN public.business_gigs AS g ON g.id = app.gig_id
  WHERE app.id = p_application_id
  FOR UPDATE;

  IF NOT FOUND OR v_app.business_id <> v_biz_id THEN
    RAISE EXCEPTION 'Application not found or access denied.' USING ERRCODE = 'P0002';
  END IF;

  IF v_app.status = 'withdrawn' THEN
    RAISE EXCEPTION 'Cannot update an application that the artist already withdrew.' USING ERRCODE = '23514';
  END IF;

  UPDATE public.business_gig_applications
  SET status = p_decision,
      business_feedback = COALESCE(v_trimmed_fb, business_feedback),
      reviewed_at = pg_catalog.now(),
      updated_at = pg_catalog.now()
  WHERE id = p_application_id;

  RETURN TRUE;
END;
$$;

ALTER FUNCTION public.review_gig_application(UUID, TEXT, TEXT) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.review_gig_application(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_gig_application(UUID, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_business_gig_applicants(p_gig_id UUID)
RETURNS TABLE (
  application_id    UUID,
  gig_id            UUID,
  artist_id         UUID,
  stage_name        TEXT,
  artist_slug       TEXT,
  artist_category   TEXT,
  artist_city       TEXT,
  profile_image_url TEXT,
  artist_verified   BOOLEAN,
  profile_status    TEXT,
  pitch_message     TEXT,
  proposed_fee      NUMERIC,
  status            TEXT,
  business_feedback TEXT,
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_biz_id UUID := auth.uid();
  v_role   TEXT;
BEGIN
  IF v_biz_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;

  SELECT p.role INTO v_role FROM public.profiles AS p WHERE p.id = v_biz_id;
  IF v_role IS DISTINCT FROM 'business' THEN
    RAISE EXCEPTION 'Access Denied: Only the posting business can view gig applicants.' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.business_gigs AS g WHERE g.id = p_gig_id AND g.business_id = v_biz_id
  ) THEN
    RAISE EXCEPTION 'Gig not found or access denied.' USING ERRCODE = 'P0002';
  END IF;

  RETURN QUERY
  SELECT
    app.id AS application_id,
    app.gig_id,
    app.artist_id,
    ap.stage_name,
    ap.slug AS artist_slug,
    ap.category AS artist_category,
    ap.city AS artist_city,
    ap.profile_image_url,
    ap.is_verified AS artist_verified,
    ap.profile_status,
    app.pitch_message,
    app.proposed_fee,
    app.status,
    app.business_feedback,
    app.reviewed_at,
    app.created_at
  FROM public.business_gig_applications AS app
  JOIN public.artist_profiles AS ap
    ON ap.id = app.artist_id
  WHERE app.gig_id = p_gig_id
  ORDER BY
    CASE app.status WHEN 'shortlisted' THEN 1 WHEN 'submitted' THEN 2 WHEN 'rejected' THEN 3 ELSE 4 END,
    app.created_at DESC;
END;
$$;

ALTER FUNCTION public.get_business_gig_applicants(UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_business_gig_applicants(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_business_gig_applicants(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_business_posted_gigs()
RETURNS TABLE (
  id                   UUID,
  business_id          UUID,
  business_name        TEXT,
  business_verified    BOOLEAN,
  business_suspended   BOOLEAN,
  title                TEXT,
  artist_category      TEXT,
  description          TEXT,
  requirements         TEXT,
  event_date           DATE,
  event_start_time     TIME,
  event_end_time       TIME,
  city                 TEXT,
  venue_location       TEXT,
  compensation_type    TEXT,
  budget_min           NUMERIC,
  budget_max           NUMERIC,
  application_deadline TIMESTAMPTZ,
  status               TEXT,
  moderation_status    TEXT,
  moderation_reason    TEXT,
  published_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ,
  updated_at           TIMESTAMPTZ,
  total_applicants     INTEGER,
  shortlisted_count    INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_biz_id UUID := auth.uid();
  v_role   TEXT;
BEGIN
  IF v_biz_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;

  SELECT p.role INTO v_role FROM public.profiles AS p WHERE p.id = v_biz_id;
  IF v_role IS DISTINCT FROM 'business' THEN
    RAISE EXCEPTION 'Access Denied: Only business accounts can view posted business gigs.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    g.id,
    g.business_id,
    COALESCE(NULLIF(pg_catalog.btrim(bp.business_name), ''), 'Business Account') AS business_name,
    COALESCE(bp.is_verified, false) AS business_verified,
    COALESCE(bp.account_status = 'suspended', false) AS business_suspended,
    g.title,
    g.artist_category,
    g.description,
    g.requirements,
    g.event_date,
    g.event_start_time,
    g.event_end_time,
    g.city,
    g.venue_location,
    g.compensation_type,
    g.budget_min,
    g.budget_max,
    g.application_deadline,
    g.status,
    g.moderation_status,
    g.moderation_reason,
    g.published_at,
    g.created_at,
    g.updated_at,
    COUNT(a.id)::INTEGER AS total_applicants,
    COUNT(a.id) FILTER (WHERE a.status = 'shortlisted')::INTEGER AS shortlisted_count
  FROM public.business_gigs AS g
  LEFT JOIN public.business_profiles AS bp ON bp.id = g.business_id
  LEFT JOIN public.business_gig_applications AS a ON a.gig_id = g.id
  WHERE g.business_id = v_biz_id
  GROUP BY
    g.id,
    bp.business_name,
    bp.is_verified,
    bp.account_status
  ORDER BY
    CASE WHEN g.status = 'open' THEN 0 WHEN g.status = 'closed' THEN 1 ELSE 2 END,
    g.created_at DESC;
END;
$$;

ALTER FUNCTION public.get_business_posted_gigs() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_business_posted_gigs() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_business_posted_gigs() TO authenticated;

COMMIT;
