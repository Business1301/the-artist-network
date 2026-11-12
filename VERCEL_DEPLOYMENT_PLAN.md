# The Artist Network — Vercel Deployment Plan & Hosting Architecture

> **Document Status:** Authoritative Pre-Deployment Specification  
> **Target Version:** Commit `a7500f7` (Master branch)  
> **Framework:** Next.js 16.4.3 (App Router, Turbopack, Cache Components, PPR)  
> **Database & Auth:** Supabase Cloud (PostgreSQL 15+, RLS, SSR Auth Cookies)  
> **Security Policy:** Zero secret keys in client builds; fail-closed database authorization

---

## 1. Hosting Plan Compliance & Cost Analysis

The Artist Network is architected as an India-focused marketplace connecting artists with restaurants, venues, and event planners. Although Phase 5 (online booking transactions and escrow payments) is not yet active, the product is fundamentally a **commercial platform**.

### 1.1 Vercel Plan Assessment

| Plan | Monthly Cost | Commercial Use Permitted? | Assessment for The Artist Network |
|---|---|---|---|
| **Vercel Hobby** | Free ($0) | **NO** (Personal & non-commercial use only) | **Permitted strictly for private, non-commercial development evaluation**. Vercel terms of service explicitly prohibit commercial websites, marketplaces, and monetization ventures on Hobby. Deploying a public marketplace on Hobby risks automated account suspension. |
| **Vercel Pro** | **$20 / month** per team member (~₹1,680/mo) | **YES** | **Recommended for official production deployment**. Includes commercial licensing, Vercel Deployment Protection (password/SSO protection for private staging), 1 TB bandwidth, custom environments, and 300-second serverless execution timeouts. |

### 1.2 Low-Cost & ₹0 Compliant Hosting Alternatives

If keeping operating costs as close to ₹0 as possible is a hard requirement (per `AGENTS.md`), consider these commercial-compliant alternatives:

1. **Self-Hosted VPS (Hetzner / DigitalOcean) with Coolify / Docker**:
   - **Cost:** ~€3.79/month (~₹340/month) on Hetzner Cloud (CX22: 2 vCPU, 4GB RAM, 40GB NVMe, 20TB traffic).
   - **Compliance:** 100% compliant for commercial use with zero per-seat fees.
   - **Capabilities:** Coolify provides a self-hosted Vercel-like experience (Git push-to-deploy, automatic SSL, preview environments).
2. **Cloudflare Pages / Workers (via OpenNext)**:
   - **Cost:** Free tier ($0) allows commercial usage (up to 100k requests/day, unlimited bandwidth).
   - **Trade-off:** Requires maintaining the `@opennextjs/cloudflare` adapter to support Next.js 16 App Router features.
3. **Netlify Starter**:
   - **Cost:** Free tier allows personal commercial projects up to 100GB bandwidth / 300 build minutes per month.

### 1.3 Recommended Phased Rollout
- **Phase A (Immediate Private Preview):** Deploy to Vercel with **Vercel Authentication / Deployment Protection enabled** for internal review and end-to-end verification.
- **Phase B (Public Commercial Launch):** Upgrade Vercel to Pro ($20/mo) OR containerize via Docker/Coolify on a ₹340/mo VPS.

---

## 2. Public Data Privacy & PostgREST Surface Analysis

### 2.1 Current State Audit
Live tests confirmed the following database security boundaries:
1. **Legal Names (`public.profiles`)**: Protected by RLS (`auth.uid() = id`). Anonymous REST queries return **0 rows**.
2. **Unpublished / Suspended Profiles (`public.artist_profiles`)**: Protected by RLS (`profile_status = 'published'`). Anonymous queries return **0 rows**.
3. **Direct Table Mutations (`artist_calendar_events`, `admin_audit_logs`)**: Table-level `INSERT, UPDATE, DELETE` permissions are completely revoked from `authenticated` and `anon`. All writes must route through `SECURITY DEFINER` RPCs.
4. **Calendar Availabilities**: No public availability API exists.

### 2.2 Rejection Reason Field Analysis
When an anonymous visitor sends an unrestricted PostgREST query:
```http
GET /rest/v1/artist_profiles?select=*
```
For published artists, `rejection_reason` is returned as a column key with a `null` value.
- **Why it is `null`**: The moderation RPC `admin_moderate_artist_profile` explicitly resets `rejection_reason = NULL` upon publication, and self-publishing requires a clean state.
- **Exposure Assessment**: Zero private rejection text is exposed. However, the schema metadata (the existence of the column) is visible.

### 2.3 Proposed Long-Term Hardening (Requires Approval Before Execution)

To achieve strict database-level column encapsulation without risking PostgREST runtime errors on application queries, the recommended architecture is a **Security Invoker View**:

