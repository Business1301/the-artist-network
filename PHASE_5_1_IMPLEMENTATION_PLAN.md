# Phase 5.1: Secure Booking Enquiry System — Implementation Plan & Architecture Specification

> **DOCUMENT STATUS:** ARCHITECTURAL SPECIFICATION & SECURITY AUDIT (STAGE 1 COMPLETE & AUDITED)  
> **CURRENT STAGE:** READY FOR PLATFORM OWNER REVIEW & MIGRATION APPROVAL  
> **TARGET MILESTONE:** PHASE 5.1 (BOOKING ENQUIRIES — DISCOVERY TO NEGOTIATION)  
> **SCOPE BOUNDARY:** INQUIRIES ONLY. ZERO PAYMENTS, ZERO CONTRACTUAL OBLIGATIONS, ZERO CALENDAR AUTO-BLOCKING.

---

## 1. Executive Summary & Purpose

The Artist Network is currently a testing version deployed on Netlify (`https://artist-net-v1.netlify.app`), with an active local development environment (`localhost:3000`). Having completed Phase 1 through Phase 4.7 (Artist Discovery, Directory, Profiles, Portfolios, Admin Moderation, Verification, and Private Artist Calendars), the platform now requires a secure, non-binding mechanism for verified business accounts to initiate formal gig enquiries with published artists.

### 1.1 Core Problem Statement
Currently, business accounts visiting an artist profile (`/artists/[slug]`) see a callout: *"Login as Client to check prices!"*. On the business dashboard (`/dashboard/restaurant`), outgoing enquiries and weekend line-ups are static UI demonstrations (`mockSentEnquiries`, `mockLineup`). There is no operational database pipeline for a business to communicate event requirements, verify mutual interest, or negotiate dates with an artist.

### 1.2 Phase 5.1 Objective
Design and specify a secure, end-to-end Booking Enquiry System allowing:
1. **Authenticated businesses** to submit structured gig enquiries to **published artists**.
2. **Artists** to review enquiries in their private dashboard, inspect event details and budgets, and respond (`interested`, `declined`, or `info_requested`).
3. **Businesses** to provide a single structured clarification response when an artist requests more information, or withdraw pending submissions.
4. **Both parties** to track the enquiry lifecycle in real time with an append-only event history trail.

> [!IMPORTANT]
> **Enquiry ≠ Confirmed Booking.**  
> A Phase 5.1 enquiry is strictly an expression of interest and exploratory communication. The artist expressing interest (`interested`) **does NOT create a confirmed booking, contract, payment obligation, or calendar event**. Date locking, escrow, and confirmed contracts are explicitly deferred to Phase 5.2+.

---

## 2. Review of Existing Architecture & Database Verifications

Before specifying the SQL schema, the existing live database catalog and migrations were thoroughly inspected:

