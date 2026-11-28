import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getCanonicalSiteOrigin } from "@/lib/auth/origin";
import { isSupabaseConfigured } from "./client";

const URL_CREDENTIAL_PARAMS = [
  "access_token",
  "refresh_token",
  "provider_token",
  "provider_refresh_token",
];

function isSupabaseAuthCookieName(name: string): boolean {
  return (
    name.includes("-auth-token") ||
    (name.startsWith("sb-") && name.endsWith("-token"))
  );
}

function isProtectedPathname(pathname: string): boolean {
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/auth/reset-password"
  );
}

function getSafeReturnPath(pathname: string, search: string): string {
  const candidate = `${pathname}${search}`;
  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    candidate.includes("\0")
  ) {
    return "/";
  }
  return candidate;
}

function applyPrivateNoStoreHeaders(response: NextResponse): NextResponse {
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, max-age=0, must-revalidate"
  );
  response.headers.set("CDN-Cache-Control", "no-store");
  response.headers.set("Netlify-CDN-Cache-Control", "no-store");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  const existingVary = response.headers.get("Vary") || "";
  const varyParts = existingVary
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (!varyParts.some((v) => v.toLowerCase() === "cookie")) {
    varyParts.push("Cookie");
  }
  response.headers.set("Vary", varyParts.join(", "));
  return response;
}

function clearSupabaseAuthCookies(
  response: NextResponse,
  request: NextRequest
): void {
  for (const c of request.cookies.getAll()) {
    if (isSupabaseAuthCookieName(c.name) || c.name.startsWith("sb-")) {
      response.cookies.set(c.name, "", { path: "/", maxAge: 0 });
    }
  }
}

export async function updateSession(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;
  const canonicalOrigin = getCanonicalSiteOrigin(request);
  const isCallbackRoute = pathname === "/auth/callback";

  // 1. Strip any accidental session credentials sent in query parameters
  if (!isCallbackRoute && URL_CREDENTIAL_PARAMS.some((p) => searchParams.has(p))) {
    const cleanUrl = new URL(pathname, canonicalOrigin);
    searchParams.forEach((value, key) => {
      if (!URL_CREDENTIAL_PARAMS.includes(key)) {
        cleanUrl.searchParams.append(key, value);
      }
    });
    return applyPrivateNoStoreHeaders(NextResponse.redirect(cleanUrl));
  }

  // 2. Forward Site-URL fallback OTP/PKCE links cleanly to server /auth/callback
  if (
    (pathname === "/" || pathname === "/login") &&
    (searchParams.has("code") ||
      (searchParams.has("token_hash") && searchParams.has("type")))
  ) {
    const callbackUrl = new URL("/auth/callback", canonicalOrigin);
    for (const key of ["code", "token_hash", "type", "next"]) {
      const val = searchParams.get(key);
      if (val) callbackUrl.searchParams.set(key, val);
    }
    return applyPrivateNoStoreHeaders(NextResponse.redirect(callbackUrl));
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!isSupabaseConfigured()) {
    return applyPrivateNoStoreHeaders(supabaseResponse);
  }

  const allCookies = request.cookies.getAll();
  const hasAuthToken = allCookies.some((c) => isSupabaseAuthCookieName(c.name));
  const protectedRoute = isProtectedPathname(pathname);
  const isServerActionPost =
    request.method === "POST" && request.headers.has("next-action");
  const isNavigationMethod =
    request.method === "GET" || request.method === "HEAD";

  // 3. Fast fail-closed edge redirect for unauthenticated protected navigation
  if (protectedRoute && isNavigationMethod && !isServerActionPost && !hasAuthToken) {
    const loginUrl = new URL("/login", canonicalOrigin);
    loginUrl.searchParams.set("redirectTo", getSafeReturnPath(pathname, search));
    return applyPrivateNoStoreHeaders(NextResponse.redirect(loginUrl));
  }

  // Fast check: If no Supabase auth cookies are present on public routes, skip remote auth API call
  if (!hasAuthToken) {
    return applyPrivateNoStoreHeaders(supabaseResponse);
  }

  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Validate / refresh auth token cleanly with timeout guard
  let timedOut = false;
  let verifiedUser: { id: string } | null = null;
  let authErrored = false;

  try {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<{ timedOut: true }>((resolve) => {
      timer = setTimeout(() => resolve({ timedOut: true }), 3500);
    });
    const authPromise = supabase.auth
      .getUser()
      .then((res) => ({
        timedOut: false as const,
        user: res.data?.user ?? null,
        error: res.error,
      }))
      .catch(() => ({
        timedOut: false as const,
        user: null,
        error: new Error("auth_error"),
      }))
      .finally(() => {
        if (timer) clearTimeout(timer);
      });

    const outcome = await Promise.race([authPromise, timeoutPromise]);
    if (outcome.timedOut) {
      timedOut = true;
    } else {
      verifiedUser = outcome.user;
      authErrored = Boolean(outcome.error);
    }
  } catch {
    authErrored = true;
  }

  // 4. Reject invalid/expired/revoked session cookies on protected routes before page shell renders
  if (
    protectedRoute &&
    isNavigationMethod &&
    !isServerActionPost &&
    !timedOut &&
    (!verifiedUser || authErrored)
  ) {
    const loginUrl = new URL("/login", canonicalOrigin);
    loginUrl.searchParams.set("redirectTo", getSafeReturnPath(pathname, search));
    const redirectRes = NextResponse.redirect(loginUrl);
    clearSupabaseAuthCookies(redirectRes, request);
    return applyPrivateNoStoreHeaders(redirectRes);
  }

  return applyPrivateNoStoreHeaders(supabaseResponse);
}

