-- ==============================================================================
-- THE ARTIST NETWORK — Phase 6B-1: Business Gigs & Applications Schema
-- File:   supabase/migrations/20261201000000_phase6b1_business_gigs_schema.sql
-- Type:   B. SCHEMA MIGRATION (Additive & Non-Destructive)
-- Target: STAGING (iqlbftywtueoozmfjjgy) FIRST — MANUAL SQL EDITOR EXECUTION
-- Order:  Step 2 of 4 (Run AFTER 01_staging_precheck_readonly.sql passes)
-- ==============================================================================

BEGIN;

-- 1. Extend public.business_profiles with Phase 6B identity & governance columns
--    Note: business_category defaults neutrally to 'general_business' (never 'restaurant').
--    Verification & partner columns default to false / 'unverified' and are protected by triggers & RPCs.
ALTER TABLE public.business_profiles
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS business_category TEXT NOT NULL DEFAULT 'general_business',
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS public_locality TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS partner_opt_in BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_partner BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS partner_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

ALTER TABLE public.business_profiles
  DROP CONSTRAINT IF EXISTS business_profiles_category_check;
ALTER TABLE public.business_profiles
  ADD CONSTRAINT business_profiles_category_check
    CHECK (business_category IN (
      'restaurant',
      'live_music_venue',
      'lounge_bar',
      'cafe',
      'hotel_resort',
      'event_organizer',
      'corporate',
      'general_business',
      'other'
    ));

ALTER TABLE public.business_profiles
  DROP CONSTRAINT IF EXISTS business_profiles_verification_status_check;
ALTER TABLE public.business_profiles
  ADD CONSTRAINT business_profiles_verification_status_check
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected', 'revoked'));

ALTER TABLE public.business_profiles
  DROP CONSTRAINT IF EXISTS business_profiles_account_status_check;
ALTER TABLE public.business_profiles
  ADD CONSTRAINT business_profiles_account_status_check
    CHECK (account_status IN ('active', 'suspended'));

ALTER TABLE public.business_profiles
  DROP CONSTRAINT IF EXISTS business_profiles_description_len_check;
ALTER TABLE public.business_profiles
  ADD CONSTRAINT business_profiles_description_len_check
    CHECK (description IS NULL OR char_length(description) <= 2000);

-- 2. Idempotent non-destructive backfill for existing business accounts missing a business_profiles row
INSERT INTO public.business_profiles (id, business_name, contact_name)
SELECT
  p.id,
  COALESCE(NULLIF(pg_catalog.btrim(p.full_name), ''), 'Business Account'),
  COALESCE(NULLIF(pg_catalog.btrim(p.full_name), ''), 'Primary Contact')
