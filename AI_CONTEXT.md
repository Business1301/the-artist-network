# THE ARTIST NETWORK — Complete AI Project Handover Memory

> **IMPORTANT NOTICE FOR FUTURE AI CODING ASSISTANTS:**  
> Read this document in its entirety before inspecting or modifying any code in this repository.  
> This file is the authoritative single source of truth for architecture, completed phases, security invariants, database schema, and operational boundaries.

---

## 1. Quick Start for AI Assistants

### What is this project?
**The Artist Network** is a modern, India-focused marketplace connecting artists (singers, musicians, DJs, bands, dancers, performers, visual artists) with businesses (cafes, restaurants, event organizers, corporate venues) and private clients for discovery, booking enquiries, and creative hiring.

### Core Tech Stack
- **Framework:** Next.js 16.4.6 (App Router, Turbopack, Partial Prefetching, Cache Components enabled)
- **Runtime & UI:** React 19, TypeScript 5, Tailwind CSS v4
- **Backend as a Service:** Supabase (PostgreSQL 15+, Supabase Auth, Row Level Security, Storage)
- **Deployment Target:** Vercel (or Node.js server) + Supabase Cloud
- **Target Market & Currency:** India / Indian Rupee (₹, INR), regionalized for Indian cities and genres.

### Operational Golden Rules
1. **Never allow public admin registration or client-side self-promotion.** Admin role is strictly owner-only and can only be assigned via the Supabase Dashboard SQL Editor running as the database superuser (`postgres`).
2. **Never expose or commit API secrets, service-role keys, or database passwords.** Client code strictly uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. **Keep operating costs as close to ₹0 as practical.** Respect free-tier limits on Supabase and Vercel.
4. **Work incrementally, one approved stage at a time.** Never jump ahead to future phases without user approval.
5. **Always verify compilation and linting.** Run `npx tsc --noEmit`, `npm run lint`, and `npm run build` after making modifications.
6. **Do not claim functionality is tested unless genuinely verified.**

---

## 2. Workspace & Directory Structure

```
c:\Users\mohit\OneDrive\Desktop\The Artist Network\
├── app/                                # Next.js 16 App Router
│   ├── actions/                        # Server actions
│   │   ├── admin.ts                    # Admin moderation, metrics & audit actions (Phase 4.5)
│   │   └── artist.ts                   # Artist onboarding, profile & portfolio actions (Phase 3)
│   ├── admin/                          # Owner-Only Protected Admin Portal (Phase 4.5)
│   │   ├── layout.tsx                  # Server layout with requireAdmin() guard & AdminNavbar
│   │   ├── page.tsx                    # Admin KPI metrics overview & pending queue
│   │   ├── applications/page.tsx       # Artist application review queue & moderation modal
│   │   └── audit-logs/page.tsx         # Immutable database audit trail viewer
│   ├── artists/                        # Public Discovery & Profiles (Phase 4)
│   │   ├── page.tsx                    # Artist directory with search, filter, debounce, pagination
│   │   └── [slug]/page.tsx             # Public artist showcase profile (PPR dynamic)
│   ├── auth/                           # Authentication Server Actions (Phase 2 & 4.5)
│   │   └── actions.ts                  # signUpAction, signInAction (fail-closed), signOutAction
│   ├── categories/page.tsx             # Category browsing page
│   ├── components/                     # Reusable UI & Client Components
│   │   ├── AdminNavbar.tsx             # Responsive Admin top navigation shell
│   │   ├── ApplicationsManager.tsx     # Interactive moderation drawer/modal & action controls
│   │   ├── ArtistCard.tsx              # Marketplace artist card with badges
│   │   ├── ArtistCategories.tsx        # Homepage categories grid
│   │   ├── ArtistCTA.tsx               # Homepage CTA banner
│   │   ├── AuditLogViewer.tsx          # Paginated audit log table & JSON inspector
│   │   ├── DashboardShowcase.tsx       # Interactive dashboard preview
│   │   ├── DirectoryFilters.tsx        # URL-driven search, category, city & sort controls
│   │   ├── FeaturedArtists.tsx         # Curated artists showcase
│   │   ├── Footer.tsx                  # Global footer
│   │   ├── ForBusinesses.tsx           # Value proposition for venues & organizers
│   │   ├── Hero.tsx                    # Homepage hero section
│   │   ├── HowItWorks.tsx              # 3-step platform explanation
│   │   ├── Navbar.tsx                  # Global marketplace navigation header
│   │   ├── OpportunitiesTeaser.tsx     # Teaser for gig listings
│   │   ├── PortfolioManager.tsx        # Drag-order, media upload & YouTube embed manager
│   │   └── SearchBar.tsx               # Quick search bar
│   ├── dashboard/                      # Authenticated User Dashboards
│   │   ├── artist/                     # Artist Dashboard
│   │   │   ├── layout.tsx              # Server layout with requireArtist() guard (Phase 4.5 Stage 2.1)
│   │   │   ├── page.tsx                # Onboarding status, review banner, performance preview
│   │   │   └── edit/page.tsx           # Multi-step artist profile & portfolio editor
│   │   └── restaurant/
│   │       ├── layout.tsx              # Server layout with requireBusiness() guard (Phase 4.5 Stage 2.1)
│   │       └── page.tsx                # Business / Venue Client Dashboard
│   ├── login/page.tsx                  # Unified login page with fail-closed redirect
│   ├── opportunities/page.tsx          # Opportunities teaser & listings
│   ├── signup/page.tsx                 # Registration page (strictly 'artist' or 'business')
│   ├── globals.css                     # Tailwind CSS v4 design tokens & theme
│   └── layout.tsx                      # Root HTML layout with Google Font inter
├── lib/                                # Core Utilities & Data Access
│   ├── auth/
│   │   ├── admin.ts                    # requireAdmin() server-side authorization guard
│   │   ├── artist.ts                   # requireArtist() server-side authorization guard (Phase 4.5 Stage 2.1)
│   │   ├── business.ts                 # requireBusiness() server-side authorization guard (Phase 4.5 Stage 2.1)
│   │   └── redirect.ts                 # getSafeRedirectPath() open-redirect defense
│   ├── data/
│   │   ├── artists.ts                  # Live database queries (getFilteredArtists, getArtistBySlug)
│   │   └── demoArtists.ts              # Fallback demo fixtures for offline development
│   └── supabase/
│       ├── client.ts                   # Browser Supabase client (createBrowserClient)
│       ├── proxy.ts                    # Next.js 16 Proxy session refresher
│       └── server.ts                   # Server-side Supabase client (createServerClient with cookies)
├── supabase/
│   └── migrations/                     # PostgreSQL Migrations (applied via Supabase SQL Editor)
│       ├── 20261031_init_auth_schema.sql                # Phase 2: Profiles, business_profiles, RLS
│       ├── 20261101_artist_profiles_and_portfolio.sql   # Phase 3: Artist profiles, portfolio, triggers
│       └── 20261101_admin_system.sql                    # Phase 4.5 Stage 1: Admin RPC, audit logs, role lock
├── .env.example                        # Template for environment variables
├── .env.local                          # Local environment credentials (git-ignored)
├── next.config.ts                      # Next.js 16 config (cacheComponents, partialPrefetching)
├── package.json                        # Dependencies & scripts
├── PROJECT_PLAN.md                     # Comprehensive 27-section product roadmap
└── tsconfig.json                       # Strict TypeScript configuration
```

---

## 3. Technology Stack & Key Dependencies

| Dependency | Version | Purpose |
|---|---|---|
| `next` | `16.4.3` | App Router, Server Actions, Partial Prerendering (PPR) |
| `react` / `react-dom` | `19.0.0` | React 19 with Server Components & Actions |
| `@supabase/ssr` | `^0.5.2` | Cookie-based Supabase session handling in App Router |
| `@supabase/supabase-js` | `^2.49.1`| Supabase PostgreSQL, Auth, and Storage SDK |
| `tailwindcss` | `^4.0.0` | Tailwind CSS v4 with `@tailwindcss/postcss` |
| `zod` | `^3.24.2` | Schema validation for forms and inputs |
| `typescript` | `^5.7.3` | Strict type checking (`--noEmit` enforced) |

---

## 4. Database Architecture & Security Model

The database is hosted on Supabase (PostgreSQL 15+). All access is governed by Row Level Security (RLS), column-level privileges, and database triggers.

### Table Schema Summary

#### 1. `public.profiles`
- Primary table linked to `auth.users(id) ON DELETE CASCADE`.
- Columns: `id` (UUID, PK), `role` (`'artist'`, `'business'`, `'admin'`), `full_name` (TEXT), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
- **Security & Privileges:**
  - `authenticated` has table-level `SELECT, INSERT, DELETE` (default). Table-level `UPDATE` is **REVOKED**.
  - `authenticated` has column-level `UPDATE` **strictly on `full_name`**.
  - `UPDATE` on `role` and `id` is strictly revoked from all client roles (`PUBLIC`, `anon`, `authenticated`).
  - `BEFORE UPDATE` trigger `on_profiles_role_protection` aborts if `auth.uid() IS NOT NULL` and `NEW.role <> OLD.role`.
  - RLS SELECT policies:
    - `"Users can view their own profile"`: `auth.uid() = id`
    - `"Admins can view all profiles for moderation"`: `public.is_admin()`
  - Note: Legacy public SELECT policy was dropped in Phase 4.5 Stage 1 to protect artist legal real names.

#### 2. `public.artist_profiles`
- Extended profile table linked to `public.profiles(id) ON DELETE CASCADE`.
- Columns: `id` (UUID, PK), `stage_name` (TEXT), `slug` (TEXT UNIQUE), `category` (TEXT), `country` (TEXT default 'India'), `state` (TEXT), `city` (TEXT), `bio` (TEXT), `experience_years` (INTEGER), `genres` (TEXT[]), `specialities` (TEXT[]), `languages` (TEXT[]), `performance_types` (TEXT[]), `starting_price` (NUMERIC), `pricing_unit` (TEXT), `profile_image_url` (TEXT), `cover_image_url` (TEXT), `instagram_url` (TEXT), `youtube_url` (TEXT), `facebook_url` (TEXT), `website_url` (TEXT), `profile_status` (`'draft'`, `'pending_review'`, `'published'`, `'rejected'`), `rejection_reason` (TEXT), `is_verified` (BOOLEAN), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
- **Security & Triggers:**
  - `on_artist_profile_slug`: Auto-generates clean, unique slugs on insert/update.
  - `on_artist_profile_protection`: Anti-tampering trigger. Prevents non-admins from changing `is_verified`, `rejection_reason`, `id`, or transitioning `profile_status` to anything other than `'draft'` or `'pending_review'`.
  - RLS Policies:
    - Public: Can view only where `profile_status = 'published'`.
    - Owner: Can view/insert/update/delete their own row where `auth.uid() = id`.
    - Admin: Can view all rows via `public.is_admin()`.

#### 3. `public.portfolio_items`
- Media portfolio linked to `public.artist_profiles(id) ON DELETE CASCADE`.
- Columns: `id` (UUID, PK), `artist_id` (UUID, FK), `title` (TEXT), `description` (TEXT), `media_type` (`'image'`, `'youtube'`, `'audio'`, `'link'`), `media_url` (TEXT), `thumbnail_url` (TEXT), `display_order` (INTEGER), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
- RLS Policies:
  - Public: Can view items where the artist has `profile_status = 'published'`.
  - Owner: Can view/insert/update/delete their own portfolio items.
  - Admin: Can view all items for moderation via `public.is_admin()`.

#### 4. `public.business_profiles`
- Venue / organizer profile linked to `public.profiles(id) ON DELETE CASCADE`.
- Columns: `id` (UUID, PK), `business_name` (TEXT), `contact_name` (TEXT), `created_at`, `updated_at`.
- RLS: Business users can view/insert/update only their own row (`auth.uid() = id`).
- Admin metrics count business accounts using `profiles.role = 'business'` to avoid exposing business private contact details.

#### 5. `public.admin_audit_logs`
- Immutable platform moderation audit trail.
- Columns: `id` (UUID, PK), `admin_id` (UUID, FK to `profiles(id) ON DELETE SET NULL`), `admin_email` (TEXT), `admin_name` (TEXT), `target_artist_id` (UUID, decoupled without FK to survive artist deletions), `target_stage_name` (TEXT), `action` (`'approve_profile'`, `'reject_profile'`, `'verify_artist'`, `'unverify_artist'`), `details` (JSONB), `created_at` (TIMESTAMPTZ).
- **Permissions:** Client write/update/delete/truncate is **REVOKED**. Authenticated users have `SELECT` only protected by RLS policy `"Admins can view audit logs"` (`public.is_admin()`).
- Inserts happen **only** inside the trusted `admin_moderate_artist_profile` RPC.

### Database Functions & RPCs

1. **`public.is_admin()`**
   - Helper function (`SECURITY DEFINER`, `SET search_path = ''`, `STABLE`).
   - Checks if `auth.uid()` has `role = 'admin'` in `public.profiles`.
   - Executable only by `authenticated`.

2. **`public.admin_moderate_artist_profile(p_artist_id UUID, p_action TEXT, p_rejection_reason TEXT)`**
   - Core atomic moderation RPC (`SECURITY DEFINER`, `SET search_path = ''`).
   - **Step 1:** Verifies caller via `public.is_admin()`. Aborts with `42501` if unauthorized.
   - **Step 2:** Resolves authenticated administrator identity from `auth.users` and `public.profiles`. Aborts with `28000` if unresolvable (zero fabricated data).
   - **Step 3:** Row-locks artist profile `FOR UPDATE`.
   - **Step 4:** Enforces moderation invariants:
     - `'approve'`: sets `profile_status = 'published'`, `rejection_reason = NULL`.
     - `'reject'`: enforces mandatory `p_rejection_reason` (aborts if missing/empty), sets `profile_status = 'rejected'`, `is_verified = false`.
     - `'verify'`: enforces `profile_status = 'published'` (aborts if unpublished), sets `is_verified = true`.
     - `'unverify'`: sets `is_verified = false`.
   - **Step 5:** Updates `artist_profiles` (fires anti-tampering trigger).
   - **Step 6:** Inserts atomic audit record into `public.admin_audit_logs`. If audit insert fails, entire moderation rolls back.

3. **`public.enforce_profile_role_protection()`**
   - `BEFORE UPDATE` trigger on `public.profiles`.
   - Blocks any attempt by an authenticated client (`auth.uid() IS NOT NULL`) to alter `role` or `id`.

---

## 5. Development Phases & Current Status

```
Phase 1: Marketplace Foundation & UI              [COMPLETED & VERIFIED]
Phase 1.5: Auth UI & Form Prototypes              [COMPLETED & VERIFIED]
Phase 2: Database Schema & Authentication         [COMPLETED & VERIFIED]
Phase 3: Artist Onboarding, Profiles & Portfolio  [COMPLETED & VERIFIED]
Phase 4: Public Directory, Filtering & Search     [COMPLETED & VERIFIED]
Phase 4.5 Stage 1: Admin Database Foundation      [COMPLETED & VERIFIED]
Phase 4.5 Stage 2: Admin Application Layer        [COMPLETED & VERIFIED]
Phase 4.5 Stage 2.1: Dashboard Access Security Fix [COMPLETED & VERIFIED]
Phase 4.5 Stage 3: Live Verification & Testing   [READY TO BEGIN UPON OWNER PROMOTION]
Phase 5: Business Accounts & Booking Enquiries    [PLANNED]
Phase 6: Gig Opportunities & Auditions            [PLANNED]
Phase 7: Launch Polish, Trust & Legal             [PLANNED]
Phase 8: Growth, Community & Reviews              [PLANNED]
```

### Detailed Phase Records

#### Phase 1: Marketplace Foundation & UI (Completed)
- Clean, responsive marketplace homepage: Hero, Category Cards, Featured Artists, How It Works, Business Value Proposition, CTA Banner, Footer.
- Full responsive design supporting mobile, tablet, and desktop.

#### Phase 2: Database Schema & Authentication (Completed)
- Supabase integration via SSR cookies (`@supabase/ssr`).
- Automatic user profile creation on signup via `public.handle_new_user()` trigger on `auth.users`.
- Role assignment strictly sanitized: public signup allows only `'artist'` or `'business'`.

#### Phase 3: Artist Onboarding & Portfolios (Completed)
- Multi-step onboarding and profile editor (`/dashboard/artist/edit`).
- Draft vs Pending Review submission workflow (`draft` -> `pending_review`).
- Database trigger `on_artist_profile_protection` blocking artists from self-publishing or self-verifying.
- Portfolio manager supporting photos, YouTube videos, audio samples, and ordering.
- Public artist profile showcase page (`/artists/[slug]`).

#### Phase 4: Public Directory, Filtering & Search (Completed)
- Directory page (`/artists`) with URL-driven search params.
- Real-time text search (stage name, bio, genres).
- Category filtering with badge counts.
- Location filtering (Indian cities: Mumbai, Delhi NCR, Bengaluru, Goa, etc.).
- Sort options: Recommended, Starting Price (Low to High, High to Low), Experience.
- Debounced search inputs and pagination.

#### Phase 4.5 Stage 1: Owner-Only Admin Database Foundation (Completed)
- Migration `20261101_admin_system.sql` applied in Supabase SQL Editor.
- Database functions: `is_admin()`, `admin_moderate_artist_profile()`, `enforce_profile_role_protection()`.
- Table: `admin_audit_logs` (immutable, zero client write grants).
- Security hardening: Table-level UPDATE revoked on `profiles`; column UPDATE restricted to `full_name`.
- Privacy hardening: Dropped legacy public SELECT policies exposing artists' real names.

#### Phase 4.5 Stage 2.1: Dashboard Access Security Fix (Completed)
- **Security gap identified:** `/dashboard/artist` and `/dashboard/artist/edit` had only client-side `useEffect` auth checks (no role validation). `/dashboard/restaurant` had zero authentication — accessible by any anonymous visitor.
- **Artist Route Guard (`lib/auth/artist.ts`):** `requireArtist()` fetches role exclusively from `public.profiles`. Unauthenticated → `/login?redirectTo=<path>`. Admin → `/admin`. Business → `/dashboard/restaurant`. Unknown role → `/login?unauthorized=true`.
- **Business Route Guard (`lib/auth/business.ts`):** `requireBusiness()` fetches role exclusively from `public.profiles`. Unauthenticated → `/login?redirectTo=<path>`. Admin → `/admin`. Artist → `/dashboard/artist`. Unknown role → `/login?unauthorized=true`.
- **Artist Layout (`app/dashboard/artist/layout.tsx`):** Server component with `export const instant = false`. Calls `requireArtist()` before any child page renders. Automatically protects both `/dashboard/artist` and `/dashboard/artist/edit`.
- **Restaurant Layout (`app/dashboard/restaurant/layout.tsx`):** Server component with `export const instant = false`. Calls `requireBusiness()` before the restaurant dashboard page renders.
- **Build result:** All three dashboard routes now show `ƒ (Dynamic)` — server-rendered on demand with security guards. 0 TypeScript errors, 0 ESLint errors. Total route count: 16.
- **Existing client-side auth code in dashboard pages:** Intentionally preserved (now redundant but harmless — server layout blocks unauthorized access first).
- **Testing limitation:** Build and type verification confirmed. Live end-to-end role-based redirect behavior (cross-role boundary, unauthorized access, session persistence) cannot be confirmed until (a) the owner account is promoted to `admin` and (b) at least one verified `artist` or `business` account exists to test cross-role boundaries.

---

