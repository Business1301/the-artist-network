import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export interface VerifiedAdmin {
  id: string;
  email: string;
  fullName: string;
  role: "admin";
}

/**
 * Server-side authorization guard for platform administrators.
 * Strictly verifies the session user and their database role in public.profiles.
 * Never trusts user_metadata or client-provided role hints.
 * Fails closed and redirects unauthorized or unauthenticated requests.
 */
export async function requireAdmin(): Promise<VerifiedAdmin> {
  // Instruct Next.js 16 App Router that this execution requires request-time data
  await connection();

  const cookieStore = await cookies();
  const hasAuthToken = cookieStore
    .getAll()
    .some((c) => c.name.includes("-auth-token") || (c.name.startsWith("sb-") && c.name.endsWith("-token")));

  // Fast redirect if user has no session cookies at all
  if (!hasAuthToken) {
    redirect("/login?redirectTo=/admin");
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // 1. Unauthenticated -> redirect to login with safe internal return path
  if (authError || !user) {
    redirect("/login?redirectTo=/admin");
  }

  // 2. Fetch role exclusively from public.profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  // 3. Unauthorized / Missing profile -> redirect away appropriately
  if (profileError || !profile || profile.role !== "admin") {
    // If user is a verified artist or restaurant, route to their authorized dashboard
    if (profile?.role === "business") {
      redirect("/dashboard/restaurant");
    } else if (profile?.role === "artist") {
      redirect("/dashboard/artist");
    } else {
      redirect("/login?unauthorized=true");
    }
  }

  return {
    id: user.id,
    email: user.email || "",
    fullName: profile.full_name || "Platform Administrator",
    role: "admin",
  };
}