| Component | Verified Location | Verification Findings & Architecture Compliance |
|---|---|---|
| **Artist Foreign Key** | `public.artist_profiles(id)` | `artist_profiles.id` is a primary key that references `public.profiles(id) ON DELETE CASCADE`. Foreign key in enquiries points to `public.artist_profiles(id)` ensuring target must be a valid artist profile. |
| **Business Foreign Key** | `public.profiles(id)` | Business accounts exist in `public.profiles` (`role = 'business'`) with extended metadata in `public.business_profiles`. Foreign key in enquiries points to `public.profiles(id)`. |
| **Artist Eligibility** | `public.artist_profiles.profile_status` | Status CHECK: `('draft', 'published', 'suspended', 'pending_review', 'rejected')`. Only `published` artists can receive enquiries. Suspended artists are completely frozen. |
| **Role Verification** | `public.profiles.role` | Strictly verified inside DB functions via `SELECT role FROM public.profiles WHERE id = auth.uid()`. Never trusts client-supplied `user_metadata`. |
| **Admin Authorization** | `public.is_admin()` | Existing `SECURITY DEFINER` function with `SET search_path = ''`. Authenticated grant only. Used for admin read policies. |
| **Security Definer Functions** | Postgres Catalog | All RPCs explicitly define `SECURITY DEFINER` and `SET search_path = ''` to prevent search-path hijacking attacks. Schema qualification uses `pg_catalog.*` for procedural functions (`btrim`, `char_length`, `now`, `hashtext`, `pg_advisory_xact_lock`), `public.*` for tables, and standard bare keyword syntax for SQL grammatical constructs (`NULLIF`, `COALESCE`). |
| **Client Privilege Revocation & RLS** | Postgres Privilege Engine | Direct table `INSERT`, `UPDATE`, `DELETE` are completely revoked from `PUBLIC`, `anon`, and `authenticated`. Standard `ENABLE ROW LEVEL SECURITY` (without `FORCE`) guarantees that client sessions are strictly RLS-restricted for `SELECT` while `SECURITY DEFINER` RPCs running as `postgres` can perform internal mutations without policy violations. Default `PUBLIC` EXECUTE privileges on newly defined functions are explicitly revoked. |
| **Artist Calendar Schema** | `public.artist_calendar_events` | Contains `platform_inquiry_id UUID DEFAULT NULL` protected by immutable triggers. **Zero calendar changes occur in Phase 5.1**. Calendar events are NOT auto-created. |
| **Zero External Paid Dependencies** | Architecture Invariant | Rate limiting, flood prevention, and spam controls run 100% inside PostgreSQL. Zero external dependencies (no Upstash, Redis, Resend, or SMTP). |

---

## 3. Workflow Architecture & Lifecycle State Machine

### 3.1 Non-Binding Status Semantics: Open vs. Terminal

To prevent legal and operational ambiguity, and to prevent terminal enquiries from permanently consuming active quotas, statuses are explicitly categorized into **Open** and **Terminal**:

#### Open Statuses (Count toward active limits):
- **`submitted`**: Initial state. Business submitted event details; awaiting artist review.
- **`seen`**: Artist intentionally opened/expanded the enquiry details card. Fetching records does **not** trigger this.
- **`info_requested`**: Artist reviewed details and requested clarification (e.g. stage dimensions, sound rider, exact timings).
- **`clarified`**: Business submitted the single clarification response addressing the artist's questions. Awaiting artist's decision.

#### Terminal Statuses (Concluded; DO NOT count toward active limits):
- **`interested`**: **(Non-binding terminal state)**. Artist expressed interest in the event. Does not block dates or create contracts. Offline or Phase 5.2 negotiations follow.
- **`declined`**: **(Terminal state)**. Artist is unavailable or declined the enquiry.
- **`withdrawn`**: **(Terminal state)**. Business withdrew the enquiry before conclusion.

### 3.2 Complete Transition Matrix

```
                          ┌──────────────┐
                          │  submitted   │
                          └──────┬───────┘
          ┌──────────────────────┼──────────────────────┬──────────────────────┐
          │ (artist seen)        │ (artist interested)  │ (artist decline)     │ (business withdraw)
          ▼                      │                      │                      ▼
    ┌──────────┐                 │                      │                ┌───────────┐
    │   seen   │                 │                      │                │ withdrawn │ (Terminal)
    └─────┬────┘                 │                      │                └───────────┘
          ├──────────────────────┤                      │                      ▲
          │                      │                      │                      │
          │ (request info)       │                      │                      │
          ▼                      │                      │                      │
   ┌─────────────┐               │                      │                      │
   │info_request.│               │                      │                      │
   └──────┬──────┘               │                      │                      │
          ├──────────────────────┼──────────────────────┤                      │
          │ (business clarify)   │ (artist decline)     │ (business withdraw)  │
          ▼                      │                      └──────────────────────┘
   ┌─────────────┐               │                                             ▲
   │  clarified  │               │                                             │
   └──────┬──────┘               │                                             │
          ├──────────────────────┼─────────────────────────────────────────────┘
          │                      │ (business withdraw)
          ▼                      ▼
   ┌─────────────┐        ┌───────────┐
   │ interested  │        │ declined  │ (Terminal)
   └─────────────┘        └───────────┘
     (Terminal)
```

