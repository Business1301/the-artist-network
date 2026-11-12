"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

export interface AdminActionResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface AdminMetrics {
  suspendedProfiles: number;
  publishedArtists: number;
  verifiedArtists: number;
  totalBusinesses: number;
}

export interface AdminAuditRecord {
  id: string;
  admin_id: string | null;
  admin_email: string;
  admin_name: string;
  target_artist_id: string;
  target_stage_name: string;
  action: string;
  details: {
    target_artist_id?: string;
    previous_status?: string;
    new_status?: string;
    previous_verified?: boolean;
    new_verified?: boolean;
    rejection_reason?: string | null;
    [key: string]: unknown;
  };
  created_at: string;
}

export interface ApplicationPortfolioItem {
  id: string;
  title: string;
  description: string | null;
  media_type: string;
  media_url: string;
  thumbnail_url: string | null;
  display_order: number;
}

export interface ArtistApplication {
  id: string;
  stage_name: string;
  slug: string;
  category: string;
  city: string;
  state: string | null;
  bio: string | null;
  experience_years: number;
  genres: string[];
  specialities: string[];
  starting_price: number | null;
  pricing_unit: string | null;
  profile_status: string;
  is_verified: boolean;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  profile_image_url: string | null;
  cover_image_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  facebook_url: string | null;
  website_url: string | null;
  portfolio_items?: ApplicationPortfolioItem[];
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(id: string): boolean {
  return typeof id === "string" && UUID_REGEX.test(id.trim());
}

/**
 * Approve an artist application and transition their profile to 'published'.
 * Recorded atomically in admin_audit_logs via admin_moderate_artist_profile RPC.
 */
export async function approveArtistApplication(
  artistId: string
): Promise<AdminActionResult> {
  // 1. Independent Server Authorization
  await requireAdmin();

  if (!isValidUuid(artistId)) {
    return {
      success: false,
      message: "Invalid artist ID format.",
    };
  }

  const supabase = await createClient();

  // 2. Atomic moderation RPC
  const { data, error } = await supabase.rpc("admin_moderate_artist_profile", {
    p_artist_id: artistId.trim(),
    p_action: "approve",
    p_rejection_reason: null,
  });

  if (error) {
    return {
      success: false,
      message: error.message || "Failed to approve artist application.",
    };
  }

  // 3. Cache revalidation
  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  revalidatePath("/admin/audit-logs");
  revalidatePath("/artists");

  return {
    success: true,
    message: "Artist profile approved and published successfully.",
    data,
  };
}

/**
 * Reject an artist application with a mandatory reason.
 * Recorded atomically in admin_audit_logs via admin_moderate_artist_profile RPC.
 */
export async function rejectArtistApplication(
  artistId: string,
  rejectionReason: string
): Promise<AdminActionResult> {
  // 1. Independent Server Authorization
  await requireAdmin();

  if (!isValidUuid(artistId)) {
    return {
      success: false,
      message: "Invalid artist ID format.",
    };
  }

  const trimmedReason = rejectionReason?.trim();
  if (!trimmedReason || trimmedReason.length < 5) {
    return {
      success: false,
      message: "A specific rejection reason (at least 5 characters) is required.",
    };
  }

  const supabase = await createClient();

  // 2. Atomic moderation RPC
  const { data, error } = await supabase.rpc("admin_moderate_artist_profile", {
    p_artist_id: artistId.trim(),
    p_action: "reject",
    p_rejection_reason: trimmedReason,
  });

  if (error) {
    return {
      success: false,
      message: error.message || "Failed to reject artist application.",
    };
  }

  // 3. Cache revalidation
  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  revalidatePath("/admin/audit-logs");

  return {
    success: true,
    message: "Artist application rejected with audit record.",
    data,
  };
}

/**
 * Grant a verified badge to a published artist.
 * Does not trust client-provided state; the RPC enforces profile_status = 'published'.
 */
export async function verifyArtistApplication(
  artistId: string
): Promise<AdminActionResult> {
  // 1. Independent Server Authorization
  await requireAdmin();

  if (!isValidUuid(artistId)) {
    return {
      success: false,
      message: "Invalid artist ID format.",
    };
  }

  const supabase = await createClient();

  // 2. Atomic moderation RPC
  const { data, error } = await supabase.rpc("admin_moderate_artist_profile", {
    p_artist_id: artistId.trim(),
    p_action: "verify",
    p_rejection_reason: null,
  });

  if (error) {
    return {
      success: false,
      message: error.message || "Failed to verify artist.",
    };
  }

  // 3. Cache revalidation
  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  revalidatePath("/admin/audit-logs");
  revalidatePath("/artists");

  return {
    success: true,
    message: "Verification badge granted successfully.",
    data,
  };
}

/**
 * Revoke a verified badge from an artist.
 */
export async function unverifyArtistApplication(
  artistId: string
): Promise<AdminActionResult> {
  // 1. Independent Server Authorization
  await requireAdmin();

  if (!isValidUuid(artistId)) {
    return {
      success: false,
      message: "Invalid artist ID format.",
    };
  }

  const supabase = await createClient();

  // 2. Atomic moderation RPC
  const { data, error } = await supabase.rpc("admin_moderate_artist_profile", {
    p_artist_id: artistId.trim(),
    p_action: "unverify",
    p_rejection_reason: null,
  });

  if (error) {
    return {
      success: false,
      message: error.message || "Failed to revoke verification badge.",
    };
  }

  // 3. Cache revalidation
  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  revalidatePath("/admin/audit-logs");
  revalidatePath("/artists");

  return {
    success: true,
    message: "Verification badge revoked.",
    data,
  };
}

/**
 * Suspend an artist profile with a mandatory reason.
 * Recorded atomically in admin_audit_logs via admin_moderate_artist_profile RPC.
 * Suspended profiles are totally frozen — artist cannot edit anything.
 */
export async function suspendArtistProfile(
  artistId: string,
  suspensionReason: string
): Promise<AdminActionResult> {
  await requireAdmin();

  if (!isValidUuid(artistId)) {
    return { success: false, message: "Invalid artist ID format." };
  }

  const trimmedReason = suspensionReason?.trim();
  if (!trimmedReason || trimmedReason.length < 5) {
    return {
      success: false,
      message: "A specific suspension reason (at least 5 characters) is required.",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("admin_moderate_artist_profile", {
    p_artist_id: artistId.trim(),
    p_action: "suspend",
    p_rejection_reason: trimmedReason,
  });

  if (error) {
    return {
      success: false,
      message: error.message || "Failed to suspend artist profile.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  revalidatePath("/admin/audit-logs");
  revalidatePath("/artists");

  return {
    success: true,
    message: "Artist profile suspended with audit record.",
    data,
  };
}

/**
 * Reinstate a previously suspended artist profile.
 * Recorded atomically in admin_audit_logs via admin_moderate_artist_profile RPC.
 */
export async function reinstateArtistProfile(
  artistId: string
): Promise<AdminActionResult> {
  await requireAdmin();

  if (!isValidUuid(artistId)) {
    return { success: false, message: "Invalid artist ID format." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("admin_moderate_artist_profile", {
    p_artist_id: artistId.trim(),
    p_action: "reinstate",
    p_rejection_reason: null,
  });

  if (error) {
    return {
      success: false,
      message: error.message || "Failed to reinstate artist profile.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  revalidatePath("/admin/audit-logs");
  revalidatePath("/artists");

  return {
    success: true,
    message: "Artist profile reinstated and published.",
    data,
  };
}

/**
 * Retrieve real platform metrics directly from the database.
 * Never fabricates numbers or silently masks database errors.
 */
export async function getAdminMetrics(): Promise<AdminMetrics> {
  await requireAdmin();
  const supabase = await createClient();

  // 1. Suspended profiles count
  const { count: suspendedCount, error: suspendedErr } = await supabase
    .from("artist_profiles")
    .select("*", { count: "exact", head: true })
    .eq("profile_status", "suspended");

  if (suspendedErr) {
    throw new Error(`Database error querying suspended profiles: ${suspendedErr.message}`);
  }

  // 2. Published artists count
  const { count: publishedCount, error: publishedErr } = await supabase
    .from("artist_profiles")
    .select("*", { count: "exact", head: true })
    .eq("profile_status", "published");

  if (publishedErr) {
    throw new Error(`Database error querying published artists: ${publishedErr.message}`);
  }

  // 3. Verified artists count
  const { count: verifiedCount, error: verifiedErr } = await supabase
    .from("artist_profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_verified", true);

  if (verifiedErr) {
    throw new Error(`Database error querying verified artists: ${verifiedErr.message}`);
  }

  // 4. Total registered businesses (least-privilege query on public.profiles)
  const { count: businessCount, error: businessErr } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "business");

  if (businessErr) {
    throw new Error(`Database error querying registered businesses: ${businessErr.message}`);
  }

  return {
    suspendedProfiles: suspendedCount ?? 0,
    publishedArtists: publishedCount ?? 0,
    verifiedArtists: verifiedCount ?? 0,
    totalBusinesses: businessCount ?? 0,
  };
}

/**
 * Retrieve paginated immutable audit logs from public.admin_audit_logs.
 */
export async function getAdminAuditLogs(
  page = 1,
  pageSize = 25
): Promise<{
  logs: AdminAuditRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
}> {
  await requireAdmin();
  const supabase = await createClient();

  const safePage = Math.max(1, page);
  const safePageSize = Math.min(100, Math.max(1, pageSize));
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  const { data, count, error } = await supabase
    .from("admin_audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Database error fetching audit logs: ${error.message}`);
  }

  return {
    logs: (data || []) as AdminAuditRecord[],
    totalCount: count ?? 0,
    page: safePage,
    pageSize: safePageSize,
  };
}

/**
 * Retrieve artist applications filtered by status.
 */
export async function getArtistApplications(
  statusFilter?: string
): Promise<ArtistApplication[]> {
  await requireAdmin();
  const supabase = await createClient();

  let query = supabase
    .from("artist_profiles")
    .select(
      `
      id,
      stage_name,
      slug,
      category,
      city,
      state,
      bio,
      experience_years,
      genres,
      specialities,
      starting_price,
      pricing_unit,
      profile_status,
      is_verified,
      rejection_reason,
      created_at,
      updated_at,
      profile_image_url,
      cover_image_url,
      instagram_url,
      youtube_url,
      facebook_url,
      website_url
    `
    )
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("profile_status", statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Database error querying artist applications: ${error.message}`);
  }

  return (data || []) as ArtistApplication[];
}

/**
 * Retrieve comprehensive application details including portfolio items for review.
 */
export async function getApplicationDetails(
  artistId: string
): Promise<ArtistApplication> {
  await requireAdmin();

  if (!isValidUuid(artistId)) {
    throw new Error("Invalid artist ID format.");
  }

  const supabase = await createClient();

  const { data: artist, error: artistErr } = await supabase
    .from("artist_profiles")
    .select("*")
    .eq("id", artistId.trim())
    .single();

  if (artistErr || !artist) {
    throw new Error(
      `Artist profile not found: ${artistErr?.message || "No data returned"}`
    );
  }

  const { data: portfolio, error: portErr } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("artist_id", artistId.trim())
    .order("display_order", { ascending: true });

  if (portErr) {
    throw new Error(`Failed to load portfolio items: ${portErr.message}`);
  }

  return {
    ...(artist as ArtistApplication),
    portfolio_items: (portfolio || []) as ApplicationPortfolioItem[],
  };
}

