# The Artist Network — Project AI Instructions

> **MANDATORY:** Read `AI_CONTEXT.md` and `PROJECT_PLAN.md` in full before any substantial development work.
> These documents are the authoritative source of platform architecture, completed phases, and pending work.

## Project Overview

The Artist Network is a multi-role marketplace platform connecting artists with restaurants and businesses.
Built with Next.js 16 (App Router, Turbopack), Supabase (PostgreSQL + RLS + Auth), and TypeScript.

## Critical Security Rules

**These rules are non-negotiable and must be enforced in every code change:**

1. **Never trust `user_metadata` for authorization.** Always read account roles from `public.profiles` only.
2. **Never allow admin self-registration or role self-promotion.** Admin accounts are created exclusively via the Supabase Dashboard SQL Editor by the platform owner.
3. **Preserve Supabase RLS policies, security triggers, and atomic moderation RPCs.** Never disable or weaken row-level security.
4. **Never expose passwords, `service_role` keys, `SUPABASE_SERVICE_ROLE_KEY`, or any secrets** in code, logs, or committed files.
5. **Never execute production SQL or modify real user accounts without explicit written approval** from the platform owner.
6. **Authorization guards (`requireAdmin`, `requireArtist`, `requireBusiness`) must always verify** via `supabase.auth.getUser()` + `public.profiles` DB query — cookie presence alone is never sufficient.
7. **Keep `.env.local` and all `.env*` files out of Git** (enforced by `.gitignore`). Never commit credentials.

## Development Standards

- **TypeScript:** Run `npx tsc --noEmit` after every code change. Zero errors required.
- **ESLint:** Run `npm run lint` after every code change. Zero new errors (pre-existing `<img>` warnings are acceptable).
- **Build:** Run `npm run build` to verify production build passes before reporting task completion.
- **Update `AI_CONTEXT.md`** after every significant implementation change. It is the platform handover document.
- **Work only on approved development phases.** Never start Phase 5 or later without explicit user sign-off.
- **Preserve all existing features, responsive UI, and mobile navigation** unless explicitly asked to change them.
- **Keep operating costs as close to ₹0 as possible.** Prefer free tiers, minimal API calls, and SSR caching.

## Architecture Quick Reference

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) — has breaking changes from prior versions |
| Database | Supabase PostgreSQL with RLS |
| Auth | Supabase Auth (SSR cookies via `@supabase/ssr`) |
| Session proxy | `lib/supabase/proxy.ts` (not `middleware.ts`) |
| Auth guards | `lib/auth/admin.ts`, `lib/auth/artist.ts`, `lib/auth/business.ts` |
| Server actions | `app/auth/actions.ts` |
| Navbar SSR | `getCurrentUser()` called in async server page components, passed as `initialUser` |

## Next.js 16 Conventions (Breaking Changes)

- Use `lib/supabase/proxy.ts` — **not** `middleware.ts`
- Use `export const instant = false` — **not** `dynamic = "force-dynamic"`
- Read the relevant guide in `node_modules/next/dist/docs/` before writing new Next.js code
- `cacheComponents: true` is active — stateful logic must stay in client components

## Role Hierarchy

| Role | Verified In | Dashboard |
|------|------------|-----------|
| `admin` | `public.profiles.role` | `/admin` |
| `artist` | `public.profiles.role` | `/dashboard/artist` |
| `business` | `public.profiles.role` | `/dashboard/restaurant` |

## Git Workflow

- **Never push to any remote** without explicit user approval.
- **Never rebase, force-push, or delete commits** without explicit approval.
- Commit messages should be descriptive (e.g., `fix: navbar auth state for public pages`).

---

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
