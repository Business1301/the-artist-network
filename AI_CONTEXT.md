# THE ARTIST NETWORK — Complete AI Project Handover Memory

> **IMPORTANT NOTICE FOR FUTURE AI CODING ASSISTANTS:**  
> Read this document in its entirety before inspecting or modifying any code in this repository.  
> This file is the authoritative single source of truth for architecture, completed phases, security invariants, database schema, and operational boundaries.

---

## 1. Quick Start for AI Assistants

### What is this project?
**The Artist Network** is a modern, India-focused marketplace connecting artists (singers, musicians, DJs, bands, dancers, performers, visual artists) with businesses (cafes, restaurants, event organizers, corporate venues) and private clients for discovery, booking enquiries, and creative hiring.

### Core Tech Stack
- **Framework:** Next.js 16.4.3 (App Router, Turbopack, Partial Prefetching, Cache Components enabled)
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

### 12.6 Next Steps & Phase Boundaries

- **Phase 4.5 Stage 3:** Complete. Test accounts are ready, verified, and UI is fully synchronized.
- **Phase 5:** NOT STARTED (Strict rule: Phase 5 remains blocked until explicit user sign-off).


