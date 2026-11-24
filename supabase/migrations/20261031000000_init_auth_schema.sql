-- ==============================================================================
-- THE ARTIST NETWORK - Phase 2 Initial Authentication & Profiles Schema
-- Migration: 20261031_init_auth_schema.sql
-- ==============================================================================

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('artist', 'business', 'admin')),
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for role filtering (useful for public artist discovery)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- 2. Create business_profiles table
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Automatic updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_business_profiles_updated
  BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for profiles
-- Policy A: Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy B: Public can view approved artist profiles for discovery (without exposing private contact details)
CREATE POLICY "Public can view artist profiles for discovery"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (role = 'artist');

-- Policy C: Users can update their own profile (CANNOT elevate role to 'admin')
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- 6. RLS Policies for business_profiles
-- Policy A: Business users can view only their own business profile
CREATE POLICY "Business users can view their own business profile"
  ON public.business_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy B: Business users can insert their own business profile
CREATE POLICY "Business users can insert their own business profile"
  ON public.business_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy C: Business users can update their own business profile
CREATE POLICY "Business users can update their own business profile"
  ON public.business_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 7. Automated trigger on auth.users for safe profile creation
-- SECURITY NOTE: Strictly prevents role escalation. Public registration can ONLY
-- create 'artist' or 'business' accounts, never 'admin'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  assigned_role TEXT;
  user_full_name TEXT;
  user_biz_name TEXT;
  user_contact_name TEXT;
BEGIN
  -- Restrict role: only 'artist' or 'business' permitted from signup metadata
  IF (NEW.raw_user_meta_data->>'role') = 'business' THEN
    assigned_role := 'business';
  ELSE
    assigned_role := 'artist';
  END IF;

  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  user_biz_name := COALESCE(NEW.raw_user_meta_data->>'business_name', '');
  user_contact_name := COALESCE(NEW.raw_user_meta_data->>'contact_name', user_full_name);

  -- Insert profile
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    assigned_role,
    CASE 
      WHEN assigned_role = 'business' AND user_contact_name <> '' THEN user_contact_name
      WHEN user_full_name <> '' THEN user_full_name
      ELSE split_part(NEW.email, '@', 1)
    END
  );

  -- If business, also initialize business_profile
  IF assigned_role = 'business' AND user_biz_name <> '' THEN
    INSERT INTO public.business_profiles (id, business_name, contact_name)
    VALUES (NEW.id, user_biz_name, user_contact_name);
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger execution after signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

