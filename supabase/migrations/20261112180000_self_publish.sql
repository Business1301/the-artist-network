-- ==============================================================================
-- THE ARTIST NETWORK — Artist Self-Publishing & Verification-Based Ranking
-- Migration: 20261112_self_publish.sql
--
-- IMPORTANT: This migration must be executed MANUALLY by the platform owner
-- in the Supabase Dashboard SQL Editor. It is NOT auto-executed.
--
-- Changes:
--   1. Expands profile_status CHECK to include 'suspended' (keeps legacy values)
--   2. Replaces enforce_artist_profile_protection trigger (total suspension freeze)
--   3. Adds enforce_publication_requirements trigger (DB-level field validation)
--   4. Updates INSERT RLS policy to allow 'published' status
--   5. Updates portfolio_items RLS policies to enforce suspension freeze
--   6. Extends admin_moderate_artist_profile RPC with suspend/reinstate actions
--   7. Expands admin_audit_logs CHECK to include new action values
-- ==============================================================================

-- ============================================================
-- 1. Expand profile_status CHECK constraint
--    Add 'suspended'. Keep 'pending_review' and 'rejected' for
--    backward compatibility with existing rows (NO data migration).
-- ============================================================
ALTER TABLE public.artist_profiles
  DROP CONSTRAINT IF EXISTS artist_profiles_profile_status_check;

ALTER TABLE public.artist_profiles
  ADD CONSTRAINT artist_profiles_profile_status_check
  CHECK (profile_status IN ('draft', 'published', 'suspended', 'pending_review', 'rejected'));


-- ============================================================
-- 2. Replace enforce_artist_profile_protection trigger
--    Key change: Total suspension freeze (Invariant 0)
--    + Artists can now set status to 'published' (Invariant 3)
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_artist_profile_protection()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Determine role of user performing the action
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();

  -- Non-admin enforcement
  IF caller_role IS DISTINCT FROM 'admin' THEN

    -- ██ INVARIANT 0: TOTAL SUSPENSION FREEZE ██
    -- Suspended profiles are COMPLETELY frozen for non-admins.
    -- No content edits, no status changes, no column changes of any kind.
    IF OLD.profile_status = 'suspended' THEN
      RAISE EXCEPTION 'Access Denied: Your profile is suspended. Contact support for assistance.'
        USING ERRCODE = '42501';
    END IF;

    -- Invariant 1: Verification flag can NEVER be altered by non-admins
    IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
      RAISE EXCEPTION 'Access Denied: Only administrators can grant or revoke verification badges.'
        USING ERRCODE = '42501';
    END IF;

    -- Invariant 2: Administrative notes (rejection_reason) can NEVER be altered by non-admins
    IF NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
      RAISE EXCEPTION 'Access Denied: Administrative notes cannot be modified by artists.'
        USING ERRCODE = '42501';
    END IF;

    -- Invariant 3: Artists may only set status to 'draft' or 'published'
    IF NEW.profile_status IS DISTINCT FROM OLD.profile_status THEN
      IF NEW.profile_status NOT IN ('draft', 'published') THEN
        RAISE EXCEPTION 'Access Denied: Artists may only set profiles to draft or published.'
          USING ERRCODE = '42501';
      END IF;
    END IF;

    -- Invariant 4: ID is immutable
    IF NEW.id <> OLD.id THEN
      RAISE EXCEPTION 'Access Denied: Profile ID is immutable.'
        USING ERRCODE = '42501';
    END IF;

  END IF;

  -- Maintain updated_at timestamp
  NEW.updated_at = now();

  RETURN NEW;
END;
$$;

-- Trigger already exists (on_artist_profile_protection) — function replacement is sufficient.
-- Re-create trigger to be safe:
DROP TRIGGER IF EXISTS on_artist_profile_protection ON public.artist_profiles;
CREATE TRIGGER on_artist_profile_protection
  BEFORE UPDATE ON public.artist_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_artist_profile_protection();