```sql
-- DRAFT MIGRATION: 20261113_public_artist_directory_view.sql
-- DO NOT EXECUTE WITHOUT EXPLICIT PLATFORM OWNER APPROVAL

CREATE OR REPLACE VIEW public.public_artists
WITH (security_invoker = true)
AS
SELECT
  id,
  stage_name,
  slug,
  category,
  country,
  state,
  city,
  bio,
  experience_years,
  genres,
  specialities,
  languages,
  performance_types,
  starting_price,
  pricing_unit,
  profile_image_url,
  cover_image_url,
  instagram_url,
  youtube_url,
  is_verified,
  technical_requirements,
  created_at
FROM public.artist_profiles
WHERE profile_status = 'published';

-- Grant access on the sanitized view
GRANT SELECT ON public.public_artists TO anon, authenticated;
```

*Regression Plan:* `lib/data/artists.ts` can be updated to target `public.public_artists` instead of `artist_profiles` for anonymous directory searches. This guarantees that `rejection_reason`, internal audit timestamps, and draft states do not exist in the public view schema.

---

## 3. Session Cookie & Authentication Architecture

### 3.1 Actual Cookie Parameters

Inspection of `@supabase/ssr` (`node_modules/@supabase/ssr/dist/main/utils/constants.js`):

| Parameter | Configuration | Technical Explanation |
|---|---|---|
| **HttpOnly** | `false` | **Deliberately not HttpOnly by default in `@supabase/ssr`**. The client-side browser SDK (`createBrowserClient` in `lib/supabase/client.ts`) must read cookies from `document.cookie` to synchronize auth tokens between client components and realtime subscriptions. |
| **SameSite** | `lax` | Defends against Cross-Site Request Forgery (CSRF) for all cross-site sub-requests while allowing normal top-level navigation. |
| **Secure** | Browser Default (HTTPS) | Browsers automatically enforce the `Secure` flag on HTTPS origins in production. |
| **Path** | `/` | Cookie applies to all application routes. |
| **Max-Age** | 400 days | Browser cookie storage limit. The JWT access token itself expires in **1 hour** (3600 seconds) and is continuously rotated on the server by `proxy.ts`. |

### 3.2 Security Perimeter Independence from Anon Key

- The Supabase Anon Key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) is **public by design** and sent in every browser request.
- Platform security **never relies on the secrecy of the anon key**.
- The true security perimeter is enforced by:
  1. PostgreSQL Row Level Security (RLS) on every table.
  2. Database trigger invariants (`on_profiles_role_protection`, `on_artist_profile_protection`).
  3. `SECURITY DEFINER` RPCs with `SET search_path = ''`.
  4. Server-side session verification in Next.js Server Components and Server Actions (`requireAdmin`, `requireArtist`, `requireBusiness`) which read roles exclusively from `public.profiles`.

---

## 4. Step-by-Step Vercel Deployment Guide

### Step 1: GitHub Repository Setup
1. Create a **Private** repository on GitHub (e.g. `the-artist-network`).
2. Add your remote and push the `master` branch:
   ```bash
   git remote add origin https://github.com/<your-username>/the-artist-network.git
   git push -u origin master
   ```
   *(Wait for explicit authorization before executing).*

