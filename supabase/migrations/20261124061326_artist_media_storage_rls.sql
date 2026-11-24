-- ==============================================================================
-- THE ARTIST NETWORK — Supabase Storage RLS Migration
-- File:       supabase/migrations/artist_media_storage_rls.sql
-- Bucket:     artist-media (Public bucket for profile, cover & portfolio images)
-- Target:     storage.objects
-- Security:   Authoritative role validation against public.profiles.role = 'artist'
--             Strict own-folder isolation: (storage.foldername(name))[1] = auth.uid()::text
-- Author:     The Artist Network Security & Platform Team
-- Status:     FINAL REVIEWED VERSION — PENDING OWNER MANUAL EXECUTION
-- ==============================================================================
--
-- ATOMIC TRANSACTION:
--   Read-only inventory confirmed zero prior artist_* or public_read policies exist.
--   Unnecessary DROP statements removed.
--   Enclosed in BEGIN ... COMMIT for atomic execution.
--
-- POLICIES INCLUDED:
--   1. INSERT : Authenticated artists uploading into their own folder.
--   2. UPDATE : Authenticated artists modifying/overwriting their own files (upsert support).
--   3. SELECT : Authenticated artists inspecting/listing their own folder metadata.
--
-- POLICIES EXCLUDED (Least Privilege):
--   - NO DELETE policy: Client code never deletes Storage objects directly.
--   - NO public SELECT policy: Public image serving uses bucket CDN (/storage/v1/object/public/...)
--     and does not permit directory enumeration on storage.objects.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. INSERT Policy: Authenticated Artists uploading into their own folder
-- ------------------------------------------------------------------------------
CREATE POLICY "artist_upload_own_folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'artist-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE public.profiles.id = auth.uid()
      AND public.profiles.role = 'artist'
  )
);

-- ------------------------------------------------------------------------------
-- 2. UPDATE Policy: Authenticated Artists modifying their own files
-- ------------------------------------------------------------------------------
CREATE POLICY "artist_update_own_files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'artist-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE public.profiles.id = auth.uid()
      AND public.profiles.role = 'artist'
  )
)
WITH CHECK (
  bucket_id = 'artist-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE public.profiles.id = auth.uid()
      AND public.profiles.role = 'artist'
  )
);

-- ------------------------------------------------------------------------------
-- 3. SELECT Policy: Authenticated Artists reading their own folder metadata
-- ------------------------------------------------------------------------------
CREATE POLICY "artist_select_own_files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'artist-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE public.profiles.id = auth.uid()
      AND public.profiles.role = 'artist'
  )
);

COMMIT;

-- ==============================================================================
-- POST-EXECUTION VERIFICATION QUERY:
-- ==============================================================================
-- SELECT policyname, cmd, roles, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'objects' AND schemaname = 'storage'
--   AND policyname LIKE 'artist_%';
--
-- Expected rows:
--   1. artist_upload_own_folder | INSERT | {authenticated}
--   2. artist_update_own_files  | UPDATE | {authenticated}
--   3. artist_select_own_files  | SELECT | {authenticated}
-- ==============================================================================

-- ==============================================================================
-- ROLLBACK SCRIPT (Execute if ever needed):
-- ==============================================================================
-- BEGIN;
-- DROP POLICY IF EXISTS "artist_upload_own_folder" ON storage.objects;
-- DROP POLICY IF EXISTS "artist_update_own_files"  ON storage.objects;
-- DROP POLICY IF EXISTS "artist_select_own_files"  ON storage.objects;
-- COMMIT;
-- ==============================================================================
