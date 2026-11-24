-- ==============================================================================
-- THE ARTIST NETWORK - Phase 4.5 Owner-Only Admin System & Atomic Audit Logging
-- Migration: 20261101_admin_system.sql
-- ==============================================================================

-- 1. Hardened Admin Verification Helper Function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  current_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT p.role INTO current_role
  FROM public.profiles AS p
  WHERE p.id = auth.uid();

  RETURN current_role = 'admin';
END;
$$;

ALTER FUNCTION public.is_admin() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 2. Create Immutable Admin Audit Logs Table
-- NOTE: target_artist_id has NO foreign key to profiles or artist_profiles.
-- This ensures audit logs are decoupled from auth.users -> profiles -> artist_profiles cascade deletions.
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  target_artist_id UUID NOT NULL,
  target_stage_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approve_profile', 'reject_profile', 'verify_artist', 'unverify_artist')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Performance & investigation indexes
CREATE INDEX IF NOT EXISTS idx_admin_audit_target ON public.admin_audit_logs(target_artist_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON public.admin_audit_logs(action);

-- Enable Row Level Security on Audit Logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Permissions: Full reset; grant ONLY SELECT to authenticated; all mutations & TRUNCATE revoked
REVOKE ALL ON TABLE public.admin_audit_logs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.admin_audit_logs TO authenticated;

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 3. Atomic Moderation RPC Function
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

  -- Step 2: Fetch and verify administrator identity — ABORT if unresolvable (NO FABRICATED DATA)
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
    v_new_status := 'published';
    v_new_verified := v_old_verified;
    v_new_reason := NULL;
    v_audit_action := 'approve_profile';

  ELSIF p_action = 'reject' THEN
    IF p_rejection_reason IS NULL OR TRIM(p_rejection_reason) = '' THEN
      RAISE EXCEPTION 'A specific rejection reason is mandatory when rejecting an application.'
        USING ERRCODE = '23514';
    END IF;
    v_new_status := 'rejected';
    v_new_verified := false;
    v_new_reason := TRIM(p_rejection_reason);
    v_audit_action := 'reject_profile';

  ELSIF p_action = 'verify' THEN
    -- Invariant: Only published artists can be verified
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

  -- Step 5: Update Artist Profile State (fires enforce_artist_profile_protection trigger)
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

-- 4. Privacy Hardening: Shield artists' real names from public exposure
-- Remove the unnecessary public SELECT policy from public.profiles.
-- Public discovery and profile pages retrieve display information from public.artist_profiles (stage_name).
DROP POLICY IF EXISTS "Public can view published artist basic profile" ON public.profiles;
DROP POLICY IF EXISTS "Public can view artist profiles for discovery" ON public.profiles;

-- 5. Least-Privilege Read Policies for Admins
DROP POLICY IF EXISTS "Admins can view all profiles for moderation" ON public.profiles;
CREATE POLICY "Admins can view all profiles for moderation"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all artist profiles for moderation" ON public.artist_profiles;
CREATE POLICY "Admins can view all artist profiles for moderation"
  ON public.artist_profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all portfolio items for moderation" ON public.portfolio_items;
CREATE POLICY "Admins can view all portfolio items for moderation"
  ON public.portfolio_items
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 6. Role Security & Anti-Tampering Protection on public.profiles
-- Prevents authenticated users from elevating their role to 'admin' or changing account IDs
-- Enforces three layers of defense-in-depth: Column Privileges, Trigger Invariants, and RLS Policy.

-- Layer 1: PostgreSQL Privilege Engine (Table and Column Grant Hardening)
-- Step 1A: Revoke table-level UPDATE from PUBLIC, anon, and authenticated.
-- In PostgreSQL, table-level UPDATE grants override column-level restrictions, so table-level UPDATE MUST be revoked.
REVOKE UPDATE ON TABLE public.profiles FROM PUBLIC, anon, authenticated;

-- Step 1B: Explicitly clear any existing column-level UPDATE privileges on all columns
REVOKE UPDATE (id, role, full_name, created_at, updated_at) ON TABLE public.profiles FROM PUBLIC, anon, authenticated;

-- Step 1C: Grant authenticated users UPDATE privilege ONLY on safe editable column(s)
GRANT UPDATE (full_name) ON TABLE public.profiles TO authenticated;

-- Layer 2: Immutable database trigger invariant (cannot be bypassed by client queries)
CREATE OR REPLACE FUNCTION public.enforce_profile_role_protection()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  -- Invariant A: Prevent account ID mutation under any client session
  IF NEW.id <> OLD.id THEN
    RAISE EXCEPTION 'Access Denied: Account ID is immutable.'
      USING ERRCODE = '42501';
  END IF;

  -- Invariant B: Prevent role mutation under any authenticated client session
  -- Even platform administrators are prohibited from changing roles through standard client APIs
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF auth.uid() IS NOT NULL THEN
      RAISE EXCEPTION 'Access Denied: Account roles cannot be modified via client sessions.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.enforce_profile_role_protection() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.enforce_profile_role_protection() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_profile_role_protection() FROM anon;
GRANT EXECUTE ON FUNCTION public.enforce_profile_role_protection() TO authenticated;

DROP TRIGGER IF EXISTS on_profiles_role_protection ON public.profiles;
CREATE TRIGGER on_profiles_role_protection
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_role_protection();

-- Layer 3: Scoped RLS UPDATE policy on public.profiles
-- Replaces self-referencing subqueries with clean, deterministic ownership validation.
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


