"use server";

import { cookies, headers } from "next/headers";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getServerActionSiteOrigin } from "@/lib/auth/origin";
import { getSafeRedirectPath } from "@/lib/auth/redirect";

async function getTrustedSiteUrl(): Promise<string> {
  try {
    const hdrs = await headers();
    const directHost = hdrs.get("host")?.split(",")[0]?.trim() || null;
    return getServerActionSiteOrigin(directHost);
  } catch {
    return getServerActionSiteOrigin(null);
  }
}

export interface CurrentUser {
  id: string;
  email?: string;
  role: "admin" | "artist" | "business" | "individual" | string;
  fullName: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  redirectTo?: string;
  needsEmailConfirmation?: boolean;
  user?: CurrentUser;
}

/**
 * Server action for User Registration (Artist or Business)
 */
export async function signUpAction(formData: {
  email: string;
  password: string;
  role: "artist" | "business" | "individual";
  fullName?: string;
  contactName?: string;
  businessName?: string;
}): Promise<AuthResponse> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message:
        "Supabase credentials are not configured yet in .env.local. Please add your Project URL and Anon Key.",
    };
  }

  const { email, password, role, fullName, contactName, businessName } = formData;

  if (role !== "artist" && role !== "business" && role !== "individual") {
    return {
      success: false,
      message: "Invalid account role. Registration is only permitted for artists, businesses, and individuals.",
    };
  }

  if (!email || !password || password.length < 8) {
    return {
      success: false,
      message: "Please provide a valid email and password (minimum 8 characters).",
    };
  }

  const supabase = await createClient();

  // Prepare metadata for trigger to populate public.profiles safely
  const metaData: Record<string, string> = {
    role,
  };

  if (role === "artist" || role === "individual") {
    metaData.full_name = fullName || "";
  } else {
    metaData.contact_name = contactName || "";
    metaData.business_name = businessName || "";
    metaData.full_name = contactName || businessName || "";
  }

  const siteUrl = await getTrustedSiteUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metaData,
      ...(siteUrl ? { emailRedirectTo: `${siteUrl}/auth/callback` } : {}),
    },
  });

  if (error) {
    const isNetworkError =
      error.message?.includes("fetch failed") ||
      error.name === "AuthRetryableFetchError";
    return {
      success: false,
      message: isNetworkError
        ? "Unable to connect to the authentication server. Please ensure your Supabase project is active and unpaused in the Supabase Dashboard."
        : error.message,
    };
  }

  // Check if email confirmation is required by Supabase project settings
  if (data.session === null && data.user) {
    return {
      success: true,
      needsEmailConfirmation: true,
      message:
        "Registration successful! Please check your email inbox to confirm your account before logging in.",
    };
  }

  return {
    success: true,
    redirectTo:
      role === "business"
        ? "/dashboard/restaurant"
        : role === "individual"
        ? "/dashboard/client"
        : "/dashboard/artist",
    message: "Registration completed successfully!",
    user: data.user
      ? {
          id: data.user.id,
          email: data.user.email || "",
          role,
          fullName: metaData.full_name || "",
        }
      : undefined,
  };
}

/**
 * Server action for User Login
 */
export async function signInAction(formData: {
  email: string;
  password: string;
  redirectTo?: string;
}): Promise<AuthResponse> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message:
        "Supabase credentials are not configured yet in .env.local. Please add your Project URL and Anon Key.",
    };
  }

  const { email, password, redirectTo } = formData;

  if (!email || !password) {
    return {
      success: false,
      message: "Email and password are required.",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const isNetworkError =
      error.message?.includes("fetch failed") ||
      error.name === "AuthRetryableFetchError";
    return {
      success: false,
      message: isNetworkError
        ? "Unable to connect to the authentication server. Please ensure your Supabase project is active and unpaused in the Supabase Dashboard."
        : error.message,
    };
  }

  if (!data.user) {
    return {
      success: false,
      message: "Unable to sign in. Please check your credentials.",
    };
  }

  // Fetch the user's role exclusively from the database profiles table (fail-closed authorization)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile || !profile.role) {
    // Fail closed: invalidate session if database profile role cannot be verified
    await supabase.auth.signOut();
    return {
      success: false,
      message:
        "Authorization check failed: Account profile could not be verified. Please contact platform administration.",
    };
  }

  const userRole = profile.role;
  const destination = getSafeRedirectPath(redirectTo, userRole);

  return {
    success: true,
    redirectTo: destination,
    message: "Sign-in successful!",
    user: {
      id: data.user.id,
      email: data.user.email || "",
      role: userRole,
      fullName: profile.full_name || "",
    },
  };
}

/**
 * Server action for Password Reset Request
 */
export async function resetPasswordAction(email: string): Promise<AuthResponse> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message:
        "Supabase credentials are not configured yet in .env.local.",
    };
  }

  if (!email || !email.includes("@")) {
    return {
      success: false,
      message: "Please enter a valid email address.",
    };
  }

  const supabase = await createClient();
  const siteUrl = await getTrustedSiteUrl();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback`,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
    message: "If an account exists with this email, a password reset link has been sent.",
  };
}

/**
 * Server action for User Logout
 */
export async function signOutAction(): Promise<AuthResponse> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // Proceed to clear local session cookies cleanly even if remote revoke fails
    }
  }

  try {
    const cookieStore = await cookies();
    for (const c of cookieStore.getAll()) {
      if (c.name.startsWith("sb-") || c.name.includes("-auth-token")) {
        cookieStore.set(c.name, "", { path: "/", maxAge: 0 });
      }
    }
  } catch {
    // Ignore cookie clearing errors outside request context
  }

  return {
    success: true,
    redirectTo: "/",
  };
}

/**
 * Server helper to get current session and user profile
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const cookieStore = await cookies();
    const hasAuthCookie = cookieStore
      .getAll()
      .some(
        (c) =>
          c.name.startsWith("sb-") ||
          c.name.includes("-auth-token")
      );

    if (!hasAuthCookie) {
      return null;
    }

    const supabase = await createClient();

    let timeoutTimer: NodeJS.Timeout;
    const timeoutPromise = new Promise<{ data: { user: null }; error: Error }>((resolve) => {
      timeoutTimer = setTimeout(() => resolve({ data: { user: null }, error: new Error("Auth timeout") }), 3500);
    });

    const {
      data: { user },
    } = await Promise.race([supabase.auth.getUser(), timeoutPromise]).finally(() => {
      clearTimeout(timeoutTimer!);
    });

    if (!user) return null;

    let profileTimer: NodeJS.Timeout;
    const profileTimeoutPromise = new Promise<{ data: null; error: Error }>((resolve) => {
      profileTimer = setTimeout(() => resolve({ data: null, error: new Error("Profile timeout") }), 3500);
    });

    const { data: profile, error: profileError } = await Promise.race([
      supabase
        .from("profiles")
        .select("id, role, full_name")
        .eq("id", user.id)
        .single(),
      profileTimeoutPromise,
    ]).finally(() => {
      clearTimeout(profileTimer!);
    });

    if (profileError || !profile || !profile.role) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || "",
      role: profile.role,
      fullName: profile.full_name || "",
    };
  } catch {
    return null;
  }
}

