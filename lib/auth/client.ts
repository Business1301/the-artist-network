import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export interface VerifiedClient {
  id: string;
  email: string;
  fullName: string;
  role: "individual";
}

/**
 * Server-side authorization guard for individual (client) accounts.
 * Strictly verifies the session user and their database role in public.profiles.
 * Never trusts user_metadata or client-provided role hints.
 * Fails closed and redirects unauthorized or unauthenticated requests.
 *
 * - Unauthenticated       → /login?redirectTo=<returnPath>
 * - Missing profile        → /login?unauthorized=true
 * - role === "admin"       → /admin
 * - role === "artist"      → /dashboard/artist
 * - role === "business"    → /dashboard/restaurant
 * - role !== "individual"  → /login?unauthorized=true
 */
export async function requireClient(
  returnPath = "/dashboard/client"
): Promise<VerifiedClient> {
  // Instruct Next.js 16 App Router that this execution requires request-time data
  await connection();

  const cookieStore = await cookies();
  const hasAuthToken = cookieStore
    .getAll()
    .some((c) => c.name.includes("-auth-token") || (c.name.startsWith("sb-") && c.name.endsWith("-token")));

  // Fast redirect if user has no session cookies at all
  if (!hasAuthToken) {
    redirect(`/login?redirectTo=${encodeURIComponent(returnPath)}`);
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // 1. Unauthenticated → redirect to login with safe return path
  if (authError || !user) {
    redirect(`/login?redirectTo=${encodeURIComponent(returnPath)}`);
  }

  // 2. Fetch role exclusively from public.profiles (never user_metadata)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  // 3. Missing or unreadable profile → unauthorized
  if (profileError || !profile) {
    redirect("/login?unauthorized=true");
  }

  // 4. Route authenticated non-individual users to their correct destinations
  if (profile.role === "admin") {
    redirect("/admin");
  }

  if (profile.role === "artist") {
    redirect("/dashboard/artist");
  }

  if (profile.role === "business") {
    redirect("/dashboard/restaurant");
  }

  // 5. Any other non-individual role → deny access
  if (profile.role !== "individual") {
    redirect("/login?unauthorized=true");
  }

  return {
    id: user.id,
    email: user.email || "",
    fullName: profile.full_name || "",
    role: "individual",
  };
}