| Source State | Trigger / RPC Call | Authorized Actor | Target State | Constraints & Behavior |
|---|---|---|---|---|
| *None* | `submit_booking_enquiry` | Business | `submitted` | Future IST date, event type, requirements, optional budget, message. |
| `submitted` | `respond_to_booking_enquiry('seen')` | Artist | `seen` | Triggered explicitly when artist expands enquiry drawer. Sets `seen_at`. |
| `submitted` | `respond_to_booking_enquiry('interested')` | Artist | `interested` | Optional response note. Non-binding interest expressed. Terminal. |
| `submitted` | `respond_to_booking_enquiry('decline')` | Artist | `declined` | Optional decline reason. Terminal. |
| `submitted` | `respond_to_booking_enquiry('request_info')` | Artist | `info_requested` | Mandatory question text ($\ge 5$ chars, max 2,000 chars). |
| `submitted` | `withdraw_booking_enquiry` | Business | `withdrawn` | Permitted while in `submitted` state. Terminal. |
| `seen` | `respond_to_booking_enquiry('seen')` | Artist | `seen` | **Idempotent no-op**. Safe on repeat expansions. |
| `seen` | `respond_to_booking_enquiry('interested')` | Artist | `interested` | Optional response note. Non-binding interest expressed. Terminal. |
| `seen` | `respond_to_booking_enquiry('decline')` | Artist | `declined` | Optional decline reason. Terminal. |
| `seen` | `respond_to_booking_enquiry('request_info')` | Artist | `info_requested` | Mandatory question text ($\ge 5$ chars, max 2,000 chars). |
| `seen` | `withdraw_booking_enquiry` | Business | `withdrawn` | Permitted while in `seen` state. Terminal. |
| `info_requested` | `clarify_booking_enquiry` | Business | `clarified` | Mandatory clarification answer ($\ge 5$ chars, max 2,000 chars). Sets `clarified_at`. |
| `info_requested` | `respond_to_booking_enquiry('decline')` | Artist | `declined` | Artist decides not to proceed. Terminal. |
| `info_requested` | `withdraw_booking_enquiry` | Business | `withdrawn` | Business decides not to clarify and closes enquiry. Terminal. |
| `clarified` | `respond_to_booking_enquiry('interested')` | Artist | `interested` | Artist is satisfied with clarification. Terminal. |
| `clarified` | `respond_to_booking_enquiry('decline')` | Artist | `declined` | Artist declines after reading clarification. Terminal. |
| `clarified` | `withdraw_booking_enquiry` | Business | `withdrawn` | Business withdraws before artist response. Terminal. |
| `interested` | Any RPC action | — | — | **Terminal**. Any mutation attempt raises `23514` (except idempotent repeated call). |
| `declined` | Any RPC action | — | — | **Terminal**. Any mutation attempt raises `23514` (except idempotent repeated call). |
| `withdrawn` | Any RPC action | — | — | **Terminal**. Any mutation attempt raises `23514` (except idempotent repeated call). |

---

## 4. Concurrency Safety, Rate Limiting & Lock Ordering

### 4.1 Strict Uniform Advisory Lock Ordering
To guarantee that neither the **3-open-enquiry limit per pair** nor the **per-business submission velocity limit** can be bypassed by concurrent requests (e.g. multiple browser tabs or API scripts), `submit_booking_enquiry` acquires **transaction-level PostgreSQL advisory locks**:

```sql
-- Lock 1: Business Lock (serializes all submissions by this specific business)
PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('tan_enq_biz:' || v_business_id::text)::bigint);

-- Lock 2: Pair Lock (serializes submissions between this business and target artist)
PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('tan_enq_pair:' || v_business_id::text || ':' || p_artist_id::text)::bigint);
```

**Deadlock Prevention:** Because Lock 1 is ALWAYS acquired first by the calling business, transactions can never acquire locks in reverse order. Different businesses targeting the same artist lock on different `business_id` values and serialize cleanly on the Pair Lock.

