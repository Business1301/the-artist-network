import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getCanonicalSiteOrigin } from "@/lib/auth/origin";
import { getSafeRedirectPath } from "@/lib/auth/redirect";

const ALLOWED_OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

function withNoStore(res: NextResponse): NextResponse {
  res.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, max-age=0, must-revalidate"
  );
  res.headers.set("CDN-Cache-Control", "no-store");
  res.headers.set("Netlify-CDN-Cache-Control", "no-store");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Vary", "Cookie");
  return res;
}

/**
 * One-time PKCE / OTP verification callback route.
 * Consumes single-use verification parameters on the server, strips them from the URL
 * via an immediate HTTP 303 redirect to the canonical origin, and verifies role strictly
 * from public.profiles.
 */
export async function GET(request: NextRequest) {
  const canonicalOrigin = getCanonicalSiteOrigin(request);
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const typeParam = searchParams.get("type");
  const nextParam = searchParams.get("next");

  const loginFailure = (errorCode: string) => {
    const failUrl = new URL("/login", canonicalOrigin);
    failUrl.searchParams.set("unauthorized", "true");
    failUrl.searchParams.set("reason", errorCode);
    const res = NextResponse.redirect(failUrl, 303);
    for (const c of request.cookies.getAll()) {
      if (c.name.startsWith("sb-")) {
        res.cookies.set(c.name, "", { path: "/", maxAge: 0 });
      }
    }
    return withNoStore(res);
  };

  if (!isSupabaseConfigured()) {
    return loginFailure("not_configured");
  }

  const supabase = await createClient();
  let verifiedOk = false;
  let pkceRedirectType: string | null = null;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    verifiedOk = !error;
    pkceRedirectType =
      (data as { redirectType?: string | null } | null)?.redirectType ?? null;
  } else if (
    tokenHash &&
    typeParam &&
    ALLOWED_OTP_TYPES.has(typeParam as EmailOtpType)
  ) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: typeParam as EmailOtpType,
    });
    verifiedOk = !error;
  }

  if (!verifiedOk) {
    return loginFailure("invalid_or_expired_link");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return loginFailure("session_unavailable");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.role) {
    await supabase.auth.signOut().catch(() => {});
    return loginFailure("profile_unverified");
  }

  // Password recovery always lands on dedicated password update screen without URL tokens
  if (
    pkceRedirectType === "recovery" ||
    typeParam === "recovery" ||
    nextParam === "/auth/reset-password"
  ) {
    return withNoStore(
      NextResponse.redirect(
        new URL("/auth/reset-password", canonicalOrigin),
        303
      )
    );
  }

  const destination = getSafeRedirectPath(nextParam, profile.role);
  return withNoStore(
    NextResponse.redirect(new URL(destination, canonicalOrigin), 303)
  );
}
