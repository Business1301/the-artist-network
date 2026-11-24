-- ==============================================================================
-- THE ARTIST NETWORK — Booking Tables Privilege Hardening (Minimal)
-- Migration: 20261125120000_revoke_booking_extra_privileges.sql
--
-- Scope: Minimal, non-destructive least-privilege correction for Phase 5.2B review.
-- Preserves all data, constraints, triggers, RLS policies, and RPCs.
-- Removes unnecessary authenticated TRUNCATE, TRIGGER, REFERENCES (and direct
-- INSERT/UPDATE/DELETE) privileges on public.booking_enquiries and
-- public.booking_enquiry_events while preserving authenticated SELECT (under RLS).
-- Matches the security baseline established for public.admin_audit_logs.
-- ==============================================================================

BEGIN;

REVOKE ALL ON TABLE public.booking_enquiries
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.booking_enquiries
  TO authenticated;

REVOKE ALL ON TABLE public.booking_enquiry_events
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.booking_enquiry_events
  TO authenticated;

COMMIT;