### 4.2 Three-Tier Quota Enforcement (Open Enquiries Only)
Under these locks, four atomic checks execute sequentially:
1. **Pair Open Limit:**
   `COUNT(*) WHERE business_id = v_business_id AND artist_id = p_artist_id AND status IN ('submitted', 'seen', 'info_requested', 'clarified') < 3`.
2. **Duplicate Open Date Guard:**
   `COUNT(*) WHERE business_id = v_business_id AND artist_id = p_artist_id AND event_date = p_event_date AND status IN ('submitted', 'seen', 'info_requested', 'clarified') = 0`.
3. **Platform-Wide Open Limit:**
   `COUNT(*) WHERE business_id = v_business_id AND status IN ('submitted', 'seen', 'info_requested', 'clarified') < 10`.
4. **Velocity Rate Limit (Anti-Spam):**
   `COUNT(*) WHERE business_id = v_business_id AND created_at > (pg_catalog.now() - INTERVAL '1 hour') < 5`.

*Key Rule:* Terminal enquiries (`interested`, `declined`, `withdrawn`) do **NOT** count against Limits 1, 2, or 3. They are preserved for historical record-keeping.

### 4.3 Time Zone Policy
- Table-level `CHECK (event_date >= CURRENT_DATE)` is **intentionally omitted**.
- Validation is enforced dynamically inside `submit_booking_enquiry` using **Indian Standard Time (`Asia/Kolkata` = UTC+5:30)**:
  ```sql
  v_min_date := (pg_catalog.now() AT TIME ZONE 'Asia/Kolkata')::DATE + INTERVAL '1 day';
  IF p_event_date < v_min_date THEN
    RAISE EXCEPTION 'Event date must be in the future (at least tomorrow in Indian Standard Time)' USING ERRCODE = '23514';
  END IF;
  ```
- In the dashboard UI, enquiries where `event_date < today` display a clear *"Past Event"* badge while preserving their full historical status.

---

## 5. Audit Trail, Data Retention & Privacy Specification

### 5.1 Append-Only Audit History Table: `public.booking_enquiry_events`
Every state change automatically appends an immutable event row in the same transaction:
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `enquiry_id UUID NOT NULL REFERENCES public.booking_enquiries(id) ON DELETE CASCADE`
- `actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL`
- `actor_role TEXT NOT NULL CHECK (actor_role IN ('business', 'artist', 'admin'))`
- `action TEXT NOT NULL CHECK (action IN ('submitted', 'seen', 'info_requested', 'clarified', 'interested', 'declined', 'withdrawn'))`
- `notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 2000)`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

### 5.2 Account Deletion & Privacy Policy (DPDPA 2023 / GDPR)
- **Normal Client Deletion:** Neither businesses nor artists can delete enquiries or event logs. Direct `DELETE` privileges are completely revoked.
- **Account Erasure Requests:** When a user account is deleted by platform administration (under DPDPA Right to Erasure):
  - `booking_enquiries.business_id` and `artist_id` use `ON DELETE CASCADE`. The enquiry is purged.
  - `booking_enquiry_events.enquiry_id` uses `ON DELETE CASCADE`. Associated event logs are purged with the enquiry.
  - `booking_enquiry_events.actor_id` uses `ON DELETE SET NULL`. If an actor's profile is deleted while an enquiry row remains, `actor_id` becomes `NULL` without violating foreign keys or breaking the other party's view.
- **Accurate Classification:** Event logs are **tamper-proof and append-only for the duration of the enquiry lifecycle**, with **lifecycle-bound cascade deletion upon verified account erasure**.

---

## 6. Complete Database Test Plan (Pre-Execution Verification)

The following test suite verifies all security invariants, role boundaries, rate limits, and concurrency locks.

### Test Matrix

