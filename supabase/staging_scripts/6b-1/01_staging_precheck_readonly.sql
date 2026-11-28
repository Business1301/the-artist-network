-- ==============================================================================
-- THE ARTIST NETWORK — Phase 6B-1 Pre-Migration Read-Only Diagnostics
-- File:   supabase/staging_scripts/6b-1/01_staging_precheck_readonly.sql
-- Type:   A. READ-ONLY DIAGNOSTICS (Zero schema or data mutations)
-- Target: STAGING ONLY (iqlbftywtueoozmfjjgy)
-- Order:  Step 1 of 4 (Run BEFORE applying any Phase 6B-1 migrations)
-- ==============================================================================

SELECT '1a_migration_ledger_summary' AS check_section,
       COALESCE(MAX(version), 'NONE') AS item_name,
       'count=' || COUNT(*)::text AS detail
FROM supabase_migrations.schema_migrations

UNION ALL

SELECT '1b_migration_ledger_rows',
       version::text,
       COALESCE(name, '(unnamed)')
FROM supabase_migrations.schema_migrations

UNION ALL

SELECT '1c_target_versions_present',
       v.ver,
       CASE WHEN EXISTS (
         SELECT 1 FROM supabase_migrations.schema_migrations sm WHERE sm.version = v.ver
       ) THEN 'ALREADY_PRESENT' ELSE 'NOT_YET_APPLIED' END
FROM (VALUES ('20261201000000'), ('20261201000100')) AS v(ver)

UNION ALL

SELECT '2_existing_tables',
       table_name::text,
       'exists'
FROM information_schema.tables
WHERE table_schema = 'public'

UNION ALL

SELECT '3_existing_data_counts',
       tbl,
       cnt
FROM (
  SELECT 'profiles_total'::text AS tbl, COUNT(*)::text AS cnt FROM public.profiles
  UNION ALL
  SELECT 'profiles_business', COUNT(*)::text FROM public.profiles WHERE role = 'business'
  UNION ALL
  SELECT 'business_profiles', COUNT(*)::text FROM public.business_profiles
  UNION ALL
  SELECT 'artist_profiles', COUNT(*)::text FROM public.artist_profiles
  UNION ALL
  SELECT 'booking_enquiries', COUNT(*)::text FROM public.booking_enquiries
) AS counts

UNION ALL

SELECT '4_business_profiles_grants_before',
       grantee::text,
       pg_catalog.string_agg(privilege_type::text, ', ' ORDER BY privilege_type::text)
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'business_profiles'
  AND grantee IN ('PUBLIC', 'anon', 'authenticated')
GROUP BY grantee

UNION ALL

SELECT '5_existing_auth_trigger_fn',
       proname::text,
       'owner=' || pg_catalog.pg_get_userbyid(proowner)::text
         || ' | secdef=' || prosecdef::text
         || ' | config=' || COALESCE(proconfig::text, '(none)')
FROM pg_catalog.pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('handle_new_user', 'is_admin')

ORDER BY 1, 2;
