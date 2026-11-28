-- ==============================================================================
-- THE ARTIST NETWORK — Phase 6B-1 Post-Migration Verification (READ-ONLY)
-- File:   supabase/staging_scripts/6b-1/04_staging_postcheck_verify_readonly.sql
-- Type:   D. POST-MIGRATION READ-ONLY VERIFICATION
-- Target: STAGING ONLY (iqlbftywtueoozmfjjgy)
-- Order:  Step 4 of 4 (Run AFTER 20261201000000, 20261201000100 & ledger record complete)
-- ==============================================================================

SELECT '0_migration_ledger' AS check_section,
       v.ver AS item_name,
       COALESCE(
         (SELECT 'RECORDED (' || COALESCE(sm.name, '(unnamed)') || ')'
          FROM supabase_migrations.schema_migrations sm
          WHERE sm.version = v.ver),
         'NOT_RECORDED'
       ) AS detail
FROM (VALUES ('20261201000000'), ('20261201000100')) AS v(ver)

UNION ALL

SELECT '1_rls_enabled',
       c.relname::text,
       CASE WHEN c.relrowsecurity THEN 'RLS_ON' ELSE 'RLS_OFF' END
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('business_profiles', 'business_gigs', 'business_gig_applications')

UNION ALL

SELECT '2_table_grants',
       table_name::text || ' (' || grantee::text || ')',
       pg_catalog.string_agg(privilege_type::text, ', ' ORDER BY privilege_type::text)
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('business_profiles', 'business_gigs', 'business_gig_applications')
  AND grantee IN ('PUBLIC', 'anon', 'authenticated')
GROUP BY table_name, grantee

UNION ALL

SELECT '3_policies',
       tablename::text || ' -> ' || policyname::text,
       cmd::text || ' (' || pg_catalog.array_to_string(roles, ', ') || ')'
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('business_profiles', 'business_gigs', 'business_gig_applications')

UNION ALL

SELECT '4_functions_secdef',
       proname::text,
       'owner=' || pg_catalog.pg_get_userbyid(proowner)::text
         || ' | secdef=' || prosecdef::text
         || ' | config=' || COALESCE(proconfig::text, '(none)')
FROM pg_catalog.pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'current_user_role',
    'is_active_business_account',
    'generate_business_slug',
    'enforce_business_profile_protection',
    'set_phase6b_updated_at',
    '_validate_business_gig_inputs',
    'create_business_gig',
    'update_business_gig',
    'set_business_gig_status',
    'get_business_posted_gigs',
    'get_artist_business_gigs',
    'get_artist_business_gig_detail',
    'submit_gig_application',
    'withdraw_gig_application',
    'get_artist_gig_applications',
    'review_gig_application',
    'get_business_gig_applicants'
  )

UNION ALL

SELECT '5_function_exec_grants',
       p.proname::text,
       'anon=' || pg_catalog.has_function_privilege('anon', p.oid, 'EXECUTE')::text
         || ' | auth=' || pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE')::text
FROM pg_catalog.pg_proc p
WHERE p.pronamespace = 'public'::regnamespace
  AND p.proname IN (
    'current_user_role',
    'is_active_business_account',
    'generate_business_slug',
    'enforce_business_profile_protection',
    'set_phase6b_updated_at',
    '_validate_business_gig_inputs',
    'create_business_gig',
    'update_business_gig',
    'set_business_gig_status',
    'get_business_posted_gigs',
    'get_artist_business_gigs',
    'get_artist_business_gig_detail',
    'submit_gig_application',
    'withdraw_gig_application',
    'get_artist_gig_applications',
    'review_gig_application',
    'get_business_gig_applicants'
  )

UNION ALL

SELECT '6_fk_delete_rules',
       tc.table_name::text || '.' || tc.constraint_name::text,
       rc.delete_rule::text
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc
  ON rc.constraint_schema = tc.constraint_schema
 AND rc.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('business_gigs', 'business_gig_applications')

UNION ALL

SELECT '7_backfill_integrity',
       'missing_business_profiles',
       COUNT(*)::text
FROM public.profiles p
WHERE p.role = 'business'
  AND NOT EXISTS (SELECT 1 FROM public.business_profiles bp WHERE bp.id = p.id)

UNION ALL

SELECT '7_backfill_integrity',
       'null_or_blank_business_slugs',
       COUNT(*)::text
FROM public.business_profiles bp
WHERE bp.slug IS NULL OR pg_catalog.btrim(bp.slug) = ''

ORDER BY 1, 2;
