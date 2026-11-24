-- ==============================================================================
-- THE ARTIST NETWORK - Phase 4 Custom Artist Technical Requirements & Terms
-- Migration: 20261112_artist_technical_requirements.sql
-- ==============================================================================

-- Adds customizable technical rider / terms array to artist_profiles
ALTER TABLE public.artist_profiles
ADD COLUMN IF NOT EXISTS technical_requirements TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.artist_profiles.technical_requirements IS 
'Customizable technical rider requirements and performance terms specified by the artist.';