-- ============================================================
-- 3. New trigger: enforce_publication_requirements
--    Validates mandatory fields at DB level when publishing.
--    Cannot be bypassed via direct Supabase REST/API calls.
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_publication_requirements()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate mandatory fields ONLY when profile_status is being set to 'published'
  IF NEW.profile_status = 'published' THEN
    -- For INSERT: always validate when inserting as published
    -- For UPDATE: validate only when transitioning INTO published
    IF TG_OP = 'INSERT'
       OR (TG_OP = 'UPDATE' AND OLD.profile_status IS DISTINCT FROM 'published')
    THEN
      -- Rule 1: Stage name required and non-empty
      IF NEW.stage_name IS NULL OR TRIM(NEW.stage_name) = '' THEN
        RAISE EXCEPTION 'Publication requires a stage name.'
          USING ERRCODE = '23514';
      END IF;

      -- Rule 2: Category required and non-empty
      IF NEW.category IS NULL OR TRIM(NEW.category) = '' THEN
        RAISE EXCEPTION 'Publication requires a category.'
          USING ERRCODE = '23514';
      END IF;

      -- Rule 3: City required and non-empty
      IF NEW.city IS NULL OR TRIM(NEW.city) = '' THEN
        RAISE EXCEPTION 'Publication requires a city location.'
          USING ERRCODE = '23514';
      END IF;

      -- Rule 4: Bio required with minimum 30 characters
      IF NEW.bio IS NULL OR LENGTH(TRIM(NEW.bio)) < 30 THEN
        RAISE EXCEPTION 'Publication requires a biography of at least 30 characters.'
          USING ERRCODE = '23514';
      END IF;

      -- Rule 5: Starting price must be set and positive
      IF NEW.starting_price IS NULL OR NEW.starting_price <= 0 THEN
        RAISE EXCEPTION 'Publication requires a starting price greater than zero.'
          USING ERRCODE = '23514';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_artist_publication_validation ON public.artist_profiles;
CREATE TRIGGER on_artist_publication_validation
  BEFORE INSERT OR UPDATE OF profile_status ON public.artist_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_publication_requirements();


-- ============================================================
-- 4. Update INSERT RLS policy on artist_profiles
--    Allow 'published' (validated by trigger above)
-- ============================================================
DROP POLICY IF EXISTS "Artists can insert their own profile" ON public.artist_profiles;
CREATE POLICY "Artists can insert their own profile"
  ON public.artist_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
    AND profile_status IN ('draft', 'published')
    AND is_verified = false
  );


-- ============================================================
-- 5. Portfolio items — suspension freeze via RLS
--    Block INSERT/UPDATE/DELETE when artist is suspended
-- ============================================================

-- 5A. INSERT — block if artist is suspended
DROP POLICY IF EXISTS "Artists can insert their own portfolio items" ON public.portfolio_items;
CREATE POLICY "Artists can insert their own portfolio items"
  ON public.portfolio_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    artist_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM public.artist_profiles
      WHERE id = auth.uid()
        AND profile_status = 'suspended'
    )
  );

-- 5B. UPDATE — block if artist is suspended
DROP POLICY IF EXISTS "Artists can update their own portfolio items" ON public.portfolio_items;
CREATE POLICY "Artists can update their own portfolio items"
  ON public.portfolio_items
  FOR UPDATE
  TO authenticated
  USING (
    artist_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM public.artist_profiles
      WHERE id = auth.uid()
        AND profile_status = 'suspended'
    )
  )
  WITH CHECK (artist_id = auth.uid());

-- 5C. DELETE — block if artist is suspended
DROP POLICY IF EXISTS "Artists can delete their own portfolio items" ON public.portfolio_items;
CREATE POLICY "Artists can delete their own portfolio items"
  ON public.portfolio_items
  FOR DELETE
  TO authenticated
  USING (
    artist_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM public.artist_profiles
      WHERE id = auth.uid()
        AND profile_status = 'suspended'
    )
  );


