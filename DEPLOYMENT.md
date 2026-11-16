# The Artist Network — Production Deployment Guide (Free Tier)

This guide provides step-by-step instructions for deploying **The Artist Network** on a **100% Free Tier platform** with zero server costs, automated SSL, continuous GitHub integration, and full support for Next.js 16 App Router, Server Actions, and Supabase Authentication.

---

## 1. Platform Comparison & Recommendation

| Platform | Free Tier Cost | Commercial Use Allowed? | Cold Starts? | Next.js 16 App Router Support | Recommendation |
|---|---|---|---|---|---|
| **Netlify** (Recommended) | **$0 / month** (Starter) | **YES** ✅ | **No** (Instant) | Full support via Next.js Runtime v5 | **Best Choice for ₹0 Commercial Deployment** |
| **Vercel** | $0 / month (Hobby) | Personal/Non-commercial only ⚠️ | **No** (Instant) | Native | Great for MVP/Preview; Pro ($20/mo) required once monetized |
| **Cloudflare Pages** | $0 / month | YES ✅ | **No** (Instant) | Requires OpenNext adapter | Complex setup for Next.js 16 |
| **Render** | $0 / month | YES ✅ | **Yes (50s delay)** ❌ | Docker / Node | Unsuitable due to 15-min idle spin-down |

### Why Netlify is the Best Free-Tier Choice:
1. **Commercially Compliant**: Netlify’s Starter plan allows commercial, marketplace, and startup projects at $0/month.
2. **Generous Free Allowances**: 100 GB bandwidth/month, 300 build minutes/month, unlimited static requests.
3. **Zero Cold Starts**: Server Actions and dynamic routes run on serverless edge functions with instant response times.
4. **Automated CI/CD**: Every push to your GitHub `master` branch automatically builds and deploys.

---

## 2. Option A: Deploying on Netlify (Recommended)

### Step 1: Push Code to GitHub
Ensure your local code is committed and pushed to your private GitHub repository:
```bash
git add .
git commit -m "chore: add netlify deployment configuration"
git push origin master
```

### Step 2: Sign Up / Log In to Netlify
1. Visit [netlify.com](https://www.netlify.com).
2. Click **Sign Up** and choose **Sign up with GitHub**.

### Step 3: Import Your Repository
1. In the Netlify dashboard, click **"Add new site" → "Import an existing project"**.
2. Select **GitHub** as your Git provider.
3. Authorize Netlify and select your repository: **`Business1301/the-artist-network`**.

### Step 4: Configure Build Settings
Netlify will auto-detect Next.js via [`netlify.toml`](./netlify.toml):
- **Base directory**: (leave blank / root)
- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Functions directory**: (leave default)

### Step 5: Add Environment Variables
Before clicking deploy, expand **"Add environment variables"** and add:

| Key | Value | Where to find it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | From your local `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJh...` | From your local `.env.local` |
| `NODE_VERSION` | `20` | Pre-configured in `netlify.toml` |

> [!CAUTION]
> **Zero Secrets Required:** Do **NOT** add database master passwords or `SUPABASE_SERVICE_ROLE_KEY`. The frontend and Server Actions only use the public URL and anon key; security is enforced at the database level by Row Level Security (RLS).

### Step 6: Deploy Site
1. Click **"Deploy the-artist-network"**.
2. Netlify will build the site (typically takes 1.5–2 minutes).
3. Once finished, Netlify will assign a live URL (e.g. `https://the-artist-network.netlify.app`).

---

## 3. Option B: Deploying on Vercel (Alternative for Pre-Revenue MVP)

If you prefer Vercel for initial pre-revenue testing before commercial monetization:

1. Visit [vercel.com](https://vercel.com) and log in with GitHub.
2. Click **"Add New..." → "Project"**.
3. Import **`Business1301/the-artist-network`**.
4. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Under **Deployment Protection**, enable **Vercel Authentication (All Deployments)** if you want to keep the preview private to your team.
6. Click **Deploy**. Vercel will assign a URL (e.g. `https://the-artist-network.vercel.app`).

---

## 4. CRITICAL: Supabase Authentication Configuration

Regardless of whether you choose Netlify or Vercel, you **must update your Supabase Auth settings** so that login redirects, email confirmations, and password resets work on your live domain:

1. Open the [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **Authentication → URL Configuration**.
3. **Site URL (Canonical Production Domain)**:
   Set this to your live domain:
   - For Netlify: `https://your-site-name.netlify.app`
   - For Vercel: `https://your-site-name.vercel.app`
   - For Custom Domain: `https://yourdomain.com`
4. **Redirect URLs Allowlist**:
   Add the following patterns (one per line) to support branch previews and local testing:
   ```
   https://your-site-name.netlify.app/**
   https://*.netlify.app/**
   https://your-site-name.vercel.app/**
   http://localhost:3000/**
   ```
5. Click **Save**.

---

## 5. Adding a Custom Domain (Optional & Free)

Both Netlify and Vercel allow adding your own custom domain (e.g., `theartistnetwork.in` or `.com`) for free with automatic SSL:

### On Netlify:
1. Go to **Site Configuration → Domain management**.
2. Click **"Add a domain"** and enter your registered domain.
3. In your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.), add the DNS records:
   - **Apex domain (`@`)**: Points to Netlify's load balancer IP (`75.2.60.5`) or ALIAS record.
   - **Subdomain (`www`)**: CNAME pointing to `your-site-name.netlify.app`.
4. Netlify will automatically provision a free Let's Encrypt SSL certificate within a few minutes.

---

## 6. Verification Checklist After Deployment

Test the following directly on your live URL:

- [ ] **Homepage (`/`)**: Loads with HTTP 200, category cards and featured artists render.
- [ ] **Directory (`/artists`)**: Real database artists appear, search and category filters work.
- [ ] **Artist Profile (`/artists/[slug]`)**: Profile info, rates, YouTube videos, and photos display.
- [ ] **Social Media Links**: Instagram and YouTube buttons open in a new tab with proper handles.
- [ ] **Artist Signup & Login**: New artist registration works, redirects to `/dashboard/artist`.
- [ ] **Business Signup & Login**: Business registration works, redirects to `/dashboard/restaurant`.
- [ ] **Artist Profile Editor (`/dashboard/artist/edit`)**: Draft saving and self-publishing work.
- [ ] **Artist Calendar (`/dashboard/artist/calendar`)**: Month/Week view renders, conflict modal triggers on overlap, past bookings are rejected.
- [ ] **Admin Dashboard (`/admin`)**: Accessible only to the verified platform owner; non-admins are redirected.
- [ ] **Security Headers**: Inspect DevTools Network tab; confirm `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff`.
- [ ] **Browser Console**: Zero unhandled exceptions or hydration warnings.

---

## 7. Safe Rollback Procedure

If a bug is pushed to production:
- **On Netlify**: Go to **Deploys** → click any previous working deploy → click **"Publish deploy"**. The site will instantly revert to the previous version with zero downtime.
- **On Vercel**: Go to **Deployments** → click the `...` menu on a prior deployment → click **"Instant Rollback"**.

