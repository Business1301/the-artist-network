import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "./client";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!isSupabaseConfigured()) {
    return supabaseResponse;
  }

  // Fast check: If no Supabase auth cookies are present, skip remote auth API call completely
  const allCookies = request.cookies.getAll();
  const hasAuthToken = allCookies.some(
    (c) =>
      c.name.includes("-auth-token") ||
      (c.name.startsWith("sb-") && c.name.endsWith("-token"))
  );

  if (!hasAuthToken) {
    return supabaseResponse;
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

  // Refresh auth token if expired, with a fast timeout guard to avoid blocking requests
  try {
    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 3000));
    await Promise.race([supabase.auth.getUser(), timeoutPromise]);
  } catch {
    // Session refresh error handled gracefully without failing the request
  }

  return supabaseResponse;
}

