-- ==============================================================================
-- THE ARTIST NETWORK - Phase 3 Artist Onboarding, Profiles & Portfolio
-- Migration: 20261101_artist_profiles_and_portfolio.sql
-- ==============================================================================

-- 1. Create artist_profiles table
CREATE TABLE IF NOT EXISTS public.artist_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  state TEXT,
  city TEXT NOT NULL,
  bio TEXT,
  experience_years INTEGER DEFAULT 0 CHECK (experience_years >= 0),
  genres TEXT[] DEFAULT '{}',
  specialities TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  performance_types TEXT[] DEFAULT '{}',
  starting_price NUMERIC(10, 2),
  pricing_unit TEXT DEFAULT 'per performance' 
    CHECK (pricing_unit IN ('per hour', 'per performance', 'per event')),
  profile_image_url TEXT,
  cover_image_url TEXT,
  instagram_url TEXT,
  youtube_url TEXT,
  facebook_url TEXT,
  website_url TEXT,
  profile_status TEXT NOT NULL DEFAULT 'draft' 
    CHECK (profile_status IN ('draft', 'pending_review', 'published', 'rejected')),
  rejection_reason TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Performance & discovery indexes
CREATE INDEX IF NOT EXISTS idx_artist_profiles_slug ON public.artist_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_artist_profiles_category ON public.artist_profiles(category);
CREATE INDEX IF NOT EXISTS idx_artist_profiles_city ON public.artist_profiles(city);
CREATE INDEX IF NOT EXISTS idx_artist_profiles_status ON public.artist_profiles(profile_status);