FROM public.profiles AS p
WHERE p.role = 'business'
  AND NOT EXISTS (
    SELECT 1 FROM public.business_profiles AS bp WHERE bp.id = p.id
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Collision-safe slug generator for business_profiles
CREATE OR REPLACE FUNCTION public.generate_business_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_base_slug TEXT;
  v_candidate TEXT;
  v_counter   INTEGER := 0;
BEGIN
  IF NEW.slug IS NULL OR pg_catalog.btrim(NEW.slug) = '' THEN
    v_base_slug := pg_catalog.lower(
      pg_catalog.regexp_replace(
        pg_catalog.regexp_replace(COALESCE(NEW.business_name, 'business'), '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      )
    );
    v_base_slug := pg_catalog.btrim(v_base_slug, '-');
    IF v_base_slug = '' THEN
      v_base_slug := 'business';
    END IF;
    v_candidate := v_base_slug;
    WHILE EXISTS (SELECT 1 FROM public.business_profiles WHERE slug = v_candidate AND id <> NEW.id) LOOP
      v_counter := v_counter + 1;
      v_candidate := v_base_slug || '-' || v_counter::text;
    END LOOP;
    NEW.slug := v_candidate;
  ELSE
    NEW.slug := pg_catalog.lower(
      pg_catalog.regexp_replace(
        pg_catalog.regexp_replace(NEW.slug, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      )
    );
    NEW.slug := pg_catalog.btrim(NEW.slug, '-');
    IF NEW.slug = '' THEN
      NEW.slug := 'business-' || substring(NEW.id::text FROM 1 FOR 8);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.generate_business_slug() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.generate_business_slug() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_business_profile_slug ON public.business_profiles;
CREATE TRIGGER on_business_profile_slug
  BEFORE INSERT OR UPDATE OF business_name, slug ON public.business_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_business_slug();

-- Trigger-backfill missing slugs safely for existing rows
UPDATE public.business_profiles
SET slug = NULL
WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_business_profiles_slug_unique
  ON public.business_profiles (slug)
  WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_business_profiles_account_status
  ON public.business_profiles (account_status);

-- 4. Anti-tampering trigger protecting verification, partner, and suspension fields on business_profiles
CREATE OR REPLACE FUNCTION public.enforce_business_profile_protection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_role TEXT;
  v_caller_uid  UUID := auth.uid();
BEGIN
  IF v_caller_uid IS NOT NULL THEN
    SELECT p.role INTO v_caller_role
    FROM public.profiles AS p
    WHERE p.id = v_caller_uid;
  END IF;

  -- When executed via client/authenticated context other than admin/internal service
  IF v_caller_uid IS NOT NULL AND v_caller_role IS DISTINCT FROM 'admin' THEN
    IF NEW.id <> OLD.id THEN
      RAISE EXCEPTION 'Access Denied: Business ID is immutable.' USING ERRCODE = '42501';
    END IF;

    IF OLD.account_status = 'suspended' THEN
      RAISE EXCEPTION 'Access Denied: Your business account is suspended. Contact support for assistance.' USING ERRCODE = '42501';
    END IF;

    IF NEW.is_verified IS DISTINCT FROM OLD.is_verified
       OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
       OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
       OR NEW.is_partner IS DISTINCT FROM OLD.is_partner
       OR NEW.partner_approved_at IS DISTINCT FROM OLD.partner_approved_at
       OR NEW.account_status IS DISTINCT FROM OLD.account_status
       OR NEW.moderation_notes IS DISTINCT FROM OLD.moderation_notes THEN
      RAISE EXCEPTION 'Access Denied: Verification, partnership, and suspension fields are administrator-managed.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.enforce_business_profile_protection() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.enforce_business_profile_protection() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_business_profile_protection ON public.business_profiles;
CREATE TRIGGER on_business_profile_protection
  BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_business_profile_protection();

-- 5. Safe updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_phase6b_updated_at()
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

ALTER FUNCTION public.set_phase6b_updated_at() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.set_phase6b_updated_at() FROM PUBLIC, anon, authenticated;

-- 6. Table: public.business_gigs (Immediate Publish; Non-Destructive ON DELETE RESTRICT)
CREATE TABLE IF NOT EXISTS public.business_gigs (
  id                   UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id          UUID           NOT NULL REFERENCES public.business_profiles(id) ON DELETE RESTRICT,
  title                TEXT           NOT NULL CHECK (char_length(pg_catalog.btrim(title)) BETWEEN 5 AND 120),
  artist_category      TEXT           NOT NULL CHECK (char_length(pg_catalog.btrim(artist_category)) BETWEEN 2 AND 100),
  description          TEXT           NOT NULL CHECK (char_length(pg_catalog.btrim(description)) BETWEEN 20 AND 3000),
  requirements         TEXT           CHECK (requirements IS NULL OR char_length(requirements) <= 2000),
  event_date           DATE           NOT NULL,
  event_start_time     TIME           NOT NULL,
  event_end_time       TIME,
  city                 TEXT           NOT NULL CHECK (char_length(pg_catalog.btrim(city)) BETWEEN 2 AND 100),
  venue_location       TEXT           NOT NULL CHECK (char_length(pg_catalog.btrim(venue_location)) BETWEEN 2 AND 200),
  compensation_type    TEXT           NOT NULL DEFAULT 'range'
    CHECK (compensation_type IN ('fixed', 'range', 'negotiable')),
  budget_min           NUMERIC(12,2)  CHECK (budget_min IS NULL OR budget_min >= 0),
  budget_max           NUMERIC(12,2)  CHECK (budget_max IS NULL OR budget_max >= 0),
  application_deadline TIMESTAMPTZ    NOT NULL,
  status               TEXT           NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed', 'withdrawn')),
  moderation_status    TEXT           NOT NULL DEFAULT 'active'
    CHECK (moderation_status IN ('active', 'removed')),
  moderation_reason    TEXT           CHECK (moderation_reason IS NULL OR char_length(moderation_reason) <= 1000),
  moderated_by         UUID           REFERENCES public.profiles(id) ON DELETE SET NULL,
  moderated_at         TIMESTAMPTZ,
  published_at         TIMESTAMPTZ    NOT NULL DEFAULT now(),
  created_at           TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ    NOT NULL DEFAULT now(),

  CONSTRAINT chk_business_gig_budget_order
    CHECK (budget_min IS NULL OR budget_max IS NULL OR budget_max >= budget_min),
  CONSTRAINT chk_business_gig_budget_requirements
    CHECK (
      (compensation_type = 'fixed' AND budget_min IS NOT NULL AND budget_min > 0) OR
      (compensation_type = 'range' AND budget_min IS NOT NULL AND budget_max IS NOT NULL AND budget_max >= budget_min AND budget_min > 0) OR
      (compensation_type = 'negotiable')
    )
);

CREATE INDEX IF NOT EXISTS idx_business_gigs_discovery
  ON public.business_gigs (status, moderation_status, application_deadline DESC, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_business_gigs_business
  ON public.business_gigs (business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_business_gigs_category_city
  ON public.business_gigs (artist_category, city);

DROP TRIGGER IF EXISTS trg_business_gigs_updated_at ON public.business_gigs;
CREATE TRIGGER trg_business_gigs_updated_at
  BEFORE UPDATE ON public.business_gigs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_phase6b_updated_at();

-- 7. Table: public.business_gig_applications (Non-Destructive ON DELETE RESTRICT + Duplicate Guard)
CREATE TABLE IF NOT EXISTS public.business_gig_applications (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id            UUID          NOT NULL REFERENCES public.business_gigs(id) ON DELETE RESTRICT,
  artist_id         UUID          NOT NULL REFERENCES public.artist_profiles(id) ON DELETE RESTRICT,
  pitch_message     TEXT          NOT NULL CHECK (char_length(pg_catalog.btrim(pitch_message)) BETWEEN 15 AND 2000),
  proposed_fee      NUMERIC(12,2) CHECK (proposed_fee IS NULL OR proposed_fee >= 0),
  status            TEXT          NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'shortlisted', 'rejected', 'withdrawn')),
  business_feedback TEXT          CHECK (business_feedback IS NULL OR char_length(business_feedback) <= 1000),
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT uq_business_gig_applications_pair UNIQUE (gig_id, artist_id)
);

CREATE INDEX IF NOT EXISTS idx_business_gig_apps_gig
  ON public.business_gig_applications (gig_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_business_gig_apps_artist
  ON public.business_gig_applications (artist_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_business_gig_applications_updated_at ON public.business_gig_applications;
CREATE TRIGGER trg_business_gig_applications_updated_at
  BEFORE UPDATE ON public.business_gig_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_phase6b_updated_at();

-- Fail closed immediately at table creation even before Script 3 policies/grants run
ALTER TABLE public.business_gigs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.business_gigs FROM PUBLIC, anon, authenticated;

ALTER TABLE public.business_gig_applications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.business_gig_applications FROM PUBLIC, anon, authenticated;

COMMIT;