| # | Test Scenario | Actor / Context | Expected Result | Verified Invariant |
|---|---|---|---|---|
| **T01** | Anonymous user attempts direct `SELECT` on `booking_enquiries` | `anon` | Returns 0 rows (RLS blocks) | Zero public access |
| **T02** | Anonymous user attempts `submit_booking_enquiry` | `anon` | Aborts with `42501` (Auth required) | Auth gate |
| **T03** | Artist user attempts `submit_booking_enquiry` | `artist` | Aborts with `42501` (Only business allowed) | Role enforcement |
| **T04** | Business submits enquiry to unpublished/suspended artist | `business` | Aborts with `23514` (Artist unavailable) | Publication gate |
| **T05** | Business submits enquiry to self (`business_id = artist_id`) | `business` | Aborts with `23514` (Cannot enquire self) | Self-enquiry guard |
| **T06** | Business submits enquiry with past date (IST) | `business` | Aborts with `23514` (Date must be future) | IST date validation |
| **T07** | Business submits valid enquiry | `business` | Succeeds; returns UUID; status = `'submitted'` | Standard submission |
| **T08** | Business attempts 2nd open enquiry for exact same artist and date | `business` | Aborts with `23514` (Duplicate enquiry) | Duplicate date guard |
| **T09** | Business submits 4th open enquiry to same artist | `business` | Aborts with `23514` (Max 3 open per pair) | Pair quota limit |
| **T10** | Other business attempts to view Business A's enquiry | `business_B` | Returns 0 rows (RLS blocks) | Tenant isolation |
| **T11** | Receiving artist views enquiry list | `artist` | Enquiry appears; status remains `'submitted'` | Read safety |
| **T12** | Receiving artist expands enquiry (`'seen'`) | `artist` | Status -> `'seen'`; `seen_at` set; event logged | Seen transition |
| **T13** | Receiving artist repeats `'seen'` | `artist` | Succeeds (idempotent no-op) | Idempotent safety |
| **T14** | Receiving artist requests info with `< 5` char string | `artist` | Aborts with `23514` (Min 5 chars required) | Length validation |
| **T15** | Receiving artist requests info with valid question | `artist` | Status -> `'info_requested'`; event logged | Info request transition |
| **T16** | Other artist attempts to respond to Business A's enquiry | `artist_B` | Aborts with `P0002` (Access denied) | Artist isolation |
| **T17** | Business provides clarification ($\ge 5$ chars) | `business` | Status -> `'clarified'`; `clarified_at` set | Clarification transition |
| **T18** | Business attempts 2nd clarification | `business` | Aborts with `23514` (Must be info_requested) | Single clarification cycle |
| **T19** | Artist expresses interest (`'interested'`) | `artist` | Status -> `'interested'`; event logged | Terminal transition |
| **T20** | Business submits new enquiry to artist after previous reached `'interested'` | `business` | Succeeds! (Terminal does not consume quota) | Open vs terminal quota |
| **T21** | Business attempts to withdraw an `'interested'` enquiry | `business` | Aborts with `23514` (Already concluded) | Concluded freeze |
| **T22** | Admin queries `booking_enquiries` and events | `admin` | Reads all rows via `public.is_admin()` | Admin oversight |
| **T23** | Concurrent submissions under transaction advisory lock | Concurrent | Serialized; quota strictly held to 3 | Concurrency safety |

---

## 7. Migration Readiness & Artifact Location

- **Migration File:** [supabase/migrations/20261117_booking_enquiries.sql](file:///c:/Users/mohit/OneDrive/Desktop/The%20Artist%20Network/supabase/migrations/20261117_booking_enquiries.sql)
- **Status:** **FULLY AUDITED & READY FOR PLATFORM OWNER APPROVAL**
- **Git Working Tree:** Clean. All changes tracked locally. Zero remote pushes.
- **Compiler State:** TypeScript 0 errors; ESLint 0 errors.

> [!NOTE]
> Stage 1 is fully prepared. **Awaiting owner approval** to execute `20261117_booking_enquiries.sql` in the Supabase Dashboard SQL Editor before beginning Stage 2.