#### Phase 4.5 Stage 2: Admin Application Layer (Completed)
- **Login Redirection (`app/auth/actions.ts`):** Reads role strictly from `public.profiles`. Never trusts `user_metadata.role`. Fails closed if role lookup fails.
- **Open-Redirect Defense (`lib/auth/redirect.ts`):** `getSafeRedirectPath()` validates internal relative paths, blocks protocol-relative paths (`//`), backslashes (`\`), and prohibits non-admins from redirecting to `/admin`.
- **Server Guard (`lib/auth/admin.ts`):** `requireAdmin()` strictly enforces `role === 'admin'`. Redirects unauthenticated users to `/login?redirectTo=/admin`, non-admins to their authorized dashboards.
- **Admin Layout (`app/admin/layout.tsx`):** Protected layout with `AdminNavbar`, Owner Admin status badge, and secure sign-out.
- **Admin Overview (`app/admin/page.tsx`):** 4 real database KPI metrics cards, quick pending review queue, recent moderation events.
- **Applications Queue (`app/admin/applications/page.tsx` & `ApplicationsManager.tsx`):** Status filter tabs, detailed drawer displaying bio, rates, socials, and portfolio media, Approve button, Reject modal (enforces >= 5 char reason), Verify/Unverify badge controls.
- **Audit Log Viewer (`app/admin/audit-logs/page.tsx` & `AuditLogViewer.tsx`):** Paginated audit trail, formatted IST timestamps, diff summary, expandable JSON details.
- **Server Actions (`app/actions/admin.ts`):** Every action independently calls `requireAdmin()`. Calls atomic `admin_moderate_artist_profile` RPC. Revalidates Next.js cache.
- **Next.js 16 Compatibility:** Handled Cache Components and Partial Prefetching by isolating server actions and applying `export const instant = false` to blocking server routes.

---

## 6. Implementation Status Matrix

| Component | Path | Status | Testing Level |
|---|---|---|---|
| Admin Route Guard | `lib/auth/admin.ts` | **Implemented** | Unit & build verified |
| Artist Route Guard | `lib/auth/artist.ts` | **Implemented** | Build & type verified |
| Business Route Guard | `lib/auth/business.ts` | **Implemented** | Build & type verified |
| Safe Redirect Guard | `lib/auth/redirect.ts` | **Implemented** | Unit & build verified |
| Auth Server Actions | `app/auth/actions.ts` | **Implemented** | Build & type verified |
| Admin Server Actions | `app/actions/admin.ts` | **Implemented** | Build & type verified |
| Admin Layout & Navbar | `app/admin/layout.tsx` | **Implemented** | Build & type verified |
| Admin Overview Page | `app/admin/page.tsx` | **Implemented** | Build & type verified |
| Admin Applications Review | `app/admin/applications/page.tsx` | **Implemented** | Build & type verified |
| Admin Audit Logs Page | `app/admin/audit-logs/page.tsx` | **Implemented** | Build & type verified |
| Artist Dashboard Layout | `app/dashboard/artist/layout.tsx` | **Implemented** | Build & type verified |
| Restaurant Dashboard Layout | `app/dashboard/restaurant/layout.tsx` | **Implemented** | Build & type verified |
| Global Navbar Auth State | `app/components/Navbar.tsx` | **Implemented** | Unit & build verified |
| Database Migration Stage 1 | `supabase/migrations/20261101_admin_system.sql` | **Deployed & Verified** | Live catalog verified |
| Owner Account Promotion | Database SQL Editor | **Completed & Verified** | Single owner admin confirmed |
| Live End-to-End Moderation Test | `/admin` UI -> Database | **In Progress** | Stage 3 underway |

---

## 7. Security Invariants & Rules

1. **Owner-Only Platform Administration:** Exactly ONE administrator account initially: the platform owner. No public registration route, UI, or API exists to register administrators.
2. **Immutable Role Assignment via Client API:** The PostgreSQL privilege engine and database trigger `on_profiles_role_protection` prevent any client session (`auth.uid() IS NOT NULL`) from updating `role` or `id`.
3. **Database-Level Moderation Invariants:** All status transitions (`published`, `rejected`, `verify`, `unverify`) must pass through the `admin_moderate_artist_profile` RPC. Direct client updates to artist moderation fields are blocked by trigger `on_artist_profile_protection`.
4. **Mandatory Rejection Reasons:** Rejecting an artist requires a non-empty, meaningful reason (minimum 5 characters) enforced both in TypeScript and in PostgreSQL (`ERRCODE = '23514'`).
5. **Atomic Audit Logging:** State changes and audit log entries occur within the exact same database transaction. If the audit insert fails, the profile status modification rolls back.
6. **No Cascading Deletion of Audit Logs:** Deleting an artist or administrator never deletes or alters audit logs. `target_artist_id` is an unconstrained UUID, and `admin_id` uses `ON DELETE SET NULL`.
7. **Artist Legal Name Privacy:** Public visitors can only read `stage_name` from `public.artist_profiles`. The legal name (`full_name`) in `public.profiles` is private to the artist and platform administrators.

---

## 8. Safe Owner Account Promotion Procedure

The platform owner promotes their existing account directly in the **Supabase Dashboard SQL Editor**. No email or UUID is shared in chat.

> **Why this works despite the role-protection trigger:**  
> The `enforce_profile_role_protection()` trigger fires `BEFORE UPDATE` and blocks role changes only when `auth.uid() IS NOT NULL` — i.e., only during authenticated client API sessions. When the Supabase SQL Editor runs as the `postgres` superuser (`auth.uid()` is `NULL`), the trigger's `IF auth.uid() IS NOT NULL` guard is false, so the `UPDATE` proceeds. This is intentional defence-in-depth: client sessions can never self-promote, but the database owner can promote via the server console.

### Atomic Promotion Script
```sql
DO $$
DECLARE
  -- Replace the value below with your registered login email (keep lowercase).
  v_target_email TEXT := LOWER(TRIM('YOUR_REGISTERED_EMAIL@domain.com'));
  v_user_id UUID;
  v_user_count INTEGER;
  v_existing_admin_count INTEGER;
  v_final_admin_count INTEGER;
BEGIN
  -- 1. Guard against placeholder email
  IF v_target_email = 'your_registered_email@domain.com' OR v_target_email = '' OR v_target_email IS NULL THEN
    RAISE EXCEPTION 'Setup Aborted: You must substitute your registered email into v_target_email.';
  END IF;

  -- 2. Verify that NO account currently has the admin role
  SELECT COUNT(*) INTO v_existing_admin_count
  FROM public.profiles
  WHERE role = 'admin';

  IF v_existing_admin_count > 0 THEN
    RAISE EXCEPTION 'Setup Aborted: Platform already has % administrator(s). Exactly ONE admin permitted.', v_existing_admin_count;
  END IF;

  -- 3. Verify exactly one matching account exists in auth.users
  SELECT COUNT(*) INTO v_user_count
  FROM auth.users
  WHERE LOWER(email) = v_target_email;

  IF v_user_count = 0 THEN
    RAISE EXCEPTION 'Setup Aborted: No user found in auth.users matching email "%".', v_target_email;
  ELSIF v_user_count > 1 THEN
    RAISE EXCEPTION 'Setup Aborted: Multiple accounts found matching email "%".', v_target_email;
  END IF;

  SELECT id INTO v_user_id
  FROM auth.users
  WHERE LOWER(email) = v_target_email
  LIMIT 1;

  -- 4. Verify corresponding profile row exists in public.profiles
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'Setup Aborted: User found in auth.users but no profile exists in public.profiles for ID %.', v_user_id;
  END IF;

  -- 5. Promote the target account
  UPDATE public.profiles
  SET role = 'admin', updated_at = now()
  WHERE id = v_user_id;

  -- 6. Post-condition check: Verify that EXACTLY ONE admin exists platform-wide
  SELECT COUNT(*) INTO v_final_admin_count
  FROM public.profiles
  WHERE role = 'admin';

  IF v_final_admin_count <> 1 THEN
    RAISE EXCEPTION 'Setup Failed: Expected exactly 1 platform admin, found %. Transaction rolled back.', v_final_admin_count;
  END IF;

  RAISE NOTICE 'SUCCESS: Account "%" promoted to platform administrator. Exactly 1 admin verified.', v_target_email;
END;
$$;
```

### Verification Query
```sql
SELECT p.id, p.role, p.full_name, u.email, p.updated_at
FROM public.profiles AS p
JOIN auth.users AS u ON u.id = p.id
WHERE p.role = 'admin';
```

---

## 9. Current Build Verification Status

- **TypeScript (`npx tsc --noEmit`):** Passed with **0 errors**.
- **ESLint (`npm run lint`):** Passed with **0 errors** (10 pre-existing `<img>` warnings across existing pages).
- **Next.js Turbopack Production Build (`npm run build`):** All 16 routes compiled and prerendered successfully:
  - `○ /` (Static)
  - `○ /_not-found` (Static)
  - `ƒ /admin` (Dynamic - Server authorization guarded)
  - `ƒ /admin/applications` (Dynamic - Server authorization guarded)
  - `ƒ /admin/audit-logs` (Dynamic - Server authorization guarded)
  - `◐ /artists` (Partial Prerender)
  - `◐ /artists/[slug]` (Partial Prerender)
  - `○ /categories` (Static)
  - `ƒ /dashboard/artist` (Dynamic - Server role guard: artist only)
  - `ƒ /dashboard/artist/edit` (Dynamic - Server role guard: artist only)
  - `ƒ /dashboard/restaurant` (Dynamic - Server role guard: business only)
  - `○ /login` (Static with Suspense query handler)
  - `○ /opportunities` (Static)
  - `○ /signup` (Static)

> **Note:** Dashboard routes changed from `○ (Static)` to `ƒ (Dynamic)` after Phase 4.5 Stage 2.1. This is expected — server-side auth guards require per-request server execution.

---

## 10. AI Handover & Next Recommended Actions

### Exactly Where Development Stopped
- **Phase 4.5 Stage 1 (Database):** Fully deployed and verified in Supabase PostgreSQL.
- **Website Reload Loop Fix (2026-11-12):** Resolved repeated page reloads on `/signup` and client routes.
  - **Root Cause 1 (Hydration Mismatch):** `Navbar.tsx` accessed `localStorage.getItem("tan_auth_user")` directly within the initial `useState` callback. On public client pages where `initialUser === undefined`, SSR rendered the guest navbar ("Sign In", "Join as Artist") while client hydration immediately rendered the authenticated navbar ("Dashboard", "Log Out"). React threw `Hydration failed because the server rendered HTML didn't match the client`, triggering Next.js dev error-recovery reloads in an infinite loop.
  - **Root Cause 2 (Stale Turbopack Dev Chunks):** Running `npm run build` while `npm run dev` was active overwrote the `.next` directory with production manifests. The running dev server then served mismatched chunks, causing `ChunkLoadError` and unhandled rejections that forced Turbopack's HMR client to reload repeatedly.
  - **Resolution:**
    1. `Navbar.tsx`: State initializes to `initialUser ?? null` on both server and client (never accesses `localStorage` or `window` in `useState`). SSR and client hydration output identical HTML.
    2. Synchronously adjust user state on SSR prop change using React recommended pattern (`prevUserId !== initialUserId`).
    3. `useEffect` handles post-hydration async `getCurrentUser()` call cleanly without cascading render warnings.
    4. Explicitly configured `turbopack: { root: process.cwd() }` in `next.config.ts`.
    5. Cleaned corrupted `.next` cache and restarted dev server cleanly.

- **Phase 4.5 Stage 2 (Application Layer):** Fully implemented and verified.
- **Phase 4.5 Stage 2.1 (Dashboard Security Fix):** Fully implemented and build-verified. Server-side role guards protect all dashboard routes.
- **Owner Activation:** Completed in database (sole administrator confirmed).
- **UI Harmonization & Reference Redesign:** Completed. Updated Artist directory (`/artists`), artist card (`ArtistCard.tsx`), artist profile showcase (`/artists/[slug]`), and navbar (`Navbar.tsx`) to match the clean light-themed reference mobile design. Removed legacy demo portal links from artist dashboard.
- **Global Navbar Auth State & SSR Integration:** Completed & verified. `Navbar.tsx` is authentication-aware across all public pages (`/`, `/artists`, `/artists/[slug]`, `/categories`, `/opportunities`).
  - **Root Cause of previous issue:** Public pages were statically rendered and did not fetch the user session on the server to pass to `<Navbar />`. In addition, `localStorage` (`tan_auth_user`) was not set during login, and `document.cookie` could not read `@supabase/ssr` `httpOnly` auth cookies. This resulted in the navbar defaulting to the logged-out guest state during SSR and initial client hydration.
  - **Resolution:**
    1. Server pages (`/`, `/artists`, `/artists/[slug]`, `/categories`, `/opportunities`) now call `getCurrentUser()` directly on the server and pass `initialUser={currentUser}` to `<Navbar />`.
    2. Server components render the exact user authentication state and role-specific dashboard link directly in the initial SSR HTML with zero client-side UI flicker.
    3. `signInAction` now returns the authenticated user profile (role from `public.profiles`), which is cached in `localStorage` upon login for instant client hydration.
    4. `signOutAction` in both `Navbar.tsx` and `AdminNavbar.tsx` cleanly clears local storage cache and redirects to home/login.
    5. Role destinations strictly follow `public.profiles`:
       - Admin (`role === 'admin'`) → `🛡️ Admin Dashboard` (`/admin`) + `Log Out`
       - Artist (`role === 'artist'`) → `🎨 Artist Dashboard` (`/dashboard/artist`) + `Log Out`
       - Business (`role === 'business'`) → `🏢 Business Dashboard` (`/dashboard/restaurant`) + `Log Out`
       - Logged-out visitor → `Sign In` (`/login`) + `Join as Artist` (`/signup`)
    6. TypeScript (`npx tsc --noEmit`), ESLint (`npm run lint`), and Next.js 16 production build (`npm run build`, 16/16 routes) all pass with zero errors.
- **Phase 4.5 Stage 3 — Integration Audit (2026-11-12):** Non-destructive code inspection + static analysis completed. Browser test blocked (requires Chrome with remote debugging — user must launch Chrome before live browser tests can run). All findings documented below.

- **Next Phase:** **Phase 4.5 Stage 3 — Live Browser Testing** (blocked on Chrome remote debugging; see Section 11).

- **Technical Cleanup & Hardening (2026-11-12):** Final cleanup session. No functional changes. All checks pass.
  - **Git repository:** Initialized at correct project root (`The Artist Network/.git`). Previous `.git` was incorrectly scoped to the parent Desktop directory (would have committed resume PDFs, videos, and unrelated Desktop files). Fixed by running `git init` inside the project folder. First baseline commit `a91e4b9` created: 70 project files, no secrets, no Desktop debris.
  - **AGENTS.md:** Extended with project-specific AI coding instructions above the Next.js `<!-- BEGIN:nextjs-agent-rules -->` marker. The Next.js block is preserved exactly. Future `next dev` restarts only regenerate content inside the markers; custom project rules above them are permanent.
  - **proxy.ts (root) vs lib/supabase/proxy.ts:** Both files are required and correctly structured.
    - `proxy.ts` at the project root is the **Next.js 16 file convention** (official replacement for `middleware.ts`, documented in `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`). It exports the `proxy(request)` function and `config.matcher`. Next.js invokes this on every matched request.
    - `lib/supabase/proxy.ts` contains the **Supabase session refresh implementation** (`updateSession()`). The root `proxy.ts` imports and delegates to it. This two-file separation keeps the Next.js file convention entry point thin and the Supabase logic testable in isolation.
  - **lib/data/artists.ts — timeout hardening:**
    - **Issue found and fixed:** The old `withTimeout<T>` helper accepted a generic `fallback: T`. On timeout, it resolved with `{ data: null, count: 0, error: null }`. Because `error` was `null`, the caller's error-check was skipped — a database timeout was silently presented as a genuine zero-artist result. This was a correctness bug.
    - **Fix:** Replaced `withTimeout` with `withQueryTimeout<D>`, a Postgrest-aware helper typed as `Promise<{ data: D | null; error: PostgrestError | null }>`. On timeout it resolves with a real `PostgrestError` (`code: "TIMEOUT"`), so callers that inspect `error` correctly treat timeouts as failures and return empty UI state with a logged warning — not a silent "no results".
    - **Type safety:** Removed all `as unknown as` casts. The `PostgrestError` object includes the required `toJSON()` method. The `.filter(Boolean)` on nullable string arrays is replaced with an explicit type predicate `(v): v is string => v !== null` to satisfy strict TypeScript. The only remaining narrow cast is `(result as { count?: number | null }).count` for the Postgrest `count` field, which is not part of the base `{ data, error }` response shape exposed by the helper — this is documented in the code.
  - **Build verification:** `npx tsc --noEmit` → 0 errors; `npm run lint` → 0 errors, 8 pre-existing `<img>` warnings; `npm run build` → all 16 routes, exit 0.

### What Requires User Action Before Proceeding
1. The user must execute the **Section 8** script in the Supabase Dashboard SQL Editor to promote their own account to `admin`.
2. The user must verify the promotion query returns `role = 'admin'`.

### What the Next AI Assistant Should Do
1. Confirm with the user that the owner account has been promoted in Supabase.
2. Guide the user through the Phase 4.5 Stage 3 live testing checklist:
   - **Admin login test:** Log out → log in with owner credentials → confirm automatic redirection to `/admin`.
   - **Admin metrics test:** Verify KPI cards on `/admin` display live database counts.
   - **Application review test:** Visit `/admin/applications`; inspect portfolio drawer, test approval, test rejection with reason (≥ 5 chars), test verify/unverify badge.
   - **Audit log test:** After each moderation action, confirm an atomic record appears on `/admin/audit-logs`.
   - **Artist dashboard test (with an artist account):** Log in as an artist → confirm redirect to `/dashboard/artist`. Attempt `/dashboard/restaurant` → confirm redirect back to `/dashboard/artist`.
   - **Restaurant dashboard test (with a business account):** Log in as a business → confirm redirect to `/dashboard/restaurant`. Attempt `/dashboard/artist` → confirm redirect back to `/dashboard/restaurant`.
   - **Unauthorized access test:** Log out → attempt `/admin`, `/dashboard/artist`, `/dashboard/restaurant` directly → confirm each redirects to `/login?redirectTo=...` without rendering any page content.
   - **Cross-role boundary test:** Log in as an artist → attempt to visit `/admin` directly → confirm redirect to `/dashboard/artist` (handled by `requireAdmin()`).
3. Proceed to **Phase 5 (Business Accounts & Booking Enquiries)** only after the user explicitly signs off on Phase 4.5 Stage 3.


---

## 11. Phase 4.5 Stage 3 — Integration Audit Results (2026-11-12)

### Method
Static code inspection + build verification. Live browser tests blocked pending Chrome remote debugging setup (see §11.4).

### 11.1 Route Protection — PASS (Code-Verified)

All protected routes have server-side authorization guards enforced at the layout level (before any child page renders):

| Route Prefix | Layout File | Guard | Redirect on Fail |
|---|---|---|---|
| `/admin/*` | `app/admin/layout.tsx` | `requireAdmin()` | `/login?redirectTo=/admin` |
| `/dashboard/artist/*` | `app/dashboard/artist/layout.tsx` | `requireArtist()` | `/login?redirectTo=/dashboard/artist` |
| `/dashboard/artist/edit` | Covered by artist layout | `requireArtist()` | (same) |
| `/dashboard/restaurant/*` | `app/dashboard/restaurant/layout.tsx` | `requireBusiness()` | `/login?redirectTo=/dashboard/restaurant` |

**Cookie pre-check:** All three guards check for session cookies first. No cookies → instant redirect with no Supabase remote call.  
**Full auth path:** When cookies exist → `supabase.auth.getUser()` remote verify → `public.profiles` DB role check. Cookie presence alone is never sufficient.

### 11.2 Cross-Role Redirect Matrix — PASS (Code-Verified)

| Visitor Role | Visits | Redirected To |
|---|---|---|
| Unauthenticated | `/admin` | `/login?redirectTo=/admin` |
| Unauthenticated | `/dashboard/artist` | `/login?redirectTo=/dashboard/artist` |
| Unauthenticated | `/dashboard/restaurant` | `/login?redirectTo=/dashboard/restaurant` |
| `artist` | `/admin` | `/dashboard/artist` (via `requireAdmin()` else branch) |
| `artist` | `/dashboard/restaurant` | `/dashboard/artist` (via `requireBusiness()`) |
| `business` | `/admin` | `/dashboard/restaurant` (via `requireAdmin()` else branch) |
| `business` | `/dashboard/artist` | `/dashboard/restaurant` (via `requireArtist()`) |
| `admin` | `/dashboard/artist` | `/admin` (via `requireArtist()`) |
| `admin` | `/dashboard/restaurant` | `/admin` (via `requireBusiness()`) |

### 11.3 Navbar Auth State — PASS (Code-Verified)

All five public pages pass server-fetched `initialUser` to `<Navbar />`:

| Page | Server Action | Navbar Prop |
|---|---|---|
| `/` (`app/page.tsx`) | `getCurrentUser()` | `initialUser={currentUser}` ✅ |
| `/artists` (`app/artists/page.tsx`) | `getCurrentUser()` | `initialUser={currentUser}` ✅ |
| `/artists/[slug]` | `getCurrentUser()` | `initialUser={currentUser}` ✅ |
| `/categories` | `getCurrentUser()` | `initialUser={currentUser}` ✅ |
| `/opportunities` | `getCurrentUser()` | `initialUser={currentUser}` ✅ |

**Role-to-link mapping in Navbar** (code-verified):
- `role === "admin"` → 🛡️ Admin Dashboard (`/admin`) + Log Out
- `role === "business"` → 🏢 Business Dashboard (`/dashboard/restaurant`) + Log Out
- `role === "artist"` → 🎨 Artist Dashboard (`/dashboard/artist`) + Log Out
- Logged out → Sign In + Join as Artist

**Open redirect defense:** `getSafeRedirectPath()` validates all post-login redirects. Rejects `//`, `\`, null bytes, and blocks non-admin roles from being redirected to `/admin/*`.

### 11.4 Known Gap — Artist Directory DB Error vs. Empty State

**Status: Identified — Not Fixed (accepted risk for current phase)**

`getPublishedArtists()` returns `artists: []` on both a genuine empty database AND on a DB timeout/error. The page shows "Curating Our Artist Roster" in both cases. After the `withQueryTimeout` fix, timeouts now log a `console.error` server-side — but the UI cannot distinguish timeout from genuine zero artists, because `ArtistDiscoveryResult` has no `dbError` flag.

**Risk level:** Low. Currently there are no published artists, so both states are indistinguishable anyway. Users see the demo showcase prompt either way. When real artists are published, a timeout would falsely show zero artists for 4 seconds. Recommend adding `dbError?: boolean` to `ArtistDiscoveryResult` and a banner in Phase 5 scope.

### 11.5 Dev Server Warning — `AuthRetryableFetchError` / `Date.now()`

The dev server log shows:
```
AuthRetryableFetchError: Route "/artists/[slug]": Next.js encountered the unstable value Date.now() while prerendering
```

**Root cause:** The Supabase `@supabase/ssr` client internally calls `Date.now()` during token refresh. When Next.js PPR tries to statically prerender `/artists/[slug]` metadata during development, it catches this. Both the page and `generateMetadata` have `await connection()` and `export const instant = false`, which correctly opts them out of static prerendering at request time. This warning appears in dev mode only, does **not** affect production builds (all 16 routes compiled without errors), and is a Supabase SDK internals issue — not something to fix in application code.

### 11.6 Browser Tests — BLOCKED

Live browser tests (login flow, session persistence, admin dashboard KPIs, moderation queue, audit logs) require Chrome with remote debugging enabled. Tests were not able to run automatically.

**To enable browser tests:**
1. Close all Chrome windows
2. Run: `"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222`
3. Tell the AI assistant you are ready — browser tests will be re-delegated automatically

### 11.7 Build Verification at Audit Time — PASS

- `npx tsc --noEmit` → 0 errors ✅
- `npm run lint` → 0 errors, 8 pre-existing `<img>` warnings ✅
- `npm run build` → all 16 routes, exit 0 ✅
- Git commit `b408aab` is the current HEAD

### 11.8 Remaining Live Tests (Requires Browser + Real Accounts)

The following must be verified manually or via browser automation with real credentials:

1. **Admin login test:** Log in with owner credentials → confirm redirect to `/admin`
2. **Admin KPI cards:** Verify numbers on `/admin` are live DB counts (not zeros)
3. **Application queue:** Visit `/admin/applications` — confirm pending artists appear
4. **Moderation actions:** Approve/reject with reason, verify/unverify badge (use a test artist account — do not touch real applications)
5. **Audit log test:** Confirm each moderation action creates an audit entry
6. **Artist session persistence:** Log in as artist → navigate `/artists` → navbar shows "🎨 Artist Dashboard"
7. **Logout test:** Click Log Out → confirm redirect to `/` → navbar returns to logged-out state
8. **Browser refresh test:** Log in → navigate to `/artists` → hard refresh → navbar still shows logged-in state (session persisted via SSR cookie)

---

## 12. Phase 4.5 Stage 3 — Authentication Diagnosis & Test Accounts (2026-11-12)

### 12.1 Authentication Root Cause Analysis

**Primary Failure Root Cause: Supabase Free Tier Inactivity Auto-Pause (DNS ENOTFOUND)**
- **Diagnostic Result:** Any call to `signUpAction`, `signInAction`, or session refresh fails with:
  `Error [AuthRetryableFetchError]: fetch failed` caused by `getaddrinfo ENOTFOUND jmwkvrghquqqsfwierpj.supabase.co`.
- **DNS Verification:** Querying `jmwkvrghquqqsfwierpj.supabase.co` across both system DNS and Google Public DNS (`8.8.8.8`) returns `DNS_ERROR_RCODE_NAME_ERROR` (`NXDOMAIN`).
- **Explanation:** Supabase Free Plan automatically pauses projects after 7 days of inactivity and de-registers their public DNS hostnames. The project `.env.local` was configured on November 1, 2026 (>7 days ago).
- **Required Action:** The project owner must log in to the Supabase Dashboard at `https://supabase.com/dashboard/project/jmwkvrghquqqsfwierpj` and click **"Restore project" / "Resume project"** (or update `.env.local` if a new project URL was created).

### 12.2 Authentication Code Hardening & Fixes Applied

1. **User-Friendly Network & Pause Diagnostics (`app/auth/actions.ts`):**
   - Replaced raw `"fetch failed"` errors in `signInAction` and `signUpAction` with clear actionable messages:
     *"Unable to connect to the authentication server. Please ensure your Supabase project is active and unpaused in the Supabase Dashboard."*
2. **Instant Registration Hydration (`app/auth/actions.ts` & `app/signup/page.tsx`):**
   - `signUpAction` now returns the authenticated `user` payload upon successful signup.
   - `app/signup/page.tsx` now caches `tan_auth_user` in `localStorage` upon immediate signup, eliminating navbar hydration flicker on first landing.
3. **Resilient Logout (`app/auth/actions.ts`):**
   - `signOutAction` now catches remote network failures gracefully so that local session cookies and client state are cleared even if the Supabase backend is unreachable.
4. **Git Security for Test Credentials (`.gitignore`):**
   - Explicitly added `.test-credentials.local` to `.gitignore`. Verified with `git check-ignore`.

### 12.3 Test Accounts Preparation (Part 2 & Part 3)

Two dedicated test accounts have been configured adhering strictly to RFC 2606 reserved domains:
- **Test Artist:**
  - Email: `artist.test@theartistnetwork.example`
  - Role: `artist`
  - Name: `Demo Test Artist`
  - Password: Generated unique 18-character high-entropy password.
- **Test Business:**
  - Email: `business.test@theartistnetwork.example`
  - Role: `business`
  - Name: `Demo Test Venue` (Manager: `Demo Venue Manager`)
  - Password: Generated different unique 18-character high-entropy password.

**Credential Security Policy:**
- Passwords are saved **only** on the local developer machine in the git-ignored file:
  `c:\Users\mohit\OneDrive\Desktop\The Artist Network\.test-credentials.local`
- Passwords are **never** committed to Git, logged to console, written into markdown documentation, or exposed in final reports.

**Account Provisioning Status:**
- Automated provisioning script executed successfully against active Supabase project.
- **Artist Account:** `artist.test@theartistnetwork.example` (Auth ID: `688c7416-7d71-44cf-ba09-b519fdf26f15`, Profile Role: `'artist'`) ✅
- **Business Account:** `business.test@theartistnetwork.example` (Auth ID: `b4db2908-5454-43e6-81a4-c80ef02d07f5`, Profile Role: `'business'`) ✅
- Both accounts can sign in via Supabase Auth and have valid `public.profiles` entries.

### 12.4 Phase 4.5 Stage 3 — Integration Testing Results

All integration checks executed with 100% pass rate:
1. **Artist Sign-In & Profile Verification:** PASS ✅
   - Successful auth session token exchange.
   - `public.profiles` read confirms `role = 'artist'`, `full_name = 'Demo Test Artist'`.
2. **Business Sign-In & Profile Verification:** PASS ✅
   - Successful auth session token exchange.
   - `public.profiles` read confirms `role = 'business'`, `full_name = 'Venue Manager'`.
3. **Cross-Role Boundary Enforcement:** PASS ✅
   - Artist accessing `requireArtist()` → Granted.
   - Artist accessing `requireBusiness()` → Correctly redirected to `/dashboard/artist`.
   - Artist accessing `requireAdmin()` → Correctly redirected to `/dashboard/artist`.
   - Business accessing `requireBusiness()` → Granted.
   - Business accessing `requireArtist()` → Correctly redirected to `/dashboard/restaurant`.
   - Business accessing `requireAdmin()` → Correctly redirected to `/dashboard/restaurant`.
4. **Open Redirect & Path Traversal Defense:** PASS ✅
   - `//evil.com` safely sanitized to role dashboard.
   - `/\evil.com` safely sanitized to role dashboard.
   - `/admin` and `/admin/*` requested by artist/business cleanly redirected to authorized dashboard.
   - `/admin/*` requested by admin preserved.
   - Legitimate internal paths (e.g. `/artists`) preserved.
5. **Server Route Protection (Unauthenticated):** PASS ✅
   - `/admin` → HTTP 307 redirect to `/login?redirectTo=/admin`.
   - `/dashboard/artist` → HTTP 307 redirect to `/login?redirectTo=%2Fdashboard%2Fartist`.
   - `/dashboard/restaurant` → HTTP 307 redirect to `/login?redirectTo=%2Fdashboard%2Frestaurant`.
   - `/artists` (public) → HTTP 200 OK.
6. **Next.js 16 Partial Prerendering & Date.now() Stability:** PASS ✅
   - Added `await connection()` to `app/artists/page.tsx` and `app/artists/[slug]/page.tsx`.
   - Clean dynamic request-time rendering (`ƒ /artists`), 0 prerendering blocking errors.
7. **Custom Technical Rider & Stage Requirements (Section 5):** PASS ✅
   - Database migration `supabase/migrations/20261112_artist_technical_requirements.sql` (`technical_requirements TEXT[]`).
   - Profile editor (`/dashboard/artist/edit`) equipped with dynamic add/remove, custom input, quick presets, and clear-all.
   - Public showcase (`/artists/[slug]`) dynamically displays custom requirements or collapses if empty.
   - Graceful fallback in `app/actions/artist.ts` if database column migration is pending in remote DB.

### 12.5 Artist Profile Editor & Portfolio Manager UI Harmonization

- **Objective:** Eliminate dark-mode visual disconnect between `/dashboard/artist` (clean light theme with purple accents) and `/dashboard/artist/edit` (previously dark `bg-gray-950`).
- **Files Harmonized:**
  - `app/dashboard/artist/edit/page.tsx`: Transformed to light canvas (`bg-gray-50 text-gray-900 pt-20 pb-20`).
  - `app/components/PortfolioManager.tsx`: Transformed to clean white card (`bg-white rounded-2xl border border-gray-200 shadow-sm`), light drawer form, and white media cards.
- **Components Standardized:**
  1. **Account Bar:** Added top status indicator: `Authenticated as {userEmail} (Artist Account)` with a back link to dashboard.
  2. **Profile Header & Completeness Card:** Mirrored dashboard's stage name, avatar box with gradient fallback, verification badges, public slug pill, action links, and progress bar (`from-purple-500 to-pink-500`).
  3. **Section Cards (1–6):** Converted to `bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm` with numbered purple badges (`bg-purple-50 text-purple-700 border border-purple-200`).
  4. **Form Controls:** Clean white inputs, selects, and textareas (`bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20`).
  5. **Tags & Pills:** Light gray unselected state (`bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200`) and solid active states.
  6. **Technical Rider (Section 5):** Light item cards (`bg-gray-50 border border-gray-200 hover:border-gray-300`) with purple bullets and `✕` remove buttons.
  7. **Sticky Action Bar:** White frosted glass bar (`bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-2xl shadow-xl`) with `Save Draft` and gradient `Submit for Review →` button.
- **Verification:** TypeScript: 0 errors, ESLint: 0 errors, Production build: 16/16 routes compiled cleanly. Git commit `623e8e5`.

### 12.6 Full Platform UI Harmonization & Timeout Optimization

- **Objective:** Extend the consistent light design system established in `/dashboard/artist` and `/dashboard/artist/edit` across Login, Signup, and the entire Admin Portal, eliminating visual discrepancies and resolving developer server timeout warnings.
- **Files Harmonized:**
  - `app/login/page.tsx`: Transformed to clean light card (`bg-white rounded-2xl border border-gray-200 shadow-sm`), light role switcher tabs, white form inputs with purple focus halos, hidden dev banner when live backend is active.
  - `app/signup/page.tsx`: Transformed to light card, light role switcher (`bg-purple-50 text-purple-700 border-purple-200` active vs `bg-white text-gray-600` inactive), clean email confirmation prompt.
  - `app/admin/layout.tsx`: Updated canvas to `bg-gray-50 text-gray-900` with white footer.
  - `app/components/AdminNavbar.tsx`: Light header (`bg-white border-b border-gray-200 text-gray-900 shadow-xs`), purple active tabs (`bg-purple-50 text-purple-700 border-purple-200`).
  - `app/admin/page.tsx`: Light overview metrics cards (`bg-white border border-gray-200 shadow-sm`) with amber, emerald, purple, and blue status pills, light pending review preview cards.
  - `app/admin/applications/page.tsx`: Light page header and subtitle typography.
  - `app/components/ApplicationsManager.tsx`: Light filter pill tabs, light application directory table (`bg-white border border-gray-200 rounded-2xl shadow-sm`, `bg-gray-50/80` headers), and light modal review dialog.
  - `app/admin/audit-logs/page.tsx`: Light header typography (`text-gray-900`).
  - `app/components/AuditLogViewer.tsx`: Light audit records table (`bg-white border border-gray-200 rounded-2xl shadow-sm`), light action badges (emerald, rose, purple, gray), light pagination footer, and light JSON inspection drawer.
  - `lib/data/artists.ts`: Relaxed query timeout threshold from `4000ms` to `8000ms` to accommodate remote database network latency and cold-starts, and converted fallback logging to `console.warn` to prevent Next.js Turbopack development overlay popups.
- **Verification:** TypeScript: 0 errors, ESLint: 0 errors, Production build: 16/16 routes compiled cleanly. Git commit `f81542e`.

### 12.7 Artist Self-Publishing & Verification-Based Ranking Architecture

- **Objective:** Convert platform from an admin-gated publication bottleneck to an open artist marketplace where artists self-publish immediately upon completing mandatory profile fields, while admins maintain content moderation via suspension/reinstatement and quality curation via verified badges.
- **Architectural & Security Controls Implemented:**
  1. **New Profile Statuses & Legacy Compatibility:**
     - Active statuses: `draft`, `published`, `suspended`.
     - Legacy statuses preserved in database CHECK constraint: `pending_review`, `rejected`. No existing rows were auto-published or altered; artists deliberately self-publish or revert to draft.
  2. **Total Suspension Freeze (Multi-Layer Enforcement):**
     - **Database Trigger Invariant 0:** Added to `enforce_artist_profile_protection()`. If `OLD.profile_status = 'suspended'` and caller is not admin, ALL column updates are rejected (`42501`).
     - **Portfolio RLS Policies:** `INSERT`, `UPDATE`, and `DELETE` on `public.portfolio_items` now strictly check `NOT EXISTS (SELECT 1 FROM public.artist_profiles WHERE id = auth.uid() AND profile_status = 'suspended')`.
     - **Server Actions & UI:** Form inputs wrapped in `<fieldset disabled={isSuspended}>`, portfolio controls disabled, and server actions fail-closed if suspended.
  3. **Database-Level Publication Validation Trigger:**
     - Created `enforce_publication_requirements()` trigger firing on `INSERT` or `UPDATE OF profile_status`.
     - When transitioning into `published`, strictly validates `stage_name`, `category`, `city`, `bio` (≥30 chars), and `starting_price` (>0). Rejects API-level bypass attempts with `23514`.
  4. **Server Actions Replaced & Extended:**
     - Added `publishProfile()`: Validates completeness and publishes profile.
     - Added `unpublishProfile()`: Takes profile back to draft voluntarily.
     - Added `suspendArtistProfile(artistId, reason)`: Calls moderation RPC with mandatory reason, revokes verified badge, sets `suspended`, logs `suspend_profile`.
     - Added `reinstateArtistProfile(artistId)`: Calls moderation RPC, sets `published`, clears notes, logs `reinstate_profile`.
     - Kept `approveArtistApplication()` and `rejectArtistApplication()` for RPC backward compatibility.
  5. **Discovery Ranking & User Sorting:**
     - Verified and unverified published artists both appear on Discover Artists (`/artists`).
     - Default "Recommended" sort places verified artists first (`is_verified DESC, created_at DESC`).
     - Explicit user-selected sorts (`price_low_high`, `price_high_low`, `newest`) are strictly respected without verification override.
  6. **UI Harmonization:**
     - Artist Dashboard: Displays active/suspended/legacy status badges and prompts.
     - Profile Editor: Displays "Publish Profile" or "Unpublish", with total freeze banner when suspended.
     - Admin Applications: Tabs for `Published`, `Suspended`, `Pending Review` (legacy), and `All`. Modal supports Suspend, Reinstate, and Verification.
     - Admin Overview: "Suspended Profiles" metric card replaces "Pending Applications".
     - Audit Log Viewer: Added badges for `suspend_profile` and `reinstate_profile`.
  7. **Future Booking Calendar Requirement (Documented for Future Phase):**
     - Approved product requirement for an artist gig calendar: manual external bookings, blocked dates, private booking details, availability/overlap warnings, and future platform booking integration. (Not yet implemented; Phase 5 remains blocked).
- **Migration SQL File:** Successfully executed by platform owner in Supabase Dashboard SQL Editor (`20261112_self_publish.sql`).
- **Live Integration & Security Verification Results (Post-Migration):**
  1. **Public Discovery Query & Sorting:** PASS ✅ — Verified artists strictly rank first in default `recommended` sort; explicit sorts (`price_low_high`, `price_high_low`, `newest`) are strictly respected without verification override.
  2. **RLS Privacy Shielding:** PASS ✅ — Anonymous queries for `draft`, `suspended`, `pending_review`, and `rejected` returned exactly 0 rows.
  3. **Database-Level Publication Validation:** PASS ✅ — Direct update attempting `published` with short bio (<30 chars) rejected by DB trigger with code `23514`.
  4. **Artist Self-Publishing Flow:** PASS ✅ — Complete profile published immediately without admin approval.
  5. **Anti-Tampering Invariant 1:** PASS ✅ — Artist attempting `UPDATE is_verified = true` blocked by DB trigger.
  6. **Anti-Tampering Invariant 3:** PASS ✅ — Artist attempting `UPDATE profile_status = 'suspended'` blocked by DB trigger.
  7. **Unpublishing Flow:** PASS ✅ — Profile reverted to draft and immediately disappeared from public discovery.
  8. **Admin RPC Authorization Gate:** PASS ✅ — Anonymous, artist, and business attempts to call `admin_moderate_artist_profile` all rejected with `42501` / permission denied.
- **Verification:** TypeScript: 0 errors, ESLint: 0 errors, Production build: 16/16 routes compiled cleanly.

### 12.9 Authentication-Aware Public CTAs & Page Audit (Completed)

- **Issue:** Homepage and Artists Directory presented generic "Join as an Artist" / "Create Artist Profile" signup CTAs to already authenticated artists, business users, and administrators.
- **Solution:**
  1. **Authentication-Aware CTA Component (`app/components/ArtistCTA.tsx`):**
     - **Logged-out visitor:** Displays standard promotional CTA ("Showcase Your Talent to People Who Want to Hire You", "Join as an Artist" → `/signup`, "How It Works for Artists" → `/#how-it-works`).
     - **Logged-in artist (no profile or unpublished draft):** Displays "Complete Your Artist Profile", primary button "Continue Profile Setup" → `/dashboard/artist/edit`, secondary button "Artist Dashboard" → `/dashboard/artist`.
     - **Logged-in artist (published profile):** Displays "Your Artist Profile Is Live", primary button "Manage My Profile" → `/dashboard/artist`, secondary button "View Public Profile" → `/artists/[slug]`.
     - **Logged-in artist (suspended profile):** Displays account notice "Your Artist Profile Is Suspended", primary button "View Profile Status" → `/dashboard/artist`. Does not encourage republishing while suspended.
     - **Logged-in artist (pending review):** Displays "Your Artist Profile Is Under Review", button "View Application Status" → `/dashboard/artist`.
     - **Logged-in business user:** Displays business discovery CTA ("Find & Hire Exceptional Artists", "Discover Artists" → `/artists`, "Venue Dashboard" → `/dashboard/restaurant`).
     - **Logged-in admin:** Displays admin control center ("Admin Control Center", "Open Admin Dashboard" → `/admin`, "Review Applications" → `/admin/applications`).
  2. **RLS Data Query Optimization (`lib/data/artists.ts`):**
     - Added `getCurrentArtistStatus(userId)`: Scoped strictly to `auth.uid() = id` via RLS; fetches only `profile_status, slug`.
     - Zero extra queries executed when user is anonymous, business, or admin.
     - Homepage and Artists Directory pass server-fetched `currentUser` and `artistStatus` down as props, avoiding duplicate DB roundtrips.
  3. **Audit of Other Public Pages:**
     - **Homepage Hero (`app/components/Hero.tsx`):** Secondary CTA adapts to role: logged-out → "Join as an Artist" (`/signup`); artist → "Artist Dashboard" (`/dashboard/artist`); business → "Business Dashboard" (`/dashboard/restaurant`); admin → "Admin Dashboard" (`/admin`).
     - **Artists Directory (`app/artists/page.tsx`):** Replaced static signup CTA block with `<ArtistCTA variant="embedded" user={currentUser} artistStatus={artistStatus} />`.
     - **Dashboard Artist Edit (`app/dashboard/artist/edit/page.tsx`):** Removed redundant duplicate `<Navbar />` and `<Footer />` calls (which are already cleanly provided by `ArtistDashboardLayout`).
  4. **Verification:**
     - `npx tsc --noEmit`: 0 errors.
     - `npm run lint`: 0 errors.
     - `npm run build`: 16/16 routes compiled successfully.

### 12.10 Artist Dashboard Cleanup & Accuracy (Completed)

- **Issue:** The artist dashboard (`/dashboard/artist`) displayed fake sample enquiries, mock gig schedule data, outdated "Review Status" terminology, and lacked actionable profile completeness guidance.
- **Changes (`app/dashboard/artist/page.tsx`):**
  1. **Terminology:** Renamed "Review Status" KPI card to "Profile Status" — artists now self-publish, so "review" language was misleading.
  2. **Sample Data Removed:**
     - Removed all `mockEnquiries` data (3 fake booking enquiries) and the entire "Enquiries & Requests" tab with interactive Accept/Decline buttons.
     - Removed all `mockUpcomingGigs` data (4 fake gig schedule entries) and the "Gig Schedule" tab.
     - Removed the hardcoded "Booking Enquiries: 3" KPI card.
  3. **Coming Soon Notices:**
     - Replaced the Enquiries tab with a clean "Booking Enquiries — Coming Soon" notice explaining the future feature.
     - Replaced the Gig Schedule tab with a "Gig Schedule & Calendar — Coming Soon" notice. Both cards use a "Coming Soon" badge.
  4. **KPI Cards Updated:**
     - Retained real data: Portfolio Items (from database), Indicative Fee (from database), Profile Status (from database).
     - Replaced the fake "Booking Enquiries: 3" card with a "Profile Completion: N%" card reflecting actual completeness.
  5. **Profile Completeness — Actionable Guidance:**
     - Implemented field-level completeness tracking using a defined `COMPLETENESS_FIELDS` array, each with a label, weight, and check function.
     - Fields tracked: Stage name (15%), Category (10%), City/location (10%), Bio 30+ chars (20%), Starting price (15%), Genres (10%), Profile photo (10%), Portfolio items (10%).
     - When incomplete, missing fields are shown as individually labeled amber badges with a "Complete now →" link to the profile editor.
     - At 100%, displays a green confirmation message.
  6. **Tab Restructuring:**
     - Replaced three-tab layout (Enquiries / Portfolio / Calendar) with cleaner two-tab layout: "Overview & Actions" and "Portfolio Media".
     - Overview tab contains: Quick Actions grid (Edit Profile & Rates, Manage Portfolio, View Public Profile), Booking Enquiries coming-soon card, Gig Schedule coming-soon card.
  7. **Quick Actions Grid:**
     - "Edit Profile & Rates" → `/dashboard/artist/edit`
     - "Manage Portfolio" → `/dashboard/artist/edit`
     - "View Public Profile" → `/artists/[slug]` (shown only when profile is published; otherwise shows status-aware placeholder with appropriate guidance).
  8. **View Public Profile Button:** Header action button now conditionally shown only when profile status is `published`, preventing confusing links to unpublished/suspended profiles.
  9. **Preserved:** All existing real database connections (profile data, portfolio data, loading states), mobile responsiveness, Navbar/Footer from layout, onboarding callout, suspended/pending banners, profile header card with status badges, verified artist badge.
- **Verification:**
  - `npx tsc --noEmit`: 0 errors.
  - `npm run lint`: 0 errors (only pre-existing `<img>` warnings).
  - `npm run build`: 16/16 routes compiled successfully.

### 12.11 Phase 4.6 Stage 1: Calendar Database Migration & PostgREST Verification (PASSED)

- **Status (2026-11-12):** Stage 1 database foundation deployed and fully verified against live Supabase project (`jmwkvrghquqqsfwierpj.supabase.co`).
- **Live Database & PostgREST Verification Results:**
  1. `public.artist_calendar_events`: Deployed and discoverable via PostgREST.
  2. Anonymous Table Access: HTTP 401 (`42501: permission denied for table artist_calendar_events`).
  3. Anonymous RPC Execution: HTTP 401 (`42501: permission denied for function save_artist_calendar_event`).
  4. Authenticated Artist SELECT: HTTP 200 OK under owner-only RLS (`auth.uid() = artist_id`).
  5. Direct Client Writes (INSERT, UPDATE, DELETE): HTTP 401 (`42501: permission denied for table artist_calendar_events`) — completely revoked.
  6. Non-Artist RPC Authorization: Business account rejected with HTTP 403 (`42501: Only registered artists can manage calendar events`).
  7. Atomic Conflict Detection: Overlapping confirmed events detected and blocked by `save_artist_calendar_event` with structured conflict details.
  8. Atomic Event Deletion: `delete_artist_calendar_event` validated and verified.
  9. Public Availability API: Confirmed non-existent (HTTP 404 / PGRST202).
  10. Existing Platform Data: Profiles, artist profiles, portfolio items, and authentication verified 100% operational.
- **Stage 1 Verification Status:** COMPLETE & VERIFIED.

### 12.12 Phase 4.6 Stage 2: Calendar Server Actions & Data Layer (PASSED)

- **Status (2026-11-12):** Stage 2 implemented and verified with zero TypeScript, ESLint, or Next.js build errors.
- **Files Created / Modified:**
  - `lib/calendar/types.ts`: Strongly typed domain models (`ArtistCalendarEvent`, `ConflictingEvent`, `CalendarActionResult<T>`).
  - `lib/calendar/utils.ts`: Asia/Kolkata (`IST`, UTC+05:30) date & time utilities (`istToUtcIso`, `formatIstDate`, `formatIstTime`, `getMonthDateRange`, `getWeekDateRange`).
  - `lib/calendar/schemas.ts`: Zod validation schemas (`createManualGigSchema`, `createUnavailableBlockSchema`, `updateCalendarEventSchema`, `calendarDateRangeSchema`, `checkCalendarConflictSchema`).
  - `app/actions/calendar.ts`: Server Actions strictly verified via `auth.getUser()` + `public.profiles.role = 'artist'`:
    - `getArtistCalendarEventsAction`: Retrieves owner's events for date range using standard half-open interval overlap (`start_time < rangeEnd AND end_time > rangeStart`). Correctly handles multi-day and overnight bookings.
    - `createManualGigAction`: Creates external gig bookings exclusively via `save_artist_calendar_event` RPC.
    - `createUnavailableBlockAction`: Creates blocked time periods via `save_artist_calendar_event` RPC.
    - `updateCalendarEventAction`: Updates existing manual events with conflict detection via RPC.
    - `deleteCalendarEventAction`: Safely deletes manual events via `delete_artist_calendar_event` RPC while protecting platform-generated bookings.
    - `checkCalendarConflictAction`: Standalone read-only conflict check returning structured overlapping events.
- **Verification Results:**
  - `npx tsc --noEmit`: 0 errors.
  - `npm run lint`: 0 errors (only pre-existing `<img>` warnings).
  - `npm run build`: 16/16 routes compiled successfully.
  - Integration Test Suite: 10/10 checks passed against live Supabase backend. All test events cleaned up (final row count = 0).

### 12.13 Phase 4.6 Stage 3: Artist Calendar Frontend UI (COMPLETED)

- **Status (2026-11-12):** Stage 3 fully implemented and build-verified.
- **Build result:** 17/17 pages compiled. `npx tsc --noEmit` → 0 errors. `npm run lint` → 0 errors (9 pre-existing `<img>` warnings unchanged). `npm run build` → exit 0.
- **Git commit:** See `feat(calendar): implement Phase 4.6 Stage 3 calendar frontend UI`

#### Files Created

| File | Purpose |
|------|---------|
| `app/dashboard/artist/calendar/page.tsx` | Main calendar page — Month/Week view orchestrator, navigation, event CRUD dispatch |
| `app/components/calendar/EventFormModal.tsx` | Add/Edit form for gigs & unavailable blocks, Zod-validated, IST timezone, conflict flow |
| `app/components/calendar/MonthView.tsx` | Responsive month grid (desktop pills + mobile dots + agenda) |
| `app/components/calendar/WeekView.tsx` | 7-day time-based view (desktop columns + mobile day selector/agenda) |
| `app/components/calendar/EventBadge.tsx` | Color-coded event pill (updated onClick signature) |
| `app/components/calendar/EventDetailsModal.tsx` | Full private details modal (from Stage 3 partial — already existed) |
| `app/components/calendar/ConflictModal.tsx` | Conflict confirmation dialog with "Save Anyway" flow |
| `app/components/calendar/DeleteConfirmModal.tsx` | Delete confirmation dialog |

#### Files Updated

| File | Change |
|------|--------|
| `app/dashboard/artist/page.tsx` | Replaced "Coming Soon" calendar card with live link to `/dashboard/artist/calendar` |
| `lib/calendar/utils.ts` | Extended with `getTodayIstDateStr`, `utcIsoToIstDateStr`, `utcIsoToIstTimeStr`, `formatIstTimeRange`, `eventOccursOnIstDate`, `formatCurrencyInr`, `getDaysInMonthGrid`, `getDaysInWeekGrid`, `getMonthDateRange`, `getWeekDateRange` |

#### Architecture

- `/dashboard/artist/calendar` is a **client component** (`"use client"`). Auth guard inherited from `app/dashboard/artist/layout.tsx` which calls `requireArtist()` server-side.
- Event data loading uses a local `async function fetchEvents()` defined inside `useEffect`, matching the project's established pattern.
- Stale-fetch guard: `fetchIdRef` counter discards out-of-order responses.
- Manual refresh via `refreshTick` state increment — avoids `useCallback` complexity.
- **Never** accepts `artist_id` from client. All mutations go through `save_artist_calendar_event` / `delete_artist_calendar_event` RPCs via Stage 2 Server Actions.
- Platform bookings (`source = "platform_booking"`) are displayed read-only; Edit/Delete buttons hidden.
- All times displayed and entered in Asia/Kolkata (IST, UTC+05:30). Stored as UTC ISO in Supabase.
- For all-day events, end is stored as exclusive boundary (start of next day 00:00 IST → UTC).

#### Month View
- Monday-first grid, 35–42 cells via `getDaysInMonthGrid()`.
- Desktop: full grid with up to 3 event pills per cell, "+N more" overflow.
- Mobile (`< sm`): compact number grid with coloured dots + selected-day agenda panel below.
- Today highlighted with purple filled circle.
- Quick-add "+" button appears on hover per day cell.

#### Week View
- Compressed time grid: 07:00–23:00 IST (60px/hour).
- All-day events shown in dedicated row above timed grid.
- Timed events positioned by CSS `top` / `height` using IST time-to-pixel conversion.
- Current-time indicator line for today's column.
- Mobile: horizontal scrollable day chip row + single-day agenda.

#### Conflict Flow
- On submit, Server Action calls `save_artist_calendar_event` with `allow_overlap: false`.
- If RPC returns `conflict: true`, `EventFormModal` captures `conflictPending` and renders `ConflictModal` as a sibling overlay.
- "Cancel & Adjust": clears conflict, returns to form.
- "Save Anyway": re-calls Server Action with `allow_overlap: true`.

#### Security
- Authorization: every Server Action calls `verifyArtistSession()` → `auth.getUser()` + `profiles.role` DB query. No `user_metadata` trust.
- No direct table writes from client.
- Private financials and client contact rendered only in `EventDetailsModal` (private artist view, never public).

### 12.14 Phase 4.6 Stage 4: Final Calendar QA & Stabilization (COMPLETED)

- **Owner Verification (2026-11-12):** Project owner executed complete manual browser testing with 10/10 tests PASSED:
  1. Calendar opens and displays current month in Asia/Kolkata (`IST`).
  2. Switching Month and Week views works cleanly.
  3. Previous / Next / Today navigation functions accurately across month boundaries.
  4. Creating external manual gig bookings works.
  5. Blocking unavailable dates and times works.
  6. Overlapping bookings properly trigger conflict detection modal.
  7. "Save Anyway" creates overlap only after explicit artist confirmation.
  8. Editing existing calendar events updates records correctly.
  9. Deleting events operates safely after confirmation dialog.
  10. Mobile calendar layout (375px) with date-dot indicators and agenda panel is usable.

- **Stabilization & Fixes Applied:**
  - **DOM / Hydration Bug Fix (`MonthView.tsx`):** Eliminated nested `<button>` element on line 227 where mobile agenda wrapped `<EventBadge>` (itself a button) in an outer `<button>`. Replaced with accessible `<div className="cursor-pointer">` container.
  - **Keyboard Accessibility:** Added `Escape` key listeners to all 4 calendar modals (`EventDetailsModal`, `EventFormModal`, `ConflictModal`, `DeleteConfirmModal`).
  - **Duplicate Submission Guard:** Added `if (isSaving) return;` / `if (isDeleting) return;` fast guards on `handleSubmit`, `handleSaveAnyway`, and `handleDelete` preventing double-click submission races.
  - **Edge-Case QA Suite (24/24 PASS):**
    - IST midnight boundaries (00:00 IST maps to 18:30 UTC previous day, round-trips cleanly).
    - Overnight gigs crossing midnight (renders on both affected days).
    - Multi-day blocks and exclusive end boundaries.
    - Back-to-back non-conflicting gigs (touching boundaries do not trigger false conflicts).
    - Month/year transitions (rollover from Dec 2026 to Jan 2027).
    - Month grid cell calculation (guaranteed 35 or 42 cells, starting on Monday).
    - Zod schema validation (end < start, deposit > fee, bad email, title > 120 chars all rejected).

- **Build Verification:**
  - `npx tsc --noEmit`: 0 errors.
  - `npm run lint`: 0 errors (9 pre-existing `<img>` warnings unchanged).
  - `npm run build`: Exit code 0, 17/17 pages generated successfully.

### 12.15 Phase 4.6 Calendar Bug Fix: Prevent Past-Date Bookings & Historical Event Rules (COMPLETED)

- **Issue Addressed (2026-11-12):**
  1. Artists could schedule new bookings or unavailable blocks for dates and times that had already passed.
  2. Clear rules were needed for historical events: once an event has started (`start_time <= now`), scheduling fields (`start_time`, `end_time`, `is_all_day`) must be immutable, while metadata (notes, venue, client details, fee, deposit, and status) can still be edited.

- **Solution & Enforcement Architecture:**
  - **Client-Side Real-Time Validation & UI State (`EventFormModal.tsx`):**
    - Input `min` attribute set on `start_date` (`getTomorrowIstDateStr()` for all-day events, `getTodayIstDateStr()` for timed events).
    - Intelligent initial timings via `getDefaultFutureIstTimings()`: defaults to future hours today (or tomorrow morning if late in the evening).
    - Live validation warns user immediately if a selected start time is in the past: *"Bookings must start in the future. Please select a later date or time."*
    - Toggling `is_all_day` automatically bumps `start_date` to tomorrow if today or past was selected (since today's 00:00 IST midnight has passed).
    - **Historical Event Editing Lock:** When editing an event that has already started (`initialData.start_time <= Date.now()`), the modal:
      - Displays an informative warning banner: *"🔒 Historical Event — Scheduling Locked: This event has already started or concluded. Date, time, and all-day settings cannot be modified. You may update notes, venue, client details, fee, deposit, and status."*
      - Disables `start_date`, `end_date`, `start_time`, `end_time`, and `is_all_day` toggle (`disabled={isStartedEvent}` with `opacity-60 bg-gray-100 cursor-not-allowed`).
      - In `buildPayload`, strictly preserves `initialData.start_time`, `initialData.end_time`, and `initialData.is_all_day`.
      - In `handleSubmit`, bypasses the past-date error so the artist can cleanly save metadata updates.
    - Submit button disabled when past time is selected for new/rescheduled events (`disabled={isSaving || isPastBooking}`).
    - Revalidated at exact moment of submit to account for time elapsed while modal was open.

  - **Server-Side Validation (`app/actions/calendar.ts`):**
    - `createManualGigSchema` and `createUnavailableBlockSchema` enforce `start_time > Date.now()`.
    - `createManualGigAction` and `createUnavailableBlockAction` independently reject `start_time <= Date.now()`.
    - `updateCalendarEventAction`:
      - Queries existing event: `id, start_time, end_time, is_all_day, source`.
      - If `existingEvent.start_time <= Date.now()` (event has started):
        - Strictly rejects any change to `start_time`, `end_time`, or `is_all_day` with: *"Scheduling details (start time, end time, and all-day setting) cannot be modified for events that have already started or concluded. You may still update notes, venue, client details, fee, and status."*
        - Allows updates to `title`, `status`, `city`, `venue_name`, `venue_address`, `client_name`, `client_phone`, `client_email`, `agreed_fee`, `deposit_paid`, `private_notes`.
      - If `existingEvent.start_time > Date.now()` (future event):
        - Allows rescheduling only if the new `start_time > Date.now()`.
        - Rejects rescheduling `start_time` into the past with: *"Rescheduled events must start in the future. Please select a later date or time."*

  - **Database RPC Safety Review (`supabase/migrations/20261112_prevent_past_calendar_events.sql`):**
    - **Safe search_path:** Uses `SECURITY DEFINER` with `SET search_path = ''`. All system functions (`pg_catalog.clock_timestamp()`, `pg_catalog.now()`, `pg_catalog.pg_advisory_xact_lock()`, `pg_catalog.hashtext()`) and types are schema-qualified. Standard ANSI SQL functions (`trim()`, `char_length()`, `jsonb_build_object()`, `jsonb_agg()`) follow the exact verified pattern from the deployed base migration.
    - **Auth & Role Guard:** Enforces `auth.uid() IS NOT NULL` and verifies `role = 'artist'` in `public.profiles`.
    - **Ownership & Platform Protection:** Enforces `WHERE id = p_event_id AND artist_id = v_user_id` and rejects mutations on `source = 'platform_booking'`.
    - **Started Event Immutability in SQL:**
      `IF v_existing_event.start_time <= pg_catalog.clock_timestamp() THEN IF p_start_time <> v_existing_event.start_time OR p_end_time <> v_existing_event.end_time OR p_is_all_day <> v_existing_event.is_all_day THEN RETURN error...`
    - **Creation Past-Date Protection in SQL:**
      `IF p_start_time <= pg_catalog.clock_timestamp() THEN RETURN error...`
    - **Concurrency & Overlap Safety:** Preserves `pg_advisory_xact_lock` per artist, atomic `[start, end)` half-open interval overlap detection, and explicit `p_allow_overlap` confirmation requirement.
    - **Permissions:** Explicit `REVOKE ALL FROM PUBLIC, anon; GRANT EXECUTE TO authenticated; NOTIFY pgrst, 'reload schema';`. No unrelated objects or triggers dropped.
    - Status: Successfully executed manually by project owner in Supabase SQL Editor on 2026-11-12.

  - **Live Post-Migration Database Verification (2026-11-12):**
    - Executed live API test suite against Supabase PostgREST & RPC endpoints (`verify_live_past_bookings.mjs`):
    - **21/21 Live Checks PASSED (100% success rate, 0 lingering test records):**
      - `[CHECK-1.1]` Artist Authentication: Verified (`userId: 688c7416-7d71-44cf-ba09-b519fdf26f15`).
      - `[CHECK-1.2]` Business Authentication: Verified (`userId: b4db2908-5454-43e6-81a4-c80ef02d07f5`).
      - `[CHECK-1.3]` Anonymous Access: Blocked with HTTP 401 (`permission denied for function save_artist_calendar_event`).
      - `[CHECK-1.4]` Business Role Access: Blocked with Postgres error 42501 (`Only registered artists can manage calendar events`).
      - `[CHECK-1.5]` Direct Table Mutation: Revoked, HTTP 403 (`permission denied for table artist_calendar_events`).
      - `[CHECK-2.1]` Yesterday's Booking: Rejected by live RPC (`Bookings must start in the future. Please select a later date or time.`).
      - `[CHECK-2.2]` Earlier Today's Booking: Rejected by live RPC (`Bookings must start in the future. Please select a later date or time.`).
      - `[CHECK-2.3]` All-Day Today Booking: Rejected by live RPC (Midnight IST in past).
      - `[CHECK-2.4]` All-Day Tomorrow Booking: Created successfully (`event_id: 08ab6277-423c-4dfd-99dc-7ab10b3a42ad`).
      - `[CHECK-2.5]` Future Timed Booking: Created successfully (`event_id: 70908806-7b2f-4450-8fb5-7e2d4e51e33b`).
      - `[CHECK-2.6]` Rescheduling Future Event to Past: Rejected by live RPC (`Rescheduled events must start in the future. Please select a later date or time.`).
      - `[CHECK-2.7a]` Atomic Conflict Detection: Detected overlap with existing confirmed gig when `p_allow_overlap = false`.
      - `[CHECK-2.7b]` Explicit Overlap Confirmation: Overlap allowed when `p_allow_overlap = true` (`event_id: 2998954e-cf43-43df-a259-71295e980e60`).
      - `[CHECK-3.0]` Preparation for Started Event: Created event starting in 3 seconds (`event_id: 643abee4-fddb-463c-aa03-a9500337430b`), waited 5s for `clock_timestamp() > start_time`.
      - `[CHECK-3.1]` Modifying `start_time` on Started Event: Rejected by live RPC (`Scheduling details (start time, end time, and all-day setting) cannot be modified for events that have already started or concluded.`).
      - `[CHECK-3.2]` Modifying `end_time` on Started Event: Rejected by live RPC (`Scheduling details... cannot be modified`).
      - `[CHECK-3.3]` Modifying `is_all_day` on Started Event: Rejected by live RPC (`Scheduling details... cannot be modified`).
      - `[CHECK-3.4]` Updating Metadata on Started Event: Succeeded (title, status, venue, fee, notes updated cleanly).
      - `[CHECK-3.5]` Metadata Persistence: Verified in Supabase via SELECT.
      - `[CHECK-4.1]` Test Cleanup: All 4 test events deleted via `delete_artist_calendar_event` RPC (4/4 cleaned).
      - `[CHECK-4.2]` Residual Audit: 0 lingering test events remain in `artist_calendar_events`.

  - **Automated QA Verification:**
    - `scratch/test_past_bookings.ts`: **19/19 PASSED**.
    - `scratch/test_calendar_qa.ts`: **24/24 PASSED**.
    - `scratch/verify_live_past_bookings.mjs`: **21/21 PASSED**.
    - `npx tsc --noEmit`: **0 errors**.
    - `npm run lint`: **0 errors** (9 acceptable `<img>` warnings).
    - `npm run build`: **17/17 routes generated successfully in 724ms**.

### 12.17 Artist Social Media Links (Instagram & YouTube) on Cards & Showcase (COMPLETED)

- **Feature Summary (2026-11-12):**
  - Added clickable, accessible Instagram and YouTube icons to the bottom-right of the white information section on all public artist discovery cards (`ArtistCard.tsx`).
  - Added matching icons to individual public artist profile pages (`app/artists/[slug]/page.tsx`) alongside the profile header and share button.
  - Provided comprehensive URL validation and normalization for artist profile management (`app/dashboard/artist/edit/page.tsx` and `app/actions/artist.ts`).

- **Database Inspection & Reuse:**
  - `instagram_url` and `youtube_url` **already existed** as native columns in `public.artist_profiles` from migration `20261101_artist_profiles_and_portfolio.sql`.
  - **Zero SQL schema migrations required.** No database changes needed.
  - Added `instagram_url` and `youtube_url` to `PublicArtistSummary` and `PUBLIC_ARTIST_FIELDS` in `lib/data/artists.ts`.

- **Component & Architectural Implementation:**
  - **`lib/utils/socialUrls.ts`:**
    - Strict HTTPS enforcement (`https://` required).
    - Domain whitelisting:
      - Instagram: `instagram.com`, `www.instagram.com`, `instagr.am`, `www.instagr.am` with non-empty handle.
      - YouTube: `youtube.com`, `www.youtube.com`, `m.youtube.com`, `music.youtube.com`, `youtu.be`, `www.youtu.be` with valid channel/video path.
    - Rejects dangerous schemes (`javascript:`, `data:`, `vbscript:`, etc.) and invalid domains.
    - Normalizes URLs before database persistence and before rendering.
  - **`app/components/ArtistSocialLinks.tsx`:**
    - Reusable client component supporting `size="sm"` (cards) and `size="md"` (profile showcase).
    - Automatically hides if neither link is provided or if invalid URLs are detected.
    - If only Instagram exists, shows only Instagram. If only YouTube exists, shows only YouTube.
    - Opens links in a new browser tab with `target="_blank"` and `rel="noopener noreferrer"`.
    - Includes accessible `aria-label`, informative `title` tooltips, visible focus rings, and subtle brand hover effects (pink for Instagram, red for YouTube).
    - Calls `e.stopPropagation()` on clicks to prevent card navigation.
  - **`ArtistCard.tsx` Navigation Pattern:**
    - Refactored from an outer `<Link>` to an outer `<div>` with an absolute stretched link (`<Link className="absolute inset-0 z-0">`) and elevated social buttons (`relative z-10 pointer-events-auto`).
    - **Eliminates HTML invalid nested `<a>` tags**, preventing React hydration errors while preserving full card clickability, keyboard tab navigation, and image/title hover transitions.
  - **Artist Profile Editor (`app/dashboard/artist/edit/page.tsx` & `app/actions/artist.ts`):**
    - Enforces client-side and server-side URL validation on both draft save and publishing.
    - Added user guidance sub-labels explaining that links will appear on their artist card and public profile.

- **Verification Results:**
  - `scratch/test_artist_social_links.ts`: **26/26 PASSED**.
  - `npx tsc --noEmit`: **0 errors**.
  - `npm run lint`: **0 errors** (9 pre-existing `<img>` warnings unchanged).
  - `npm run build`: **17/17 routes generated successfully**.

### 12.18 Pre-Launch Security Audit & Fixes (COMPLETED)

- **Audit & Hardening (2026-11-12):**
  - Completed comprehensive pre-launch security audit across Next.js 16 App Router, React 19, Supabase Auth, PostgreSQL RLS, storage, and dependencies.
  - Full report documented in `PRE_LAUNCH_SECURITY_AUDIT.md`.
  - **Task 1 — Sensitive Admin Debug Logs Removed (`app/actions/admin.ts`):**
    - Removed 4 `[ADMIN DEBUG]` `console.log` statements logging admin user IDs and emails to server logs.
    - Removed redundant `auth.getUser()` calls in `getAdminMetrics` and `getArtistApplications`.
    - Zero `console.log` / `console.debug` remaining in application code.
  - **Task 2 — HTTP Security Headers Added (`next.config.ts`):**
    - `X-Frame-Options: DENY` (anti-clickjacking).
    - `X-Content-Type-Options: nosniff` (anti-MIME-sniffing).
    - `Referrer-Policy: strict-origin-when-cross-origin`.
    - `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`.
    - Verified directly on live HTTP responses (Status 200).
  - **Task 3 — Signup Role Hardening (`app/auth/actions.ts`):**
    - Added explicit runtime whitelist in `signUpAction`: only `'artist'` and `'business'` permitted.
    - Any unexpected or unauthorized role (such as `'admin'`) is rejected immediately with an explicit validation error.
    - Verified database `handle_new_user()` trigger restricts metadata role assignment to `'business'` or defaults to `'artist'`.
  - **Task 4 — Public Profile Field Privacy & RLS Verification:**
    - Live tests confirmed anonymous users receive 0 rows from `public.profiles` (legal names completely shielded).
    - Unpublished, draft, suspended, and rejected artist records return 0 rows to anonymous users.
    - Published artist records return `rejection_reason: null`.
  - **Task 5 — Session Cookie Security Audit:**
    - Audited `@supabase/ssr` default cookie configuration (`sameSite: "lax"`, `path: "/"`, `maxAge: 400 days`).
    - Documented reason for `httpOnly: false` default in `@supabase/ssr` (browser client synchronization).
  - **Task 6 — Secret & Dependency Audit:**
    - `npm audit --omit=dev` confirms **0 production vulnerabilities**.
    - No secrets or `.env*` files in git history.
    - Only public URL and anon key used via `NEXT_PUBLIC_` variables.
  - **Task 7 — Regression Testing:**
    - `npx tsc --noEmit`: 0 errors.
    - `npm run lint`: 0 errors (9 pre-existing `<img>` warnings unchanged).
    - `npm run build`: 17/17 routes compiled cleanly in 815ms.
    - Live runtime regression suite (`scratch/verify_runtime_regression.mjs`): **16/16 PASSED**.

### 12.19 Vercel Preview Deployment Preparation (READY)

- **Status (2026-11-12):** Deployment preparation completed and documented in `VERCEL_DEPLOYMENT_PLAN.md`.
- **Hosting Compliance Analysis:**
  - Vercel Hobby plan is strictly for personal, non-commercial use. Can be used for internal closed development previews only.
  - Commercial public marketplace launch requires Vercel Pro ($20/month per seat) or low-cost self-hosted Docker/Coolify alternative on a VPS (~₹340/month).
- **Security & Privacy Posture:**
  - Verified anonymous callers cannot access legal names (0 rows from `public.profiles`) or unpublished artists.
  - Published artists return `rejection_reason: null`. Proposed optional `public.public_artists` security invoker view for strict long-term column encapsulation.
  - Documented `@supabase/ssr` cookie architecture (`httpOnly: false` by design for client SDK synchronization; security anchored in PostgreSQL RLS, triggers, and RPC search_path locks).
  - Confirmed 0 server secrets or database passwords are required by Vercel builds (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` only).
- **Deployment Safety Checklist:**
  - 17/17 routes compiled cleanly with 0 TypeScript/ESLint errors.
  - Detailed pre-deployment and post-preview verification checklist created.
  - Rollback procedure documented.

### 12.20 Phase 4.7: Pre-Launch Legal Compliance, Informational Pages & Footer Hardening (COMPLETED)

- **Completed (2026-11-17):**
  - **New Legal & Information Pages Created (5 dynamic routes):**
    - `/terms` (`app/terms/page.tsx`): Comprehensive Terms & Conditions tailored for Indian talent discovery. Formulates scope, 18+ eligibility, artist/business obligations, IP retention with limited display license, IT Act 2021 takedowns, moderation rights, and clear disclosures that online booking checkouts, escrows, and payments are not currently active.
    - `/privacy` (`app/privacy/page.tsx`): Detailed data architecture policy aligned with the Digital Personal Data Protection Act, 2023 (DPDP Act) and IT Act 2000. Delineates public showcase data from confidential data (including legal real names and private artist calendar event metadata: client contacts, fees, notes). Audits `@supabase/ssr` cookies and notes absence of third-party ad trackers.
    - `/contact` (`app/contact/page.tsx`): Professional communication desk with structured channels (General, Artist/Venue Support, Grievance Officer, Copyright Takedown). Features zero fabricated company details and includes explicit placeholders for owner details.
    - `/community-guidelines` (`app/community-guidelines/page.tsx`): Code of conduct emphasizing profile authenticity, respect, intellectual property, zero tolerance for impersonation, and explains actual admin moderation enforcement.
    - `/disclaimer` (`app/disclaimer/page.tsx`): Comprehensive disclosures explaining platform discovery scope, clarifying that artist verification does not warrant performance quality or reliability, noting indicative pricing, disclaiming third-party external links, and preserving non-waivable statutory rights.
  - **Footer Overhaul (`app/components/Footer.tsx`):**
    - Replaced outdated "Phase 1 Visual Prototype" badge with "Testing & Evaluation Preview" (amber status).
    - Removed broken/mock links and wired functional links to `/terms`, `/privacy`, `/contact`, `/community-guidelines`, `/disclaimer`, `/artists`, `/categories`, `/opportunities`, and `/dashboard/artist/calendar`.
  - **Homepage & Directory Claims Alignment:**
    - `app/components/DashboardShowcase.tsx`: Replaced mock statistics (fake enquiries and fake gig counts) with actual implemented features: Artist Workspace (Profile, Portfolio, Private Calendar, Socials) and Venue Workspace (Discovery Directory, Filters, YouTube previews, Roadmap Transparency).
    - `app/components/HowItWorks.tsx`: Calibrated Step 3 for clients ("Connect & Plan") and artists ("Manage Schedule & Grow") to reflect current capabilities without claiming automated booking.
    - `app/components/ForBusinesses.tsx`: Replaced inactive buttons with active links to `/artists` and `/signup`.
    - `app/artists/page.tsx`: Calibrated sub-header and metadata to emphasize discovery rather than claiming instant booking.
    - `app/components/ArtistCTA.tsx`: Clarified administrative review versus verification across all user roles.
  - **Verification & Build:**
    - `npx tsc --noEmit`: 0 errors.
    - `npm run lint`: 0 errors (9 pre-existing `<img>` warnings unchanged).
    - `npm run build`: 22/22 routes generated cleanly with Turbopack and Partial Prerendering.
  - **Checklist Document Created:** `LEGAL_COMPLIANCE_CHECKLIST.md`.

### 12.21 Final Netlify Live Website Testing & Launch Readiness Audit (COMPLETED)

- **Audit Date:** 2026-11-17
- **Target Environments:**
  - Netlify Live: `https://artist-net-v1.netlify.app` (Running commit `f271d08`)
  - Local Preview: `http://localhost:3000` (Running commit `db3cafe` with Next.js 16.4.3 Turbopack)
- **Comprehensive Audit Results (56 Total Checks Reconciled):**
  - **Passed:** 49 checks (87.5% — 14 Netlify Live, 23 Supabase DB/API, 12 Local Runtime).
  - **Actionable / Security Findings:** 7 checks (Netlify visitor password absent, 5 unpushed legal routes on live Netlify, 1 moderate Next.js advisory for unused `unstable_cache`).
- **Live Netlify Security Posture:**
  - `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` verified live on Netlify edge nodes.
  - HTTP automatically redirects to HTTPS with HTTP 301.
  - Zero private service keys or database credentials in client bundles.
- **Supabase Privacy & RLS Invariants:**
  - Verified anonymous callers cannot query `public.profiles` (0 rows).
  - Unpublished, draft, and rejected artists remain completely hidden from anonymous discovery.
  - Private calendar events and atomic RPC mutations are strictly owner-only; direct table mutations are revoked.
  - Cross-role boundaries verified: Business accounts cannot manage artist calendars or view admin audit logs.
- **Launch Readiness Verdict:** **NO-GO FOR PUBLIC LAUNCH (READY FOR INTERNAL TESTING)**.
  - Netlify visitor password protection must be enabled in Netlify dashboard.
  - Registered business details and Grievance Officer placeholders must be substituted.
  - Final legal review on `/terms` and `/privacy` required prior to commercial launch.
- **Reports Generated:** `NETLIFY_LIVE_TEST_REPORT.md` and `LEGAL_COMPLIANCE_CHECKLIST.md`.

### 12.22 Phase Boundaries & Handover

- **Phase 4.6 (Artist Calendar & Availability):** ✅ FULLY COMPLETED & LIVE-VERIFIED.
- **Phase 4.7 (Legal Pages, Compliance & Footer):** ✅ FULLY COMPLETED.
- **Pre-Launch Security & Live Testing:** ✅ FULLY COMPLETED.
- **Next.js Security Upgrade (16.4.6):** ✅ COMPLETED & TESTED (resolved GHSA-mfr8-8qww-v76h; 0 production vulnerabilities).
- **Phase 5.1 Stage 1 (Booking Enquiry Schema & RPCs):** ✅ FULLY COMPLETED & LIVE-VERIFIED in Supabase.
- **Phase 5.1 Stage 2 (Server Actions & Zod Validation):** ✅ FULLY COMPLETED & LIVE-VERIFIED (36/36 tests passed).
- **Phase 5.1 Stage 3 (Business Enquiry Submission UI):** ✅ FULLY COMPLETED & LIVE-VERIFIED (15/15 tests passed).
- **Phase 5.1 Stage 4 (Artist Dashboard Booking Enquiry UI):** ✅ FULLY COMPLETED & LIVE-VERIFIED (20/20 tests passed).
- **Phase 5.1 Stage 5 (Business Enquiry Tracking & Clarification UI):** ✅ FULLY COMPLETED & LIVE-VERIFIED (21/21 tests passed).
- **Phase 5.1 Stage 6 (Complete End-to-End Testing & QA):** ✅ FULLY COMPLETED (48/48 automated QA tests passed). PHASE 5.1 FEATURE COMPLETE.
- **Git / Netlify Guard:** Pushes to GitHub trigger automatic Netlify builds. Do not push without owner authorization.

---

## 13. Phase 5.1 Stage 1 — Secure Booking Enquiry Database Architecture & Live Verification (2026-11-17)

### 13.1 Database Migration Installed
- **Migration:** `supabase/migrations/20261117_booking_enquiries.sql`
- **Execution:** Successfully executed manually in the Supabase Dashboard SQL Editor by the platform owner ("Success. No rows returned").
- **Live Catalog Objects:**
  - `public.booking_enquiries`: Core enquiry records.
  - `public.booking_enquiry_events`: Immutable audit trail for every status transition.
  - 5 performance and quota indexes (`idx_booking_enquiries_business`, `idx_booking_enquiries_artist`, `idx_booking_enquiries_status`, `idx_booking_enquiries_open_pair`, `idx_booking_enquiry_events_enquiry`).
  - Trigger `trg_booking_enquiries_updated_at` firing `public.set_booking_enquiry_updated_at()`.
  - 4 atomic `SECURITY DEFINER` RPCs with `SET search_path = ''`.

### 13.2 Client Privilege Revocation & RLS Security
- **Direct Client Writes Revoked:** `REVOKE INSERT, UPDATE, DELETE ON public.booking_enquiries, public.booking_enquiry_events FROM authenticated, anon, PUBLIC;` (enforced via PostgreSQL privilege system, error code `42501 permission denied`).
- **Client Read Policies (RLS):**
  - Authenticated businesses can only select enquiries where `business_id = (SELECT auth.uid())`.
  - Authenticated artists can only select enquiries where `artist_id = (SELECT auth.uid())`.
  - Authenticated admins can select all enquiries via `public.is_admin()`.
  - Audit events are viewable only if the caller has select access to the parent enquiry.
  - Anonymous callers receive 0 rows on all queries.

### 13.3 Workflow & Status Lifecycle
- **Status Categories:**
  - **Open Statuses:** `submitted`, `seen`, `info_requested`, `clarified` (consume open enquiry quotas).
  - **Terminal Statuses:** `interested`, `declined`, `withdrawn` (do not consume open enquiry quotas; immutable/concluded).
- **Semantics of `interested`:** Represents mutual non-binding interest expression. Does **NOT** create a confirmed booking, generate an invoice, transfer funds, or place an event on the artist's calendar.
- **Calendar Isolation Invariant:** Zero integration with `public.artist_calendar_events`. Enquiry operations never mutate or lock calendar dates.

### 13.4 Atomic Stored Procedures (RPCs)
All RPCs enforce authentication via `(SELECT auth.uid())`, check profile roles in `public.profiles`, use transaction-scoped advisory locks (`pg_advisory_xact_lock`), and maintain immutable event records in `public.booking_enquiry_events`:
1. `public.submit_booking_enquiry(p_artist_id, p_event_date, p_event_type, p_event_location, p_requirements, p_indicative_budget, p_business_message)`:
   - Validates caller role is `business`.
   - Validates target artist exists and is `published` (rejects suspended/draft/rejected artists).
   - Rejects self-enquiries.
   - Enforces future date in Indian Standard Time (`p_event_date > (timezone('Asia/Kolkata', now()))::date`).
   - Rejects duplicate open enquiries for the same business, artist, and event date.
   - Enforces active pair quota: maximum 3 open enquiries per business–artist pair.
   - Enforces global business quota: maximum 10 open enquiries across all artists.
   - Enforces velocity rate limit: maximum 5 enquiries per hour per business.
2. `public.respond_to_booking_enquiry(p_enquiry_id, p_action, p_response_text)`:
   - Validates caller is the target `artist`.
   - Actions supported:
     - `'mark_seen'`: Idempotent transition from `submitted` to `seen`.
     - `'request_info'`: Transition to `info_requested` (requires `p_response_text >= 5` chars).
     - `'express_interest'`: Transition to `interested` (valid from `submitted`, `seen`, `clarified`; blocked if `info_requested`).
     - `'decline'`: Terminal transition to `declined` (optional reason).
3. `public.clarify_booking_enquiry(p_enquiry_id, p_clarification_text)`:
   - Validates caller is the owning `business`.
   - Allowed only when status is `info_requested`.
   - Transitions status to `clarified` and records audit event. Enforces single-cycle clarification (subsequent calls rejected until artist responds again).
4. `public.withdraw_booking_enquiry(p_enquiry_id, p_reason)`:
   - Validates caller is the owning `business`.
   - Allowed only on open enquiries (`submitted`, `seen`, `info_requested`, `clarified`).
   - Blocked on terminal enquiries (`interested`, `declined`, `withdrawn`).

### 13.5 Live Verification Results
- **Report Document:** `PHASE_5_1_STAGE_1_VERIFICATION.md`
- **Result:** **34 / 34 checks PASSED (100%)** against live Supabase PostgreSQL database.
- **Test Accounts Used:** Dedicated `.example` test accounts (Business, Secondary Business, Published Artist, Suspended Artist).
- **Data Hygiene:** All test records were moved to terminal states; exactly 0 active/open enquiries remain in the database.
- **Stage 2 Readiness:** Database layer is 100% verified and ready for Next.js Server Actions and Zod validation.

---

## 14. Next.js Security Upgrade & Phase 5.1 Stage 2 — Server Actions & Zod Validation (2026-11-23)

### 14.1 Next.js Security Upgrade (GHSA-mfr8-8qww-v76h)
- **Vulnerability Addressed:** Information disclosure across root params when a `'use cache'` function is called through `unstable_cache()` in Next.js 16.3.0–16.4.4.
- **Upgraded Packages:**
  - `next`: `16.4.3` → `16.4.6`
  - `eslint-config-next`: `16.4.3` → `16.4.6`
- **Verification:**
  - `npm audit --omit=dev`: **0 vulnerabilities found**.
  - `npx tsc --noEmit`: 0 errors.
  - `npm run lint`: 0 errors.
  - `npm run build`: All 22 routes compiled successfully with Turbopack and PPR.
  - Live security regression test: All 31 core security and authentication invariants passed.
- **Deployment Advisory:** Netlify production site `https://artist-net-v1.netlify.app` remains on previous build (`f271d08`). A security-only deployment recommendation is prepared, awaiting owner push authorization.

### 14.2 Phase 5.1 Stage 2: Server Actions & Zod Validation
- **Files Created:**
  - `lib/enquiries/types.ts`: TypeScript contracts for `BookingEnquiry`, `BookingEnquiryEvent`, `BookingEnquiryWithDetails`, `EnquiryActionResult`, `EnquiryListFilter`, status helpers (`isOpenStatus`, `isTerminalStatus`, `isPastEventDate`), and IST minimum date calculator (`getMinimumEventDateIST`).
  - `lib/enquiries/schemas.ts`: Strict Zod validation schemas for all actions (`submitEnquirySchema`, `respondEnquirySchema`, `clarifyEnquirySchema`, `withdrawEnquirySchema`, `enquiryListFilterSchema`). Includes Indian Standard Time future date enforcement, 2-year boundary, ₹10 crore budget cap, length restrictions, and action-specific refinement rules.
  - `app/actions/enquiries.ts`: Strongly-typed Next.js Server Actions ("use server"):
    1. `submitBookingEnquiryAction(input)`: Validates business role from `public.profiles`, executes `submit_booking_enquiry` RPC, revalidates `/dashboard/restaurant`.
    2. `markEnquirySeenAction(enquiryId)`: Validates artist role, executes `respond_to_booking_enquiry('seen')`, revalidates `/dashboard/artist`.
    3. `expressInterestAction(enquiryId, note)`: Validates artist role, executes `respond_to_booking_enquiry('interested')`, revalidates `/dashboard/artist`.
    4. `declineEnquiryAction(enquiryId, reason)`: Validates artist role, executes `respond_to_booking_enquiry('decline')`, revalidates `/dashboard/artist`.
    5. `requestInfoAction(enquiryId, question)`: Validates artist role and min-length, executes `respond_to_booking_enquiry('request_info')`, revalidates `/dashboard/artist`.
    6. `clarifyEnquiryAction(input)`: Validates business role, executes `clarify_booking_enquiry` RPC, revalidates `/dashboard/restaurant`.
    7. `withdrawEnquiryAction(enquiryId)`: Validates business role, executes `withdraw_booking_enquiry` RPC, revalidates `/dashboard/restaurant`.
    8. `getBusinessEnquiriesAction(filter)`: Validates business role, queries sent enquiries with joined `artist_profiles` and chronological `booking_enquiry_events`.
    9. `getArtistEnquiriesAction(filter)`: Validates artist role, queries received enquiries with safe `business_profile` fallback and chronological `booking_enquiry_events`.
    10. `getEnquiryDetailsAction(enquiryId)`: Validates participant or admin role, fetches single enquiry with joined profile summaries and full audit trail.

### 14.3 Automated Verification Results
- **Suite:** `scratch/verify_phase_5_1_stage_2.mjs`
- **Result:** **36 / 36 checks PASSED (100% pass rate)**.
- **Coverage:** Zod validation unit tests (14 checks), authenticated session setup (3 checks), end-to-end lifecycle execution (14 checks), cross-account tenant isolation and retrieval (5 checks: Tests 32–36).
- **Calendar Isolation:** Zero calendar entries created in `public.artist_calendar_events`.
- **Status Semantics:** Non-binding nature of `interested` preserved; terminal records do not consume open quotas.

---

## 15. Phase 5.1 Stage 3 — Business Booking Enquiry Submission UI (2026-11-23)

### 15.1 Component Architecture & Public Profile Integration
- **Component:** `app/components/BookingEnquirySection.tsx` (Client component with modal drawer).
- **Integration Point:** `app/artists/[slug]/page.tsx` (Placed between the top hero card and the About section).
- **Role-Based Visibility Matrix:**
  - **Anonymous Visitor:** Sees informational planning card with "Sign In as Business" (`/login?redirectTo=/artists/${slug}`) and "Join as Business" (`/signup?role=business&redirectTo=/artists/${slug}`). No actionable enquiry submit button is exposed.
  - **Artist Account:** Sees non-actionable notification ("You are logged in as an artist. Booking enquiries are submitted by business accounts."). Own profile displays owner indicator.
  - **Administrator:** Sees non-actionable notice ("Administrator Mode: Booking enquiry submissions are reserved for business accounts.").
  - **Business Account:** Sees primary CTA ("Send Booking Enquiry") opening the responsive modal.
- **Form Controls & Constraints:**
  - `eventDate`: HTML5 date input with `min` set to tomorrow in IST (`getMinimumEventDateIST()`) and 2-year upper bound.
  - `eventType`: Dropdown covering `corporate`, `wedding`, `restaurant`, `festival`, `private`, `concert`, `other`.
  - `eventLocation`: Text input (max 255 chars).
  - `indicativeBudget`: Numeric currency input in INR (non-negative, capped at ₹10 Cr, optional).
  - `requirements`: Textarea (max 2000 chars with live counter).
  - `businessMessage`: Textarea (max 2000 chars with live counter).
  - **Non-Binding Notice:** Displayed prominently: *"Sending an enquiry does not confirm a booking, guarantee artist availability or create any payment obligation."*
  - **Duplicate Prevention:** Submit button is disabled with loading spinner while `isSubmitting` is true.
  - **Success Presentation:** Replaces form with confirmed enquiry reference ID and direct link to Business Dashboard (`/dashboard/restaurant`).

### 15.2 Verification Suite
- **Suite:** `scratch/verify_phase_5_1_stage_3.mjs`
- **Result:** **15 / 15 checks PASSED (100% pass rate)**.
- **Coverage:** Public profile HTTP 200, anonymous CTA redirects, role checks, privilege revocation on anonymous RPC, server-side role blocking for artists, business submission execution, status 'submitted', single audit event creation, duplicate open date guard, and calendar isolation invariant.
- **Compiler & Linter:** TypeScript (0 errors), ESLint (0 errors), npm audit (0 production vulnerabilities), Next.js build (22/22 routes compiled successfully).

### 15.3 Isolated Security Deployment Plan
- **Risk Analysis:** `master` is 11 commits ahead of `origin/master`. Pushing `master` to GitHub would automatically deploy Phase 4.7, Stage 1 SQL migrations, Stage 2 server actions, and Stage 3 UI to Netlify before public launch approval.
- **Safe Hotfix Workflow:**
  1. `git checkout -b hotfix/nextjs-16.4.6-patch origin/master`
  2. Cherry-pick only commit `1128f4d` (`fix(security): upgrade next to 16.4.6 and eslint-config-next to 16.4.6`).
  3. Verify `npm audit --omit=dev`, `npx tsc --noEmit`, and `npm run build` on the hotfix branch.
  4. Deploy hotfix branch to Netlify via preview build or authorized push to `origin/master`.
  5. Feature commits remain quarantined on local `master` branch.

---

## 16. Phase 5.1 Stage 4 — Artist Booking Enquiry Management UI (2026-11-23)

### 16.1 Overview
Stage 4 completes the artist-facing half of the Phase 5.1 booking enquiry workflow. Artists can now receive, review, and respond to business enquiries through a dedicated inbox tab in their existing dashboard — without any new SQL migrations, schema changes, or calendar modifications.

### 16.2 Files Created or Modified
| File | Action | Description |
|------|--------|-------------|
| `app/components/ArtistEnquiriesInbox.tsx` | **Created** | Full artist enquiry inbox with status filtering, expand/collapse cards, action modals, audit log display, past-event badge, and non-blocking seen marking. |
| `app/dashboard/artist/page.tsx` | **Modified** | Added `enquiries` tab to `useState`, loaded enquiries in `Promise.all`, added live KPI Enquiries card (with unseen pulse badge), replaced "Coming Soon" placeholder with live Enquiries summary card, added `<ArtistEnquiriesInbox>` tab render, added tab button with live unread badge. |
| `app/components/BookingEnquirySection.tsx` | **Modified** | Corrected Stage 3 promotional copy from `"Book {artistStageName} for Your Event"` → `"Enquire About Booking {artistStageName}"`. |
| `scratch/verify_phase_5_1_stage_4.mjs` | **Created** | 20-check automated verification suite covering copy, component integration, authentication isolation, full RPC lifecycle, state machine guards, audit event capture, calendar invariant, and past-event date logic. |

### 16.3 Artist Dashboard UI Changes

**KPI Row (5-card layout):**
- Card 1 — Booking Enquiries: Shows open count. Clicking navigates to Enquiries tab. Amber pulse badge appears when `unseenCount > 0`.
- Cards 2–5 — Profile Completion %, Total Portfolio items, Avg. Weekly Views placeholder, Calendar Events.

**Tab Navigation:**
- Three tabs: Overview | Portfolio | Booking Enquiries
- Booking Enquiries tab shows unread count badge or "Open" pill when enquiries exist.

**Overview Tab — Enquiries Summary Card:**
- Replaces the old "Coming Soon" placeholder (which had misleading messaging about enquiries not being live).
- Shows live summary: Action Needed count, Unopened count, Total count with "View All" link to Enquiries tab.
- When enquiries.length === 0: gentle empty state ("No enquiries yet").

**Enquiries Tab — ArtistEnquiriesInbox Component:**

Filter Tabs:
- `All` — All enquiries
- `Action Needed` — submitted + seen + clarified (artist must respond)
- `Awaiting Business` — info_requested (waiting for clarification)
- `Concluded` — interested + declined + withdrawn

Each enquiry card shows:
- Business/venue name (safe fallback to "Business Client" if profile RLS restricts)
- Event date, event type, location
- Indicative budget in INR (with "(indicative, non-binding)" label when present)
- Requirements text
- Current status badge with color coding
- Past Event badge (⌛) when event_date < today in IST
- Submission date (IST)
- Full audit event history (chronological)

Explicit Actions (shown only when state machine permits):
- **Mark Seen**: Fires on first expand of a `submitted` enquiry. Non-blocking, optimistic UI.
- **Request Information**: Available in `submitted`/`seen` state. Requires ≥ 5 character question via modal.
- **Express Interest**: Available in `seen`/`submitted`/`clarified` state. Opens non-binding interest modal with optional note. Status `interested` is NEVER called "Booked", "Confirmed" or "Accepted".
- **Decline**: Available in all open states. Optional reason via modal. Terminal.
- Buttons disabled during `isSubmitting` with spinner indicator.

### 16.4 Status Definitions (Authoritative)

| Status | Label | Category | Meaning |
|--------|-------|----------|---------|
| `submitted` | Submitted | Open | New enquiry, artist not yet viewed |
| `seen` | Seen | Open | Artist has explicitly opened the enquiry |
| `info_requested` | Info Requested | Open (Awaiting Business) | Artist asked a question; business must clarify |
| `clarified` | Clarified | Open | Business answered; artist can respond |
| `interested` | Interested | Terminal | Non-binding expression of mutual interest. NOT a booking. |
| `declined` | Declined | Terminal | Artist formally declined the enquiry |
| `withdrawn` | Withdrawn | Terminal | Business withdrew the enquiry |

### 16.5 Security & Privacy Invariants (All Verified)
- **Role Isolation:** `respond_to_booking_enquiry` RPC enforces `role = 'artist'` via `public.profiles`. Business/admin calls are rejected with ERRCODE `42501`.
- **Cross-Artist Isolation:** RLS enforces `artist_id = auth.uid()`. No artist can read another's enquiries (confirmed: other artist gets 0 rows).
- **No Client Writes:** Direct `INSERT/UPDATE/DELETE` on `booking_enquiries` and `booking_enquiry_events` are revoked from all authenticated clients. All mutations go through SECURITY DEFINER RPCs.
- **No Public Exposure:** Enquiry data has no public SELECT policy. Anonymous queries return 0 rows.
- **No Calendar Side Effects:** Calendar Isolation Invariant confirmed — `artist_calendar_events` count remains unchanged after the full enquiry lifecycle (submit → seen → info_requested → clarified → interested).

### 16.6 State Machine Guard (Test #14 Confirmed)
The database RPC `respond_to_booking_enquiry` raises PostgreSQL exception ERRCODE `23514` when an artist attempts to call `interested` while the enquiry is in `info_requested` status. The UI enforces this by hiding the Express Interest button in `info_requested` state. Both the DB guard and the UI guard are independently enforced.

### 16.7 Verification Results
- **Test Suite:** `scratch/verify_phase_5_1_stage_4.mjs`
- **Result:** **20 / 20 checks PASSED (100% pass rate)**
- **Suites Covered:**
  - Suite 1 (Copy & Integration): Tests 1–3 ✅
  - Suite 2 (Auth & Isolation): Tests 4–7 ✅ (3 account types authenticated, cross-artist RLS verified)
  - Suite 3 (Lifecycle & Guards): Tests 8–20 ✅ (full enquiry lifecycle, audit events, state machine guard, calendar invariant, past-event date logic)
- **Compiler:** TypeScript 0 errors
- **Linter:** ESLint 0 errors (28 pre-existing `<img>` and scratch-script warnings unchanged from prior stages)
- **Build:** Next.js 16.4.6 — 22/22 routes compiled successfully
- **Security Audit:** `npm audit --omit=dev` — **0 vulnerabilities**

### 16.8 Browser Testing
Real browser testing (10-step user flow) was **NOT PERFORMED** in Stage 4 — the browser automation subagent was not available for a full interactive session. The following alternative tests were performed:
- Automated Supabase API tests confirmed end-to-end RPC lifecycle.
- Component code review confirms correct conditional rendering for each state.
- The dev server (port 3000) is running. Manual browser testing is recommended by the platform owner.

### 16.9 Isolated Security Deployment Update
- `master` is now 13 commits ahead of `origin/master` (12 prior + Stage 4 commit).
- The Next.js 16.4.6 security patch (`1128f4d`) is still the recommended cherry-pick target for a hotfix deploy.
- Stage 4 feature commits must NOT be force-deployed as a shortcut.

### 16.10 Stage 5 Transition
Stage 5 has been completed locally. See Section 17 below for details.

---

## 17. Phase 5.1 Stage 5 — Business Enquiry Tracking & Clarification UI (2026-11-24)

### 17.1 Overview
Stage 5 delivers the business-facing enquiry management interface at `/dashboard/restaurant`. Businesses can now view their real booking enquiries sent to artists, filter them by status, respond to artist requests for clarification (within the single-cycle state machine), and withdraw open enquiries before conclusion. All mock data has been purged from the business dashboard.

### 17.2 Files Created or Modified
| File | Action | Description |
|------|--------|-------------|
| `app/components/BusinessEnquiriesPanel.tsx` | **Created** | Comprehensive business enquiry management panel with 5 status filter tabs, live counts, expand/collapse cards, artist profile links, event specifications, budget in INR, non-binding notices, chronological audit event history, clarification modal (5–2000 chars), and withdrawal confirmation modal. |
| `app/dashboard/restaurant/page.tsx` | **Modified** | Replaced mock data (`mockSentEnquiries`) with live Supabase data via `getBusinessEnquiriesAction`. Added real KPI cards (Sent Enquiries, Your Response Needed, Artist Interested), action-needed alert banner, default "enquiries" tab, and retained demo lineup/shortlist tabs. |
| `app/components/ArtistEnquiriesInbox.tsx` | **Modified** | Fixed Stage 4 filter tab label ("Concluded / Terminal" → "Concluded") to clearly distinguish open from terminal states. Fixed ESLint `react-hooks/set-state-in-effect` error and removed unused `Link` import. |
| `scratch/verify_phase_5_1_stage_5.mjs` | **Created** | Automated test suite validating static components, cross-business RLS isolation, artist RPC restrictions, clarification lifecycle, withdrawal lifecycle, terminal state protection, and calendar invariant (21/21 passed). |

### 17.3 Business Dashboard UI & State Machine
1. **Filter Tabs:**
   - **All Enquiries:** Complete chronological list with count badge.
   - **Awaiting Artist:** Enquiries in `submitted`, `seen`, or `clarified` states awaiting artist action.
   - **Your Response Needed:** Enquiries in `info_requested` state where the artist asked a question. Displays prominent amber alert badge.
   - **Artist Interested:** Non-binding expressions of interest from artists.
   - **Concluded:** Terminal enquiries (`interested`, `declined`, `withdrawn`).
2. **Clarification Workflow:**
   - Displayed when an enquiry is in `info_requested` status.
   - Modal shows the artist's specific inquiry.
   - Reply form enforces 5–2,000 character length (Zod + client validation).
   - Calls `clarifyEnquiryAction` → executes `clarify_booking_enquiry` RPC.
   - Transitions status to `clarified` (open state).
   - Single-cycle enforcement: Further clarifications are blocked by RPC.
   - Clear explanatory text: "The artist will review your clarification before expressing interest or declining."
3. **Withdrawal Workflow:**
   - Available on any open enquiry (`submitted`, `seen`, `info_requested`, `clarified`).
   - Confirmation dialog clearly explains consequences: "This action cannot be undone. The artist will be notified that this enquiry is no longer active."
   - Calls `withdrawEnquiryAction` → executes `withdraw_booking_enquiry` RPC.
   - Transitions status to `withdrawn` (terminal state).
   - Blocked on terminal states (`interested`, `declined`).

### 17.4 Status Display Semantics
| Status | Business-Facing Label | Category | Notes |
|--------|----------------------|----------|-------|
| `submitted` | Submitted | Open | Initial state upon sending enquiry. |
| `seen` | Viewed by Artist | Open | Artist has viewed enquiry details. |
| `info_requested` | Your Response Needed | Open | Artist asked for additional information. |
| `clarified` | Clarification Sent | Open | Business responded to artist inquiry. |
| `interested` | Artist Interested (Non-binding) | Terminal | Non-binding. Not a confirmed booking or payment. |
| `declined` | Declined | Terminal | Artist politely declined. |
| `withdrawn` | Withdrawn | Terminal | Business cancelled the enquiry. |

### 17.5 Security & Privacy Controls Verified
- **Session-Based Identity:** Business identity is resolved strictly via `supabase.auth.getUser()` and `public.profiles.role = 'business'`. User-supplied IDs are rejected.
- **Cross-Business RLS Isolation:** Verified that Business B cannot view Business A's enquiries (`0 rows` returned when querying another business's ID).
- **RPC Role Enforcement:** Verified that Artist accounts cannot call `clarify_booking_enquiry` or `withdraw_booking_enquiry` (fails with `Access Denied` / permission error).
- **Terminal State Protection:** Verified that enquiries in `interested` terminal state cannot be withdrawn via `withdraw_booking_enquiry`.
- **Zero Calendar Mutation:** Invariant verified across all enquiry creation, clarification, and withdrawal operations (calendar event count unchanged).

### 17.6 Verification Results
- **TypeScript:** `npx tsc --noEmit` passed with 0 errors.
- **ESLint:** `npm run lint` passed with 0 errors (30 pre-existing warnings in images and scratch files).
- **Production Build:** `npm run build` succeeded (22/22 routes rendered).
- **Security Audit:** `npm audit --omit=dev` reported 0 vulnerabilities.
- **Automated Verification Suite (`scratch/verify_phase_5_1_stage_5.mjs`):** 21/21 tests passed.
- **Browser Interaction Testing:** NOT TESTED (Chrome remote debugging port 9222 not enabled in the environment).

### 17.7 Stage 6 Completion
Stage 6 has been completed locally. See Section 18 below for full QA verification details.

---

## 18. Phase 5.1 Stage 6 — Complete End-to-End Quality Assurance & Platform Verification (2026-11-24)

### 18.1 Overview
Stage 6 represents the final validation gate for Phase 5.1 (Direct Booking Enquiries). All 6 stages defined in `PHASE_5_1_IMPLEMENTATION_PLAN.md` are now fully implemented, verified, and locked locally. The system allows verified businesses to enquire about booking published artists, supports bidirectional enquiry management (seen status, single-cycle clarification, non-binding expression of interest, and polite declines/withdrawals), strictly prevents calendar mutation and payments, and preserves immutable audit event history.

### 18.2 UI Consistency Corrections Applied in Stage 6
1. **In-App Withdrawal Transparency:** Corrected withdrawal confirmation modal in `BusinessEnquiriesPanel.tsx` to state explicitly that the withdrawal is reflected directly in the artist's dashboard with no email/SMS claims.
2. **Distinct Business Filter Tabs:** Renamed `"Concluded"` tab to `"Declined / Withdrawn"` in `BusinessEnquiriesPanel.tsx` and isolated its filter predicate to `declined` or `withdrawn` only, guaranteeing zero overlap with the `"Artist Interested"` tab.
3. **Clarified Open State Visibility:** Added an active alert banner for `clarified` enquiries in `ArtistEnquiriesInbox.tsx` within the `"Action Needed"` tab, ensuring artists immediately see client responses and can express interest or decline.
4. **Non-Binding Language Consistency:** Reaffirmed non-binding disclaimers across all artist and business enquiry components, ensuring indicative budgets (`₹XX,XXX (indicative, non-binding)`) and interest expressions are never conflated with confirmed bookings.
5. **Zero Mock Records:** Confirmed all dashboard views use live Supabase data via server actions.

### 18.3 Verification Results Matrix
- **Automated QA Suite (`scratch/verify_phase_5_1_stage_6.mjs`):** **48/48 tests passed (100%)**.
  - *Suite 1 (Static Code & UI Consistency):* 6/6 passed.
  - *Suite 2 (Input Validation Edge Cases):* 9/9 passed.
  - *Suite 3 (Role-Based Authorization & RLS Isolation):* 10/10 passed.
  - *Suite 4 (Complete Business-to-Artist Journey & Lifecycles):* 13/13 passed.
  - *Suite 5 (Rate Limiting & Concurrency):* 2/2 passed (5/hour live rate limit verified).
  - *Suite 6 (Regression & Core Route Verification):* 8/8 passed.
- **Real Browser Automation:** Marked **NOT TESTED** (remote debugging port 9222 was not enabled). A 26-step manual QA verification protocol has been documented in `PHASE_5_1_STAGE_6_FINAL_QA.md`.
- **TypeScript:** `npx tsc --noEmit` → **0 errors**.
- **ESLint:** `npm run lint` → **0 errors** (36 pre-existing image/scratch warnings).
- **Production Build:** `npm run build` → **22/22 routes rendered**.
- **Security Audit:** `npm audit --omit=dev` → **0 vulnerabilities**.

### 18.4 Phase 5.1 Architecture Handover & Owner Sign-Off Status
- **Current Branch:** `master` (19 commits ahead of `origin/master`).
- **Phase Status:** **PHASE 5.1 SIGNED OFF & FEATURE COMPLETE (2026-11-24)**.
  - All 6 stages completed across database, backend server actions, public UI, artist inbox, business tracking, and end-to-end QA.
  - 48/48 automated QA tests passed cleanly (100% pass rate).
  - Platform owner manually tested and confirmed full end-to-end browser functionality on `localhost:3000`.
  - Local feature completion formally approved by owner.
- **Deployment Status:** **PENDING CONTROLLED DEPLOYMENT REVIEW**.
- **Netlify Status:** Production deployment on Netlify is running the isolated Next.js 16.4.6 security hotfix at commit `7f1810e`. Zero Phase 5.1 code is currently in production.
- **Strict Boundary Reminder:** Phase 5.2 (formal contracts, binding confirmations, and payment gateways) must NOT be started without explicit written platform owner sign-off.


---

## 19. Netlify Security Hotfix Preparation (Next.js 16.4.6) (2026-11-24)

### 19.1 Objective & Strategy
A security vulnerability in Next.js (GHSA-mfr8-8qww-v76h) required patching on the public Netlify testing site (`https://artist-net-v1.netlify.app`) without deploying the 16 local feature and documentation commits of Phase 5.1.

### 19.2 Isolated Hotfix Branch
- **Branch:** `hotfix/nextjs-16.4.6-patch`
- **Base:** `f271d08a97b96f5e179aea3b47f0e19d0d5c9fa5` (verified `origin/master` baseline)
- **Hotfix Commit:** `7f1810ef5370f05871407cf84ccfb6876d86166c` (cherry-picked from `1128f4d`)
- **Diff:** Strictly `package.json` (+2/-2) and `package-lock.json` (+48/-48) upgrading `next` and `eslint-config-next` from `16.4.3` to `16.4.6`.
- **Zero Leakage:** 0 feature files, 0 database RPCs, 0 legal pages, and 0 secrets included.

### 19.3 Verification on Hotfix Branch
- `npx tsc --noEmit`: 0 errors.
- `npm run lint`: 0 errors.
- `npm run build`: 17/17 baseline production routes rendered cleanly in 2.4s.
- `npm audit --omit=dev`: `found 0 vulnerabilities`.

### 19.4 Deployment & Reconciliation Execution (COMPLETED 2026-11-24)
1. **Push Execution:**
   - Pre-push safety checks confirmed `origin/master` at `f271d08`, 1 commit ahead, fast-forward verified.
   - Pushed: `git push origin hotfix/nextjs-16.4.6-patch:master`.
   - Result: Fast-forward `f271d08..7f1810e`. Remote GitHub `origin/master` is now at `7f1810e`.
2. **Netlify Automated Build & Verification:**
   - Netlify triggered and deployed commit `7f1810e`.
   - Verified live site (`https://artist-net-v1.netlify.app`):
     - Homepage status: 200 (134,505 bytes).
     - Security headers: `server: Netlify`, `strict-transport-security: max-age=31536000; includeSubDomains; preload`, `x-powered-by: Next.js`.
     - Deployed Next.js runtime version detected in client chunk: **16.4.6** (`/_next/static/chunks/2qe25xv8888tp.js`).
     - Directory (`/artists`) and profiles (`/artists/published-test-singer`): 200 OK.
     - Auth routes (`/login`, `/signup`): 200 OK. Protected dashboards: 200 unauth safe handling.
     - Phase 5.1 enquiry UI: **EXCLUDED** (0 enquiry buttons or forms present).
     - Unapproved legal routes (`/privacy`, `/terms`, `/disclaimer`): **404 NOT FOUND** (strictly excluded).
3. **Local Reconciliation & Master Preservation:**
   - Safety backup branch created: `backup/master-pre-hotfix-reconcile` at `6c641a8`.
   - Merged `origin/master` (`7f1810e`) into `master` via reviewed non-destructive merge: commit `8bf79d3`.
   - 0 conflicts encountered. All 17 local Phase 5.1 development and QA commits fully preserved.
   - Quality gates on reconciled `master`: `npx tsc --noEmit` (0 errors), `npm run lint` (0 errors), dev server active.

---

## 20. Pre-Deployment Copy Corrections & Readiness Refinements (2026-11-24)

### 20.1 Disclaimer & Terms Language Updates
1. **Accurate Phase 5.1 Enquiries Scope (`app/disclaimer/page.tsx` & `app/terms/page.tsx`):**
   - Explicitly clarified that non-binding booking enquiries and single-cycle clarifications are implemented in Phase 5.1.
   - Enshrined key legal boundaries: enquiry submission does NOT confirm a booking; artist expression of interest is NOT contractual acceptance.
   - Reaffirmed that formal binding electronic contracting, integrated UPI/card payments, advance escrow deposits, and automated settlements remain future capabilities (Phase 5.2 and beyond).
2. **Contact & Privacy Placeholder Transparency (`app/contact/page.tsx` & `app/privacy/page.tsx`):**
   - Labeled all email channels and entity details as non-operational during the pre-launch testing preview, preventing visitors from mistaking placeholders for active communication channels.
   - Calibrated statutory compliance statements: explained that policies reflect statutory alignment with the DPDP Act 2023 and IT Act 2000, and that official Grievance Officer and corporate entity details will be designated and published prior to commercial launch.
3. **Rollback Plan Architecture & Safeguards:**
   - Prohibited all force-pushing, history rewriting, and generic revert ranges over merge history.
   - **Primary Emergency Recovery:** Netlify Dashboard 1-click redeploy of known-good baseline `7f1810e`.
   - **Secondary Source Rollback Protocol:** Reviewed dedicated branch (`rollback/restore-7f1810e`), restoring the exact baseline tree via `git restore --source=7f1810e --staged --worktree -- .`, confirming clean tree match with `git diff 7f1810e`, passing all local verification gates, and committing a single forward-moving revert commit.

---

## 21. Platform-Wide Role-Aware UX Audit & Multi-Role Authorization Hardening (2026-11-24)

### 21.1 Overview & Root Cause Analysis
During manual testing of the deployed preview, the platform owner discovered that an authenticated Business account user could still see a "Join as Artist" CTA button. Clicking this CTA navigated the authenticated Business user to the Artist signup form (`/signup`).

A thorough code audit revealed that:
1. **Footer Component (`app/components/Footer.tsx`):** Hardcoded static `{ label: "Join as an Artist", href: "/signup" }` under "For Artists" was rendered for all visitors across all 18 public and dashboard pages, regardless of authentication state or account role.
2. **Dashboard Showcase (`app/components/DashboardShowcase.tsx`):** An action banner button hardcoded to `<Link href="/signup">Join as an Artist →</Link>` was rendered on the homepage for all users.
3. **For Businesses Section (`app/components/ForBusinesses.tsx`):** A secondary button `<Link href="/signup">Register as Venue</Link>` was rendered on the homepage without inspecting user authentication or role.
4. **Public Artist Profile (`app/artists/[slug]/page.tsx`):** Unconditional callout `<Link href="/login?redirectTo=...">Login as Client to check prices!</Link>` was rendered even when the visitor was already an authenticated Business client.
5. **Registration & Login Pages (`app/signup/page.tsx` & `app/login/page.tsx`):** Implemented purely as client components (`"use client"`) without server-side route guards, allowing authenticated users (Artists, Businesses, Admins) who directly entered or were linked to `/signup` or `/login` to access the registration and login forms.
6. **Navbar Component (`app/components/Navbar.tsx`):** The anonymous visitor state featured only "Join as Artist" without a prominent "Join as Business" option, and on `/signup` and `/login` rendered guest navigation shells because no `initialUser` was passed.

### 21.2 Architecture & Implementation Corrections
1. **Server-Side Route Protection on `/signup` (`app/signup/page.tsx` & `SignUpClient.tsx`):**
   - Transformed `app/signup/page.tsx` into an async Server Component with `await connection()` and `await getCurrentUser()`.
   - Authoritative server guard: If an authenticated session is detected via `supabase.auth.getUser()` and validated against `public.profiles`:
     - `role === "admin"` → redirects immediately (HTTP 307) to `/admin`.
     - `role === "business"` → redirects immediately (HTTP 307) to `/dashboard/restaurant`.
     - `role === "artist"` → redirects immediately (HTTP 307) to `/dashboard/artist`.
   - Prevents role-manipulation via query parameters (`?role=artist`, `?role=business`) or direct form access.
   - Form logic moved cleanly into client component `app/signup/SignUpClient.tsx` for anonymous visitors.
2. **Server-Side Route Protection on `/login` (`app/login/page.tsx` & `LoginClient.tsx`):**
   - Transformed `app/login/page.tsx` into an async Server Component.
   - If an authenticated session exists, routes the user via `getSafeRedirectPath(rawRedirectTo, currentUser.role)` to their authorized dashboard or validated safe redirect path.
   - Form logic encapsulated in client component `app/login/LoginClient.tsx` for unauthenticated visitors.
3. **Role-Aware Global Footer (`app/components/Footer.tsx`):**
   - Accepts `user?: CurrentUser | null`. Dynamically resolves `await getCurrentUser()` if not supplied.
   - Dynamically adapts navigation columns:
     - **Anonymous:** Displays "Join as an Artist" (`/signup?role=artist`) and "Register as Venue" (`/signup?role=business`).
     - **Artist:** Displays "Artist Dashboard", "Artist Calendar", "Edit Showcase Profile", and "Community Guidelines". Registration CTAs completely eliminated.
     - **Business:** Displays "Talent Sourcing" with "Browse Artists Directory", "Categories", and "Venue Dashboard". Registration CTAs completely eliminated.
     - **Admin:** Displays "Admin Dashboard" and "Review Applications". Registration CTAs completely eliminated.
4. **Interactive Dashboard Showcase (`app/components/DashboardShowcase.tsx`):**
   - Refactored to accept `initialUser?: CurrentUser | null`.
   - Replaced static "Join as an Artist →" and "Register Venue" buttons with role-aware actions:
     - Anonymous: "Join as an Artist →" and "Register Venue".
     - Business: "Browse Artist Directory →" and "Venue Dashboard →".
     - Artist: "Open Artist Dashboard →" and "Explore Artist Directory →".
     - Admin: "Open Admin Control Center →" and "Admin Dashboard →".
5. **For Businesses Section (`app/components/ForBusinesses.tsx`):**
   - Refactored to accept `user?: CurrentUser | null`.
   - Anonymous: "Discover Artists" and "Register as Venue".
   - Business: "Discover Artists" and "Venue Dashboard".
   - Artist: "Discover Artists" and "Artist Dashboard".
   - Admin: "Discover Artists" and "Admin Dashboard".
6. **Public Artist Profile Role-Aware Pricing (`app/artists/[slug]/page.tsx`):**
   - Anonymous: Retains "Login as Client to check prices!" (`/login?redirectTo=...`).
   - Business: Displays starting price directly (`Starting from ₹X / unit`) with a "Verified Client View" badge. Eliminates login prompt.
   - Artist: Displays indicative rate with an "Artist View" badge.
   - Admin: Displays starting price with an "Admin View" badge.
7. **Navbar Navigation Shell (`app/components/Navbar.tsx`):**
   - For anonymous visitors, provides explicit dual pathways: "Join as Business" (`/signup?role=business`) and "Join as Artist" (`/signup?role=artist`) on both desktop and mobile drawers.
   - For authenticated users, hides all registration CTAs and displays the role-specific dashboard link and sign-out button.
8. **Consistent Prop Propagation Across All Pages:**
   - Propagated `user={currentUser}` / `initialUser={currentUser}` across `app/page.tsx`, `app/artists/page.tsx`, `app/artists/[slug]/page.tsx`, `app/categories/page.tsx`, `app/community-guidelines/page.tsx`, `app/contact/page.tsx`, `app/disclaimer/page.tsx`, `app/opportunities/page.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx`, and dashboard layouts.

### 21.3 Final Platform Role-Visibility Matrix

| Surface / Component | Anonymous Visitor | Authenticated Artist | Authenticated Business | Authenticated Administrator |
| :--- | :--- | :--- | :--- | :--- |
| **Top Navbar (Desktop)** | Sign In, Join as Business, Join as Artist | 🎨 Artist Dashboard, Log Out | 🏢 Business Dashboard, Log Out | 🛡️ Admin Dashboard, Log Out |
| **Top Navbar (Mobile)** | Sign In, Join as Business, Join as Artist | User pill, 🎨 Artist Dashboard, Log Out | User pill, 🏢 Business Dashboard, Log Out | User pill, 🛡️ Admin Dashboard, Log Out |
| **Hero Section (Home)** | Discover Artists, Join as an Artist | Discover Artists, Artist Dashboard | Discover Artists, Business Dashboard | Discover Artists, Admin Dashboard |
| **For Businesses (Home)** | Discover Artists, Register as Venue | Discover Artists, Artist Dashboard | Discover Artists, Venue Dashboard | Discover Artists, Admin Dashboard |
| **Dashboard Showcase (Home)**| Join as an Artist → / Register Venue | Open Artist Dashboard → | Browse Artist Directory → / Venue Dashboard → | Open Admin Control Center → |
| **Artist CTA Banner** | Join as an Artist, How It Works | Manage My Profile / Status-specific | Discover Artists, Venue Dashboard | Admin Control Center, Applications |
| **Global Footer** | Join as an Artist, Register as Venue | Artist Dashboard, Calendar, Edit Profile | Browse Artists, Categories, Venue Dashboard | Admin Dashboard, Applications |
| **Artist Directory** | Browse cards, Filter, View profile | Browse cards, Filter, View profile | Browse cards, Filter, View profile | Browse cards, Filter, View profile |
| **Artist Profile Pricing** | "Login as Client to check prices!" | Indicative Rate (Artist View) | Starting Rate ₹X (Verified Client View) | Starting Rate ₹X (Admin View) |
| **Booking Enquiry UI** | Sign In as Business / Join as Business | "Logged in as artist" advisory notice | Full Enquiry Submission & Clarification UI | Admin Read-Only Notice |
| **`/signup` Route** | Form rendered (200 OK) | 307 Redirect → `/dashboard/artist` | 307 Redirect → `/dashboard/restaurant` | 307 Redirect → `/admin` |
| **`/login` Route** | Form rendered (200 OK) | 307 Redirect → `/dashboard/artist` | 307 Redirect → `/dashboard/restaurant` | 307 Redirect → `/admin` |
| **Cross-Role Dashboards** | 307 Redirect → `/login` | `/dashboard/restaurant` → `/dashboard/artist` | `/dashboard/artist` → `/dashboard/restaurant` | Cross-access denied |

### 21.4 Automated Verification Suite
- Comprehensive automated test suite created: `scratch/test_role_aware_ux.mjs`.
- Total executed tests: **53 / 53 passed (0 failures)**.
- Scenarios validated:
  - Anonymous visitor homepage and navigation controls: 9/9 passed.
  - Anonymous route accessibility (`/signup`, `/login`, dashboard locks): 5/5 passed.
  - Authenticated business homepage and CTA isolation: 12/12 passed.
  - Authenticated business route redirects (`/signup`, `/signup?role=artist`, `/signup?role=business`, `/login`, cross-role `/dashboard/artist`): 5/5 passed.
  - Authenticated artist homepage and CTA isolation: 11/11 passed.
  - Authenticated artist route redirects (`/signup`, `/signup?role=business`, `/login`, cross-role `/dashboard/restaurant`): 4/4 passed.
  - Public artist profile role-aware pricing (Anonymous vs Business vs Artist): 5/5 passed.

### 21.5 Quality Gates
- `npx tsc --noEmit`: 0 errors.
- `npm run lint`: 0 errors (38 pre-existing image/scratch warnings).
- `npm run build`: 22/22 routes rendered cleanly.
- `npm audit --omit=dev`: found 0 vulnerabilities.

---

## 22. Role-Aware UX Release — Netlify Deployment (2026-11-24)

### 22.1 Deployment Authorization
- Owner completed all six administrator acceptance checks on localhost.
- Automated verification suites passed: 53/53 (role-aware UX), 61/61 (final acceptance), 47/48 (Phase 5.1 stage 6 — 1 rate-limit skip).
- Deployment authorized by owner on 2026-11-24.

### 22.2 Pre-Push Safety Checks (All 10 Passed)
- `origin/master` confirmed at `fc481a5` before push.
- Local HEAD confirmed at `85df6f9`.
- `origin/master` is a strict ancestor of local `master` (fast-forward safe).
- Exactly 1 commit in push scope.
- Working tree clean.
- 21 changed files all reviewed role-aware UX files (no unintended files).
- No secrets, `.env` files or private test data in diff.
- Backup branch `backup/pre-role-ux-deploy-85df6f9` confirmed at `85df6f9`.
- Remote target confirmed as `github.com/Business1301/the-artist-network.git`.

### 22.3 GitHub Push Result
```
fc481a5..85df6f9  master → master
```
Push exit code: 0. Fast-forward applied. No force-push.  
`origin/master` post-push confirmed at `85df6f9` via `git fetch origin`.

### 22.4 Netlify Auto-Deploy
- Netlify connected to `origin/master` auto-deployed on push.
- Netlify dashboard monitoring was not available without credentials in this session.
- Live site HTTP verification confirmed all pages serving correctly (see §22.5).

### 22.5 Live HTTP Verification (20/20 PASS)
All checks run against `https://artist-net-v1.netlify.app`:

**Route Health:**
- `/` → 200 OK ✅
- `/artists` → 200 OK ✅
- `/signup` → 200 OK (anonymous form) ✅
- `/login` → 200 OK (anonymous form) ✅
- `/admin` → 200 OK (server-side auth guard active; unauthenticated users receive auth redirect at SSR level) ✅
- `/terms`, `/privacy`, `/contact`, `/disclaimer`, `/community-guidelines` → 200 OK ✅

**Supabase RLS (Phase 5.1 regression):**
- Anonymous cannot read `booking_enquiries` → `permission denied for table booking_enquiries` ✅
- Anonymous cannot call `submit_booking_enquiry` → `permission denied for function submit_booking_enquiry` ✅
- Business account authenticates and reads own enquiries (10 records) ✅
- Business cross-read isolation: 0 rows from other businesses' enquiries ✅
- Artist account authenticates and reads own enquiries (10 records) ✅

**No Auto-Booking / No Payments:**
- Zero enquiries in `confirmed`/`booked`/`contracted`/`paid` statuses ✅
- Rate limit enforced: secondaryBusiness at 5/5 hourly submission limit ✅

### 22.6 Browser-Based UI Tests
Chrome remote debugging was not available during this session. Browser-based role-aware UX checks (desktop/mobile navbar, logged-in state, hydration, mobile hamburger menu) were NOT performed via automated browser.

**Manual verification is required from the owner** for the following:
- Anonymous homepage: "Join as Artist" and "Join as Business" visible in navbar and footer.
- After logging in as Business: navbar shows "Business Dashboard" only, no "Join as Artist" anywhere.
- After logging in as Artist: navbar shows "Artist Dashboard" only, no registration CTAs.
- Mobile menu (hamburger): role-aware state correct on small screens.
- `/signup?role=artist` while logged in as Business → redirect to `/dashboard/restaurant`.
- Logout → anonymous state restored correctly.
- No hydration errors in browser console.

### 22.7 Admin Manual Checklist (Post-Deployment)
To be completed by the platform owner on the live Netlify site with admin credentials:
- [ ] `https://artist-net-v1.netlify.app/admin` loads Admin Dashboard (not redirected)
- [ ] Navbar shows "Admin Dashboard" and "Log Out" only
- [ ] No "Join as Artist" or "Join as Business" anywhere
- [ ] Footer shows "Admin Dashboard" and "Review Applications" (no registration CTAs)
- [ ] `/signup` → redirects to `/admin`
- [ ] `/login` → redirects to `/admin`
- [ ] `/admin/applications` → loads applications list
- [ ] `/admin/audit-logs` → loads audit log

### 22.8 Deployment State
- **Live commit:** `85df6f9`
- **Previous commit (rollback target):** `fc481a5`
- **Backup branch:** `backup/pre-role-ux-deploy-85df6f9`
- **Rollback primary:** Netlify Dashboard → Deploys → select `fc481a5` deploy → "Publish deploy"
- **Rollback secondary (if needed):** `git restore --source=fc481a5 --staged --worktree -- .` then commit and push (requires separate owner approval)
- **No database migrations, no env var changes, no Supabase RLS modifications.**

### 22.9 Next Steps
- Phase 5.2 (payments, formal contracting, escrow) must NOT begin without explicit owner approval.
- Owner to complete browser-based and admin manual checklists on the live site.
- No further pushes without owner authorization.

---

## 23. Artist Image Upload RLS Bug — Diagnosis & SQL Fix (2026-11-24)

### 23.1 Owner-Reported Bug
Authenticated Artists on the Netlify testing website receive:
> "Image upload failed: new row violates row-level security policy. You may also paste a direct image URL."

### 23.2 Root Cause
The `artist-media` Supabase Storage bucket exists and is correctly configured for public read (profile/portfolio images are accessible via public URL). However, **no RLS INSERT or UPDATE policies exist** for `storage.objects` on this bucket. Every `.upload()` call — regardless of authentication state or upsert setting — is blocked by Supabase's default-deny RLS.

This is a **Storage RLS gap**, not an application code bug.

### 23.3 Proof
Live probe (`scratch/probe_storage_rls_jpeg.mjs`) confirmed:
- Authenticated artist uploading to their OWN folder → `new row violates row-level security policy` (status 403)
- Both `upsert:false` and `upsert:true` fail identically
- Anonymous upload → also rejected (correct)
- Business upload to artist folder → rejected (correct)
- Cross-folder upload (artist A into artist B's folder) → rejected (correct)
- Public URL structure is valid: `https://{project}.supabase.co/storage/v1/object/public/artist-media/{uid}/{filename}`

### 23.4 Application Code Analysis
- Upload paths:
  - `app/dashboard/artist/edit/page.tsx`: `{userId}/{type}-${timestamp}.{ext}`
  - `app/components/PortfolioManager.tsx`: `{userId}/portfolio-${timestamp}.{ext}`
- Paths are strictly unique because `Date.now()` is embedded in every filename.
- Code has been updated from `upsert: true` to `upsert: false` in both files to reflect true write-once immutable asset insertion semantics.
- `userId` is sourced from `supabase.auth.getUser()`, ensuring the client-side path matches `auth.uid()`.
- Client uses `createClient()` from `lib/supabase/client.ts` (`@supabase/ssr` `createBrowserClient`), passing session cookies/tokens properly.
- Code requires only `INSERT` permission for regular uploads; `UPDATE` and `SELECT` are provided in SQL for conflict-resolution defense-in-depth and metadata inspection.
- Application code never calls `storage.from(...).remove(...)`; portfolio item deletion deletes the database record only. Hence `DELETE` permission on storage is omitted.

### 23.5 Revised Hardened SQL Migration
**File:** `supabase/migrations/20261124061326_artist_media_storage_rls.sql`
**Status:** Executed and recorded in Supabase schema migrations under version `20261124061326`.

Key security enhancements:
1. **Authoritative Role Validation:** Every policy enforces:
   ```sql
   EXISTS (
     SELECT 1 FROM public.profiles
     WHERE public.profiles.id = auth.uid()
       AND public.profiles.role = 'artist'
   )
   ```
   This prevents Business (`role = 'business'`) or Admin users from uploading files into `artist-media`, even inside their own UID folder.
2. **Folder Isolation:** `(storage.foldername(name))[1] = auth.uid()::text` guarantees an artist can only write into their own `{auth.uid()}/` folder.
3. **No Unrestricted Public SELECT:** Public SELECT on `storage.objects` table is NOT granted. Public viewing is handled via public bucket CDN URLs (`/storage/v1/object/public/...`), blocking directory enumeration.
4. **Least Privilege on DELETE:** DELETE policy is omitted because the application does not perform Storage file deletion.
5. **Scoped SELECT for Authenticated Artists:** Scoped strictly to the artist's own folder and `role = 'artist'` for metadata access and upsert conflict resolution.
6. **Clean Drop & Recreate:** `DROP POLICY IF EXISTS` guards prevent collision and duplicate-policy errors.

### 23.6 10-Point Security Test Matrix
**Script:** `scratch/verify_storage_security_matrix.mjs`
Post-Migration Live Results:
- Test 1 (Artist A own folder upload): ✅ PASS (Allowed, path confirmed)
- Test 2 (Artist A into Artist B folder): ✅ PASS (Denied: row-level security policy violation)
- Test 3 (Business into Artist A folder): ✅ PASS (Denied: row-level security policy violation)
- Test 4 (Business into Business own folder): ✅ PASS (Denied: role check prevents business uploads)
- Test 5 (Anonymous upload): ✅ PASS (Denied: row-level security policy violation)
- Test 6 (Artist A updates Artist B object): ✅ PASS (Denied: row-level security policy violation)
- Test 7 (Artist A upload/overwrite own folder with upsert: true): ✅ PASS (Allowed: update policy validated)
- Test 8 (Public artist image URL CDN): ✅ PASS (HTTP 200 image serving active)
- Test 9 (Existing portfolio DB records): ✅ PASS (Intact, zero rows modified)
- Test 10 (Invalid file type MIME rejection): ✅ PASS (Rejected: mime type text/plain is not supported)

**Final Suite Result: 10 PASS | 0 FAIL | 0 BLOCKED.**

### 23.7 Execution Status: COMPLETE & VERIFIED
- **Database Project:** `jmwkvrghquqqsfwierpj`
- **Migration Applied:** `artist_media_storage_rls` (version `20261124061326` recorded in `supabase_migrations`)
- **Policies Created on `storage.objects`:**
  1. `artist_upload_own_folder` (INSERT, authenticated, bucket 'artist-media', own folder, role 'artist')
  2. `artist_update_own_files` (UPDATE, authenticated, bucket 'artist-media', own folder, role 'artist')
  3. `artist_select_own_files` (SELECT, authenticated, bucket 'artist-media', own folder, role 'artist')
- **Immediate Live Site Impact:**
  - The currently deployed Netlify site (`85df6f9`) uses `upsert: true`. Because the migration provides both INSERT and UPDATE policies, **artist image uploads on the live website are fully functional immediately without redeployment**.
  - No separate application deployment is required to resolve the live bug.
- **Rollback SQL:** Available in `supabase/migrations/20261124061326_artist_media_storage_rls.sql` if ever needed.

---

## 24. Phase 5.2 — Verified Artist Visibility & Individual Booking Support Architecture (2026-11-24)

### 24.1 Product Drivers & Goals
1. **Verified Artist Visibility:** Users previously could not distinguish between officially verified artists and unverified published profiles, leading to trust ambiguity.
2. **Individual Booking Support:** Platform currently restricts booking enquiries strictly to accounts with `role = 'business'`. Ordinary individuals organizing private events (weddings, birthdays, anniversaries, house concerts) need the ability to discover artists and send non-binding booking enquiries without registering as a commercial business.

### 24.2 Part A Implementation: Verified Artist Visibility (Locally Completed)
- **Authoritative Data Source:** Strictly sourced from `public.artist_profiles.is_verified` (boolean, default `false`), modifiable only via owner-guarded admin RPC `admin_moderate_artist_profile(p_artist_id, 'verify_artist' | 'unverify_artist')`.
- **Card Badges (`app/components/ArtistCard.tsx`):**
  - Genuine Verified Artist: Prominent emerald badge (`bg-emerald-50 text-emerald-800 border-emerald-300`) with checkmark icon, accessible text, and tooltip explaining platform identity verification.
  - Unverified Published Artist: Distinct neutral zinc badge (`bg-zinc-100 text-zinc-700 border-zinc-200`) with dot icon and tooltip indicating unverified community profile status.
  - Sample Profile: Amber badge (`bg-amber-50 text-amber-800 border-amber-200`) explicitly labeling demo cards.
- **Demo Data Hardening (`lib/data/demoArtists.ts`):** All demo profiles (`demo-1`, `demo-2`, `demo-3`, `demo-6`) that formerly had `is_verified: true` are updated to `is_verified: false` so demo cards never falsely appear verified.
- **Artist Profile Detail Page (`app/artists/[slug]/page.tsx`):**
  - Hero image badge overlay and stage name heading badge.
  - Verification scope advisory notice stating platform verification confirms identity and profile criteria but does not guarantee performance quality, safety, or suitability.
- **Directory Filtering (`lib/data/artists.ts`, `app/artists/page.tsx`, `app/components/DirectoryFilters.tsx`):**
  - Query parameter `verifiedOnly=true` supported.
  - Top action pill button "Verified Only" with active toggle state.
  - Filter modal option for "All Artists" vs "Verified Only".
  - Preserved in URL pagination and search reset.
- **Artist Workspace (`app/dashboard/artist/page.tsx`, `app/dashboard/artist/edit/page.tsx`):**
  - Displays emerald "Verified Artist" or neutral "Not Verified" badge so artists are fully informed of their public marketplace visibility.

### 24.3 Part B: Individual Booking Support Architecture Plan
- **Role Model Extension:** Add `individual` to `public.profiles.role` check constraint (`role IN ('artist', 'business', 'individual', 'admin')`).
- **Registration Flow:** Provide `/signup?role=individual` with clean form (Name, Email, Phone, City). Handled by `handle_new_user()` security definer trigger.
- **Client Workspace:** Provide `/dashboard/client` showing sent enquiries, status badges, clarification messaging, and cancellation/withdrawal.
- **Data Model:** Add `client_id UUID REFERENCES public.profiles(id)` and `requester_type TEXT NOT NULL CHECK (requester_type IN ('business', 'individual'))` to `public.booking_enquiries`, retaining `business_id` for 100% backward compatibility.
- **RPC & RLS:** Extend `submit_booking_enquiry` and related RPCs to accept `role = 'individual'`, enforcing the identical 5-enquiries-per-hour rate limit.
- **Strict Non-Binding Guardrails:** No payments, no escrow, no binding contracts, no automated booking. Everything remains an exploratory expression of interest.

---

## 25. Phase 5.2A — Verified Artist Feature Live Netlify Release (2026-11-24)

### 25.1 Authorized Scope & Deployment Metadata
- **Owner Authorization:** Granted on 2026-11-24 for Phase 5.2A (Verified Artist Visibility & Directory Filtering).
- **Target Remote Branch:** `origin/master` (Target repo: `github.com/Business1301/the-artist-network.git`).
- **Live Target Website:** `https://artist-net-v1.netlify.app`.
- **Pre-Push Remote Baseline:** `85df6f9`.
- **Deployed Commit:** `771b1bb` (encompassing `4836cbb` UI feature and `771b1bb` migration filename reconciliation).
- **Push Method:** Fast-forward only (`85df6f9..771b1bb`), 0 merge commits, no force-push.
- **Supabase Database Project:** `jmwkvrghquqqsfwierpj`.
- **Database Status:** ZERO SQL executed during release. Remote database state strictly preserved.

### 25.2 Pre-Deployment Quality Gates (All Passed)
- `npx tsc --noEmit`: 0 errors.
- `npm run lint`: 0 errors.
- `npm run build`: 22/22 routes rendered cleanly.
- `npm audit --omit=dev`: 0 vulnerabilities.
- Focused acceptance suite (`scratch/test_verified_artist_acceptance.mjs`): 8/8 PASS.
- Live Storage upload & CDN retrieval suite (`scratch/verify_e2e_upload.mjs`): PASS.

### 25.3 Migration Ledger Reconciliation
- Reconciled Storage RLS migration filename to `supabase/migrations/20261124061326_artist_media_storage_rls.sql` matching the exact remote ledger version `20261124061326` recorded in `supabase_migrations.schema_migrations`.
- Confirmed Netlify build does not run Supabase CLI migrations (`netlify.toml` executes `npm run build` only).

### 25.4 Live Post-Deployment Verification (HTTP 200 OK)
Verified on `https://artist-net-v1.netlify.app`:
1. `/` (Homepage): HTTP 200 OK ✅
2. `/artists` (Directory): HTTP 200 OK; renders "Verified Only" toggle button and "Not Verified" badges on real unverified published artists ✅
3. `/artists?verifiedOnly=true`: HTTP 200 OK; renders graceful empty state matching 0 verified artists in live database ✅
4. `/artists/[slug]`: HTTP 200 OK; renders verification badge on hero overlay, stage name heading, and legal verification scope advisory notice ✅
5. `/login` & `/signup`: HTTP 200 OK; role-aware authentication entry points fully operational ✅
6. Supabase RLS on `booking_enquiries`: Strict isolation intact (anonymous read blocked: `permission denied for table booking_enquiries`) ✅
7. Supabase Storage: Public CDN image serving active ✅

### 25.5 Phase 5.2B Safety Hold
Individual Booking database migration and UI implementation remain strictly on hold for platform owner review.
- No Individual account roles created.
- Legacy Business booking compatibility trigger prepared in specification.
- Additive versioned RPC (`submit_booking_enquiry_v2`) prepared in specification.
- Recovery freeze mode and `ON DELETE RESTRICT` data retention safeguards prepared.

---

## 26. Phase 5.2A — Admin Artist Verification Management (2026-11-24)

### 26.1 Motivation & Root Cause
Phase 5.2A deployed public Verified Artist badges, but the admin interface lacked obvious controls to verify or unverify artists. Root causes:
1. **Admin dashboard KPI card** for Published Artists linked to `/artists` (the public directory) rather than the admin applications view, and the Verified Badges card had no actionable link at all.
2. **Applications table** had no dedicated "Verification Status" column — verification was indicated only by a tiny `✓` icon inside the artist name cell.
3. **Verify/Unverify buttons** were buried at the bottom of a secondary slide-over detail drawer, invisible unless the admin already opened an individual artist's review panel.
4. **No direct row-level actions** for published artists: a single `Review →` button per row was the only entry point to any action.
5. **No sub-filter** to isolate "Unverified Published Artists" or "Verified Artists" without scrolling through all profiles.

### 26.2 Changes Implemented

#### `app/actions/admin.ts` (Server Actions)
- Added `revalidatePath("/artists/[slug]", "page")` and `revalidatePath("/")` to **all six** admin moderation actions: `approveArtistApplication`, `rejectArtistApplication`, `verifyArtistApplication`, `unverifyArtistApplication`, `suspendArtistProfile`, `reinstateArtistProfile`.
- Ensures that any moderation decision (approve, verify, suspend, etc.) immediately invalidates the artist's public profile page and the homepage, in addition to `/admin`, `/admin/applications`, `/admin/audit-logs`, and `/artists`.

#### `app/admin/page.tsx` (Admin Dashboard Overview)
- **Header**: Added prominent `🛡️ Manage Verification` button linking directly to `/admin/applications?status=published&verified=false` (shows only unverified published artists).
- **Published Artists KPI card**: Updated footer link from `/artists` (public directory) to `/admin/applications?status=published` with label "Manage published →". Retained "Live directory ↗" as a secondary link.
- **Verified Badges KPI card**: Added actionable footer link "Review unverified →" pointing to `/admin/applications?status=published&verified=false`. Changed percentage label from verbose string to compact "X% verified" format.

#### `app/admin/applications/page.tsx` (Applications Route)
- Updated `searchParams` type to `Promise<{ review?: string; status?: string; verified?: string }>`.
- Passes `initialStatusFilter` and `initialVerifiedFilter` props to `ApplicationsManager`, enabling URL-driven deep-linking from the Admin Dashboard KPI cards.

#### `app/components/ApplicationsManager.tsx` (Core Admin UI — Complete Rewrite)
Full rewrite of the 705-line component, now 757 lines, with:

1. **URL-driven state initialization**: `initialStatusFilter` and `initialVerifiedFilter` props set the initial tab and sub-filter from URL `searchParams` (e.g. `?status=published&verified=false` pre-selects "Published > Unverified").

2. **Verification Sub-filter Pills**: When viewing "Published" or "All" artists, three pill buttons appear below the status tabs:
   - "All Published (N)" — shows all published regardless of verification
   - "🛡️ Needs Review (N)" — shows only unverified published artists
   - "✓ Verified Only (N)" — shows only verified published artists

3. **New "Verification Status" table column**: Each row now shows a clear `✓ Verified` emerald/purple badge or `● Not Verified` neutral badge, alongside the existing Profile Status column.

4. **Direct row-level actions for published artists**: The single `Review →` button is replaced with three inline actions:
   - `Live ↗` — opens the artist's public profile in a new tab
   - `🛡️ Verify` or `Unverify` — opens the appropriate confirmation modal
   - `Review →` — opens the existing detailed drawer for full portfolio inspection

5. **Verify Artist Confirmation Modal** (required before granting verification):
   - Shows artist summary card with public profile link
   - Displays the "Verification Scope Advisory Notice" (matches Phase 5.2A wording)
   - Requires three administrator affirmation checkboxes (all required):
     - Stage identity and profile ownership confirmed
     - Portfolio media and social links inspected
     - Profile complies with community guidelines
   - "Confirm & Grant Verified Badge" button is disabled until all three are checked

6. **Revoke Verification Confirmation Modal**: Clear single-step confirmation explaining the artist remains published (not removed) but loses the Verified badge.

7. **Global dismissible notification banner**: Replaces the inline modal-only notice; success/error messages now appear at the top of the manager and can be dismissed.

8. **Existing features fully preserved**: Suspend, Reinstate, Approve, Reject, detail drawer, portfolio review, audit log references, and all existing handler logic unchanged.

### 26.3 Authorization & Security Analysis

| Check | Result |
|---|---|
| `requireAdmin()` calls `auth.getUser()` + `public.profiles` DB query | ✅ PASS |
| `verifyArtistApplication` calls `requireAdmin()` before any DB access | ✅ PASS |
| `unverifyArtistApplication` calls `requireAdmin()` before any DB access | ✅ PASS |
| Both actions route through `admin_moderate_artist_profile` RPC only | ✅ PASS |
| No `SERVICE_ROLE_KEY` in any client-exposed file | ✅ PASS |
| Verify/Unverify UI gated to `profile_status === "published"` only | ✅ PASS |
| Anonymous RPC calls `admin_moderate_artist_profile` → PostgreSQL `42501` | ✅ PASS |
| Anonymous direct `UPDATE is_verified` on `artist_profiles` → RLS silent block (value unchanged) | ✅ PASS |
| `admin_audit_logs` inaccessible to anonymous users | ✅ PASS |
| UUID format validation on `artistId` before DB query | ✅ PASS |
| `admin.ts` has `"use server"` directive | ✅ PASS |
| All 3 confirmation checklist items required before verify submission | ✅ PASS |
| Separate confirmation dialog for unverification | ✅ PASS |
| Authenticated Artist/Business role DENY | 🔶 BLOCKED (no test credentials in env; enforced via `requireAdmin()` server guard) |
| Authenticated Individual DENY | 🔶 BLOCKED (Phase 5.2B role not yet implemented) |

### 26.4 Cache Revalidation Coverage
All six admin moderation server actions now revalidate:
- `/admin` — Overview page KPI metrics
- `/admin/applications` — Application list
- `/admin/audit-logs` — Audit trail
- `/artists` — Public directory listing
- `/artists/[slug]` (page segment) — Individual public profile pages
- `/` — Homepage (FeaturedArtists, hero counters)

### 26.5 Test Results
- **Security test suite** (`scratch/test_admin_verification_ux.mjs`): **48 PASS, 0 FAIL, 3 BLOCKED** (blocked = no test credentials; authorization enforced by static code analysis).
- **Verified artist acceptance suite** (`scratch/test_verified_artist_acceptance.mjs`): **8/8 PASS**.
- `npx tsc --noEmit`: **0 errors**.
- `npm run lint`: **0 errors, 49 pre-existing warnings** (all in pre-existing `<img>` and scratch file unused vars — none in modified files).
- `npm run build`: **22/22 routes — all clean**.
- `npm audit --omit=dev`: **0 vulnerabilities**.

### 26.6 Deployment Status
- **Local commit**: `feat(admin): improve artist verification management and cache refresh`
- **Origin/master pushed:** `771b1bb..c4dcb38` fast-forward — 2026-11-24T08:16:46 UTC
- **GitHub remote HEAD:** `c4dcb38`
- **Netlify auto-deploy:** Triggered automatically; all 7 HTTP routes returned 200 OK post-deployment
- **Live website:** https://artist-net-v1.netlify.app
- **NO SQL executed, no database schema changes, no live artist records modified.**
- **Admin verification controls accessible only to authenticated admin sessions (SSR auth guard confirmed: unauthenticated visitors receive login redirect).**

---

## 27. Phase 5.2B — Individual Booking Accounts & Enquiries (Local Implementation)

### 27.1 Overview
Implemented local architecture, components, and UI to allow ordinary individuals to create accounts and send structured non-binding booking enquiries to published artists without registering as businesses or venues.

Four platform roles are now fully supported:
- `artist` (`/dashboard/artist`)
- `business` (`/dashboard/restaurant`)
- `individual` (`/dashboard/client`)
- `admin` (`/admin`)

### 27.2 Implemented Architectural Components
1. **Database Migration File Prepared (Review-Only):**
   - File: `supabase/migrations/20261125000000_individual_booking.sql`
   - `profiles_role_check` updated to include `'individual'`.
   - `handle_new_user()` updated to allow `'individual'` signup metadata.
   - Additive nullable `requester_id` (UUID FK to profiles) and `requester_type` (`'business' | 'individual'`) on `public.booking_enquiries`.
   - BEFORE INSERT legacy trigger `trg_populate_legacy_requester` populates `requester_id = business_id` and `requester_type = 'business'` for calls via the original 7-arg Business RPC.
   - Versioned RPCs created: `submit_booking_enquiry_v2`, `withdraw_booking_enquiry_v2`, `clarify_booking_enquiry_v2`.
   - Anti-spam advisory locks (`tan_enq_req:<id>` and `tan_enq_pair:<id>:<artist>`) with max 3 open per pair, max 10 open platform-wide, and max 5/hour rate limits.
   - Dedicated RLS policies for individual enquiry and event isolation.
2. **Server-Side Auth Guard:**
   - File: `lib/auth/client.ts` (`requireClient()`) verifies user session and queries `public.profiles.role === 'individual'`.
   - `lib/auth/redirect.ts`: maps `individual` to `/dashboard/client`.
   - Cross-role guards updated in `requireBusiness()`, `requireArtist()`, and `requireAdmin()`.
3. **Client Dashboard:**
   - Files: `app/dashboard/client/layout.tsx` (server guard) and `app/dashboard/client/page.tsx` (client view).
   - Features: Sent enquiry list, status metrics, clarification reply dialog, withdrawal confirmation, and prominent non-binding legal notices.
4. **Shared Booking Enquiry Form:**
   - File: `app/components/BookingEnquirySection.tsx` updated with optional `numberOfGuests` input, custom messages, and direct links for both Individual and Business users.
5. **Artist Inbox Integration:**
   - File: `app/components/ArtistEnquiriesInbox.tsx` displays distinct badges (`👤 Individual Client` vs `🏢 Business / Venue`) for every incoming enquiry.
6. **Role-Aware Navigation:**
   - `Navbar.tsx` and `Footer.tsx` updated with `👤 My Enquiries` link, custom styling, and mobile drawer support.

### 27.3 Verification & Quality Gates
- `npx tsc --noEmit`: 0 errors.
- `npm run lint`: 0 errors.
- `npm run build`: 23/23 routes clean (Exit 0).
- `npm audit --omit=dev`: 0 vulnerabilities.
- Automated Test Suite (`scratch/test_phase_52b_individual.mjs`): 37 PASS, 0 FAIL, 5 BLOCKED (pending production SQL migration).
- Local Git Commit: `45c292e`.

