-- ============================================================
-- 6. Extend admin_moderate_artist_profile RPC
--    Add 'suspend' and 'reinstate' actions.
--    Keep 'approve' and 'reject' for backward compatibility.
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_moderate_artist_profile(
  p_artist_id UUID,
  p_action TEXT,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_admin_email TEXT;
  v_admin_name TEXT;
  v_old_status TEXT;
  v_old_verified BOOLEAN;
  v_old_reason TEXT;
  v_stage_name TEXT;
  v_new_status TEXT;
  v_new_verified BOOLEAN;
  v_new_reason TEXT;
  v_audit_action TEXT;
BEGIN
  -- Step 1: Strict Admin Authorization Gate
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Administrator privileges required.'
      USING ERRCODE = '42501';
  END IF;

  -- Step 2: Fetch and verify administrator identity
  SELECT p.full_name, u.email
  INTO v_admin_name, v_admin_email
  FROM public.profiles AS p
  JOIN auth.users AS u ON u.id = p.id
  WHERE p.id = v_admin_id;

  IF v_admin_email IS NULL OR TRIM(v_admin_email) = ''
     OR v_admin_name IS NULL OR TRIM(v_admin_name) = '' THEN
    RAISE EXCEPTION 'Security Exception: Unable to resolve verified administrator identity for ID %', v_admin_id
      USING ERRCODE = '28000';
  END IF;

  -- Step 3: Row-lock and fetch current artist profile state
  SELECT
    profile_status, is_verified, rejection_reason, stage_name
  INTO
    v_old_status, v_old_verified, v_old_reason, v_stage_name
  FROM public.artist_profiles
  WHERE id = p_artist_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Artist profile not found with ID: %', p_artist_id
      USING ERRCODE = 'P0002';
  END IF;

  -- Step 4: Determine state changes & enforce action invariants
  IF p_action = 'approve' THEN
    -- Legacy action: kept for backward compatibility
    v_new_status := 'published';
    v_new_verified := v_old_verified;
    v_new_reason := NULL;
    v_audit_action := 'approve_profile';

  ELSIF p_action = 'reject' THEN
    -- Legacy action: kept for backward compatibility
    IF p_rejection_reason IS NULL OR TRIM(p_rejection_reason) = '' THEN
      RAISE EXCEPTION 'A specific rejection reason is mandatory when rejecting an application.'
        USING ERRCODE = '23514';
    END IF;
    v_new_status := 'rejected';
    v_new_verified := false;
    v_new_reason := TRIM(p_rejection_reason);
    v_audit_action := 'reject_profile';

  ELSIF p_action = 'suspend' THEN
    -- New action: suspend a profile (any current status except already suspended)
    IF v_old_status = 'suspended' THEN
      RAISE EXCEPTION 'Profile is already suspended.'
        USING ERRCODE = '22023';
    END IF;
    IF p_rejection_reason IS NULL OR TRIM(p_rejection_reason) = '' THEN
      RAISE EXCEPTION 'A specific suspension reason is mandatory.'
        USING ERRCODE = '23514';
    END IF;
    v_new_status := 'suspended';
    v_new_verified := false;
    v_new_reason := TRIM(p_rejection_reason);
    v_audit_action := 'suspend_profile';

  ELSIF p_action = 'reinstate' THEN
    -- New action: reinstate a suspended profile back to published
    IF v_old_status IS DISTINCT FROM 'suspended' THEN
      RAISE EXCEPTION 'Action Denied: Only suspended profiles can be reinstated. Current status is "%".', v_old_status
        USING ERRCODE = '22023';
    END IF;
    v_new_status := 'published';
    v_new_verified := v_old_verified;
    v_new_reason := NULL;
    v_audit_action := 'reinstate_profile';

  ELSIF p_action = 'verify' THEN
    -- Only published artists can be verified
    IF v_old_status IS DISTINCT FROM 'published' THEN
      RAISE EXCEPTION 'Action Denied: Only published artists can be verified. Current status is "%".', v_old_status
        USING ERRCODE = '22023';
    END IF;
    v_new_status := v_old_status;
    v_new_verified := true;
    v_new_reason := v_old_reason;
    v_audit_action := 'verify_artist';

  ELSIF p_action = 'unverify' THEN
    v_new_status := v_old_status;
    v_new_verified := false;
    v_new_reason := v_old_reason;
    v_audit_action := 'unverify_artist';

  ELSE
    RAISE EXCEPTION 'Invalid moderation action: %', p_action
      USING ERRCODE = '22023';
  END IF;

  -- Step 5: Update Artist Profile State
  -- (fires enforce_artist_profile_protection trigger — admin caller passes all checks)
  UPDATE public.artist_profiles
  SET
    profile_status = v_new_status,
    is_verified = v_new_verified,
    rejection_reason = v_new_reason,
    updated_at = now()
  WHERE id = p_artist_id;

  -- Step 6: Insert Atomic Audit Record (rolls back Step 5 if insert fails)
  INSERT INTO public.admin_audit_logs (
    admin_id,
    admin_email,
    admin_name,
    target_artist_id,
    target_stage_name,
    action,
    details
  ) VALUES (
    v_admin_id,
    v_admin_email,
    v_admin_name,
    p_artist_id,
    v_stage_name,
    v_audit_action,
    jsonb_build_object(
      'target_artist_id', p_artist_id,
      'previous_status', v_old_status,
      'new_status', v_new_status,
      'previous_verified', v_old_verified,
      'new_verified', v_new_verified,
      'rejection_reason', v_new_reason
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'artist_id', p_artist_id,
    'action', v_audit_action,
    'profile_status', v_new_status,
    'is_verified', v_new_verified
  );
END;
$$;

ALTER FUNCTION public.admin_moderate_artist_profile(UUID, TEXT, TEXT) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.admin_moderate_artist_profile(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_moderate_artist_profile(UUID, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_moderate_artist_profile(UUID, TEXT, TEXT) TO authenticated;


-- ============================================================
-- 7. Expand admin_audit_logs CHECK constraint
--    Add suspend_profile and reinstate_profile.
--    Keep approve_profile and reject_profile for historical records.
-- ============================================================
ALTER TABLE public.admin_audit_logs
  DROP CONSTRAINT IF EXISTS admin_audit_logs_action_check;

ALTER TABLE public.admin_audit_logs
  ADD CONSTRAINT admin_audit_logs_action_check
  CHECK (action IN (
    'approve_profile',     -- historical (preserved for existing audit records)
    'reject_profile',      -- historical (preserved for existing audit records)
    'suspend_profile',     -- new
    'reinstate_profile',   -- new
    'verify_artist',
    'unverify_artist'
  ));