-- 2. Create portfolio_items table
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'youtube', 'audio', 'link')),
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_artist_id ON public.portfolio_items(artist_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_display_order ON public.portfolio_items(display_order);

-- 3. Automatic slug generation trigger
CREATE OR REPLACE FUNCTION public.generate_artist_slug()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  IF NEW.slug IS NULL OR TRIM(NEW.slug) = '' THEN
    base_slug := lower(regexp_replace(regexp_replace(NEW.stage_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
    IF base_slug = '' THEN
      base_slug := 'artist';
    END IF;
    new_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.artist_profiles WHERE slug = new_slug AND id <> NEW.id) LOOP
      counter := counter + 1;
      new_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.slug := new_slug;
  ELSE
    NEW.slug := lower(regexp_replace(regexp_replace(NEW.slug, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_artist_profile_slug ON public.artist_profiles;
CREATE TRIGGER on_artist_profile_slug
  BEFORE INSERT OR UPDATE OF stage_name, slug ON public.artist_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_artist_slug();

-- 4. Database-enforced column protection trigger (Anti-Tampering)
-- Prevents artists from modifying is_verified, rejection_reason,
-- and limits status changes strictly to ('draft', 'pending_review').
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

  -- If not platform administrator, enforce strict invariants:
  IF caller_role IS DISTINCT FROM 'admin' THEN
    -- Invariant 1: Verification flag can NEVER be altered by the artist
    IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
      RAISE EXCEPTION 'Access Denied: Only administrators can grant or revoke verification badges.';
    END IF;

    -- Invariant 2: Rejection reason can NEVER be altered by the artist
    IF NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
      RAISE EXCEPTION 'Access Denied: Rejection notes are administrator-managed.';
    END IF;

    -- Invariant 3: Artist can only transition status to 'draft' or 'pending_review'
    IF NEW.profile_status IS DISTINCT FROM OLD.profile_status THEN
      IF NEW.profile_status NOT IN ('draft', 'pending_review') THEN
        RAISE EXCEPTION 'Access Denied: Artists may only submit profiles as draft or pending_review.';
      END IF;
    END IF;

    -- Invariant 4: ID cannot be altered
    IF NEW.id <> OLD.id THEN
      RAISE EXCEPTION 'Access Denied: Profile ID is immutable.';
    END IF;
  END IF;

  -- Maintain updated_at timestamp
  NEW.updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_artist_profile_protection ON public.artist_profiles;
CREATE TRIGGER on_artist_profile_protection
  BEFORE UPDATE ON public.artist_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_artist_profile_protection();

-- 5. Automatic updated_at trigger for portfolio_items
DROP TRIGGER IF EXISTS on_portfolio_items_updated ON public.portfolio_items;
CREATE TRIGGER on_portfolio_items_updated
  BEFORE UPDATE ON public.portfolio_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.artist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for artist_profiles
-- A. Public discovery: ONLY published profiles can be viewed by anonymous/general users
DROP POLICY IF EXISTS "Public can view published artist profiles" ON public.artist_profiles;
CREATE POLICY "Public can view published artist profiles"
  ON public.artist_profiles
  FOR SELECT
  TO anon, authenticated
  USING (profile_status = 'published');

-- B. Artist owner: Can view their own profile regardless of status (draft, pending_review, rejected)
DROP POLICY IF EXISTS "Artists can view their own profile" ON public.artist_profiles;
CREATE POLICY "Artists can view their own profile"
  ON public.artist_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- C. Artist owner: Can insert their own profile in draft or pending_review with is_verified = false
DROP POLICY IF EXISTS "Artists can insert their own profile" ON public.artist_profiles;
CREATE POLICY "Artists can insert their own profile"
  ON public.artist_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id AND
    profile_status IN ('draft', 'pending_review') AND
    is_verified = false
  );

-- D. Artist owner: Can update their own profile (trigger enforces column protection)
DROP POLICY IF EXISTS "Artists can update their own profile" ON public.artist_profiles;
CREATE POLICY "Artists can update their own profile"
  ON public.artist_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- E. Artist owner: Can delete their own profile
DROP POLICY IF EXISTS "Artists can delete their own profile" ON public.artist_profiles;
CREATE POLICY "Artists can delete their own profile"
  ON public.artist_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- 8. RLS Policies for portfolio_items
-- A. Public: Can view items belonging to published artists
DROP POLICY IF EXISTS "Public can view portfolio items of published artists" ON public.portfolio_items;
CREATE POLICY "Public can view portfolio items of published artists"
  ON public.portfolio_items
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.artist_profiles
      WHERE artist_profiles.id = portfolio_items.artist_id
        AND artist_profiles.profile_status = 'published'
    )
  );

-- B. Owner: Can view their own portfolio items
DROP POLICY IF EXISTS "Artists can view their own portfolio items" ON public.portfolio_items;
CREATE POLICY "Artists can view their own portfolio items"
  ON public.portfolio_items
  FOR SELECT
  TO authenticated
  USING (artist_id = auth.uid());

-- C. Owner: Can insert portfolio items for themselves
DROP POLICY IF EXISTS "Artists can insert their own portfolio items" ON public.portfolio_items;
CREATE POLICY "Artists can insert their own portfolio items"
  ON public.portfolio_items
  FOR INSERT
  TO authenticated
  WITH CHECK (artist_id = auth.uid());

-- D. Owner: Can update their own portfolio items
DROP POLICY IF EXISTS "Artists can update their own portfolio items" ON public.portfolio_items;
CREATE POLICY "Artists can update their own portfolio items"
  ON public.portfolio_items
  FOR UPDATE
  TO authenticated
  USING (artist_id = auth.uid())
  WITH CHECK (artist_id = auth.uid());

-- E. Owner: Can delete their own portfolio items
DROP POLICY IF EXISTS "Artists can delete their own portfolio items" ON public.portfolio_items;
CREATE POLICY "Artists can delete their own portfolio items"
  ON public.portfolio_items
  FOR DELETE
  TO authenticated
  USING (artist_id = auth.uid());

-- 9. Tighten public.profiles policy (Public data separation)
-- Replace broad "Public can view artist profiles" to ensure draft/unapproved profiles are NEVER exposed.
DROP POLICY IF EXISTS "Public can view artist profiles for discovery" ON public.profiles;
DROP POLICY IF EXISTS "Public can view published artist basic profile" ON public.profiles;
CREATE POLICY "Public can view published artist basic profile"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.artist_profiles
      WHERE artist_profiles.id = profiles.id
        AND artist_profiles.profile_status = 'published'
    )
  );