### Step 2: Import Project into Vercel
1. Log in to [vercel.com](https://vercel.com).
2. Click **"Add New..." → "Project"**.
3. Select your GitHub account and import `the-artist-network`.
4. Configure Project Settings:
   - **Framework Preset:** `Next.js` (auto-detected)
   - **Root Directory:** `./`
   - **Build Command:** `next build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

### Step 3: Configure Environment Variables in Vercel
In the Vercel Project Import screen (under **Environment Variables**), add the following:

| Key | Value Source | Environment Scope |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Copied from your local `.env.local` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Copied from your local `.env.local` | Production, Preview, Development |

> [!CAUTION]
> **Zero Secrets Required:** Do NOT add `SUPABASE_SERVICE_ROLE_KEY`, database passwords, or administrative credentials to Vercel. The application does not use them and does not require them.

### Step 4: Configure Vercel Deployment Protection (Private Preview)
To ensure the preview deployment is protected from public internet crawlers and unauthorized visitors:
1. In Vercel Project Dashboard, go to **Settings → Deployment Protection**.
2. Enable **Vercel Authentication** (limits access to your Vercel team) OR **Password Protection** (set a private viewer password).
3. This prevents any public indexing before final acceptance testing.

### Step 5: Update Supabase Auth Configuration
Once Vercel assigns your preview domain (e.g., `https://the-artist-network.vercel.app`):
1. Open the [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **Authentication → URL Configuration**.
3. Set **Site URL** to:
   `https://the-artist-network.vercel.app` (or your custom domain).
4. In **Redirect URLs**, add:
   - `https://the-artist-network.vercel.app/**`
   - `https://the-artist-network-*-your-team.vercel.app/**` (for preview branches)
   - `http://localhost:3000/**` (for ongoing local development)
5. Save changes.

### Step 6: Safe Rollback Procedure
If any unexpected issue occurs in production:
1. Go to **Vercel Dashboard → Deployments**.
2. Locate the previous working deployment.
3. Click the three dots `...` → **Instant Rollback**.
4. Traffic will redirect immediately to the selected prior deployment without re-building.

---

## 5. Environment Variable Reference

| Variable Name | Exposure | Required In Prod? | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-Public | **YES** | HTTPS endpoint for Supabase PostgREST, Auth, and Storage |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-Public | **YES** | Public API key routing client requests to Supabase Gateway |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-Public | Optional | Backward-compatible alias for the anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-Secret | **NO (STRICTLY PROHIBITED)** | Never used in this codebase |
| Database Password | Server-Secret | **NO** | Never stored in application environment |

---

## 6. End-to-End Deployment Verification Checklist

### Pre-Deployment Verification (Completed Locally ✅)
- [x] Working tree clean (`git status`)
- [x] TypeScript compiler passes (`npx tsc --noEmit` → 0 errors)
- [x] ESLint passes (`npm run lint` → 0 errors)
- [x] Production build passes (`npm run build` → 17/17 routes compiled)
- [x] Production npm audit clean (`npm audit --omit=dev` → 0 vulnerabilities)
- [x] Live HTTP security headers active (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`)
- [x] Runtime regression suite passed (16/16 checks)

### Post-Deployment Verification (Execute Immediately After Preview Deployment)

#### 1. Public Pages & Navigation
- [ ] **Homepage (`/`)**: Hero section loads, category pills functional, CTA button responds to guest state.
- [ ] **Artist Directory (`/artists`)**: Real database artists appear, search filter works, category tags filter accurately.
- [ ] **Artist Profile Showcase (`/artists/[slug]`)**: Dynamic metadata loads, bio, pricing, portfolio items, and technical rider display correctly.
- [ ] **Social Media Links**: Click Instagram icon → opens new tab with artist profile. Click YouTube icon → opens new tab with artist channel.
- [ ] **Opportunities Teaser (`/opportunities`)**: Static teaser renders with "Coming Soon" notice.

#### 2. Authentication & Onboarding
- [ ] **Artist Signup (`/signup?role=artist`)**: Registers new account with email confirmation / auto-sign-in.
- [ ] **Business Signup (`/signup?role=business`)**: Registers venue account.
- [ ] **Role Escalation Defense**: Form submit with invalid role is blocked with explicit error message.
- [ ] **Login (`/login`)**: Role-based redirect routes artist → `/dashboard/artist`, business → `/dashboard/restaurant`.
- [ ] **Logout**: Navbar logout button terminates session and resets UI to guest state.
- [ ] **Password Reset**: Reset request delivers email with working production return URL.

#### 3. Dashboards & Role Isolation
- [ ] **Artist Dashboard (`/dashboard/artist`)**: Displays live profile status, completeness progress, and quick action cards.
- [ ] **Artist Profile Editor (`/dashboard/artist/edit`)**: Saves profile draft, validates social URLs, updates rates.
- [ ] **Artist Self-Publishing**: Publishing checks completeness and updates status to `published`.
- [ ] **Artist Calendar (`/dashboard/artist/calendar`)**: Displays Month/Week view in Asia/Kolkata (IST).
- [ ] **Past-Booking Defense**: Attempting to create an event in the past is blocked with validation error.
- [ ] **Started Event Lock**: Historical events display lock notice; start/end times cannot be altered.
- [ ] **Conflict Flow**: Overlapping bookings prompt confirmation dialog; "Save Anyway" requires explicit consent.
- [ ] **Cross-Role Guard**: Artist accessing `/dashboard/restaurant` is redirected to `/dashboard/artist`.
- [ ] **Cross-Role Guard**: Unauthenticated visitor accessing `/dashboard/artist` is redirected to `/login?redirectTo=...`.

#### 4. Platform Administration (`/admin`)
- [ ] **Admin Route Guard**: Non-admin account accessing `/admin` is redirected to their authorized dashboard.
- [ ] **Admin Metrics**: Live database KPI cards display accurate counts.
- [ ] **Application Queue**: Moderation drawer allows inspecting artist submissions.
- [ ] **Moderation Actions**: Suspend / Reinstate / Verify actions update database atomically.
- [ ] **Audit Trail**: Every moderation action appends an immutable record to `/admin/audit-logs`.

#### 5. Network & Production Browser Console
- [ ] **Console Errors**: Open DevTools on production URL; verify zero unhandled exceptions, zero hydration mismatches, and zero `[ADMIN DEBUG]` logs.
- [ ] **HTTP Headers**: Inspect Network tab response headers; confirm `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff`.
- [ ] **Mobile Layout**: Verify navigation drawer, artist cards, and calendar view on 375px mobile viewport.
