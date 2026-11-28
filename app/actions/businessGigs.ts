"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type {
  ArtistEligibilityState,
  ArtistGigApplicationItem,
  ArtistGigDetail,
  ArtistVisibleGig,
  BusinessGigApplicantItem,
  BusinessPostedGig,
  GigActionResult,
  GigFilterParams,
  GigStatus,
} from "@/lib/gigs/types";
import {
  createGigSchema,
  updateGigSchema,
  setGigStatusSchema,
  submitGigApplicationSchema,
  reviewGigApplicationSchema,
  type CreateGigInput,
  type UpdateGigInput,
  type SubmitGigApplicationInput,
  type ReviewGigApplicationInput,
} from "@/lib/gigs/schemas";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(id: unknown): id is string {
  return typeof id === "string" && UUID_REGEX.test(id.trim());
}

function formatZodErrors(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path.join(".") || "form";
    if (!formatted[field]) formatted[field] = [];
    formatted[field].push(issue.message);
  }
  return formatted;
}

function parseGigRpcError(
  error: { message?: string } | null,
  fallbackMsg: string
): string {
  const msg = error?.message || "";
  const knownPrefixes = [
    "Authentication required",
    "Access Denied",
    "Invalid ",
    "Missing ",
    "Active Gig Limit Reached",
    "Rate Limit Exceeded",
    "Duplicate Gig",
    "Duplicate Application",
    "Profile Incomplete",
    "Profile Unavailable",
    "Account Suspended",
    "Gig Not Found",
    "Gig Unavailable",
    "Gig Closed",
    "Deadline Passed",
    "Application Limit Reached",
    "Withdrawn gigs",
    "Update deadline",
    "Cannot ",
    "Feedback ",
    "Application not found",
    "Gig not found",
  ];
  for (const prefix of knownPrefixes) {
    if (msg.includes(prefix)) return msg;
  }
  return fallbackMsg;
}

/**
 * Verifies authenticated Supabase session AND exact database role in public.profiles.
 * Never trusts user_metadata or client-side role hints.
 */
async function requireRoleActionSession(requiredRole: "artist" | "business"): Promise<
  | {
      authorized: true;
      supabase: Awaited<ReturnType<typeof createClient>>;
      userId: string;
    }
  | { authorized: false; error: string }
> {
  if (!isSupabaseConfigured()) {
    return { authorized: false, error: "Database configuration is missing." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      authorized: false,
      error:
        requiredRole === "artist"
          ? "Please log in as an Artist to access Business Gigs."
          : "Authentication required. Please log in with your Business account.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      authorized: false,
      error: "Account profile could not be verified.",
    };
  }

  if (profile.role !== requiredRole) {
    return {
      authorized: false,
      error:
        requiredRole === "artist"
          ? "Access Denied: Business Gigs are exclusively visible to registered Artist accounts."
          : "Access Denied: Only registered Business accounts can manage business gigs.",
    };
  }

  return { authorized: true, supabase, userId: user.id };
}

function revalidateGigPaths(gigId?: string) {
  revalidatePath("/dashboard/restaurant");
  revalidatePath("/dashboard/artist");
  revalidatePath("/opportunities");
  revalidatePath("/opportunities/business-gigs");
  if (gigId) {
    revalidatePath(`/dashboard/restaurant/gigs/${gigId}`);
    revalidatePath(`/opportunities/business-gigs/${gigId}`);
  }
}

/* ============================================================================
 * BUSINESS ACTIONS (Publish, Edit, Close, Withdraw, View & Review Applicants)
 * ============================================================================ */

export async function createBusinessGigAction(
  input: CreateGigInput
): Promise<GigActionResult<string>> {
  const session = await requireRoleActionSession("business");
  if (!session.authorized) {
    return { success: false, error: session.error };
  }

  const parsed = createGigSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please review the highlighted gig details.",
      validationErrors: formatZodErrors(parsed.error),
    };
  }

  const d = parsed.data;
  const { data, error } = await session.supabase.rpc("create_business_gig", {
    p_title: d.title,
    p_artist_category: d.artistCategory,
    p_description: d.description,
    p_requirements: d.requirements,
    p_event_date: d.eventDate,
    p_event_start_time: d.eventStartTime,
    p_event_end_time: d.eventEndTime,
    p_city: d.city,
    p_venue_location: d.venueLocation,
    p_compensation_type: d.compensationType,
    p_budget_min: d.budgetMin,
    p_budget_max: d.budgetMax,
    p_application_deadline: d.applicationDeadline,
  });

  if (error || !data) {
    return {
      success: false,
      error: parseGigRpcError(error, "Unable to publish your gig right now."),
    };
  }

  const gigId = String(data);
  revalidateGigPaths(gigId);
  return {
    success: true,
    message: "Gig published live! Registered Artists can now view and apply.",
    data: gigId,
  };
}

export async function updateBusinessGigAction(
  input: UpdateGigInput
): Promise<GigActionResult<string>> {
  const session = await requireRoleActionSession("business");
  if (!session.authorized) {
    return { success: false, error: session.error };
  }

  const parsed = updateGigSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the invalid fields before saving changes.",
      validationErrors: formatZodErrors(parsed.error),
    };
  }

  const d = parsed.data;
  const { data, error } = await session.supabase.rpc("update_business_gig", {
    p_gig_id: d.gigId,
    p_title: d.title,
    p_artist_category: d.artistCategory,
    p_description: d.description,
    p_requirements: d.requirements,
    p_event_date: d.eventDate,
    p_event_start_time: d.eventStartTime,
    p_event_end_time: d.eventEndTime,
    p_city: d.city,
    p_venue_location: d.venueLocation,
    p_compensation_type: d.compensationType,
    p_budget_min: d.budgetMin,
    p_budget_max: d.budgetMax,
    p_application_deadline: d.applicationDeadline,
  });

  if (error || !data) {
    return {
      success: false,
      error: parseGigRpcError(error, "Failed to update business gig."),
    };
  }

  revalidateGigPaths(d.gigId);
  return {
    success: true,
    message: "Gig details updated successfully.",
    data: String(data),
  };
}

export async function setBusinessGigStatusAction(
  gigId: string,
  status: GigStatus
): Promise<GigActionResult<boolean>> {
  const session = await requireRoleActionSession("business");
  if (!session.authorized) {
    return { success: false, error: session.error };
  }

  const parsed = setGigStatusSchema.safeParse({ gigId, status });
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid gig status update request.",
      validationErrors: formatZodErrors(parsed.error),
    };
  }

  const { error } = await session.supabase.rpc("set_business_gig_status", {
    p_gig_id: parsed.data.gigId,
    p_status: parsed.data.status,
  });

  if (error) {
    return {
      success: false,
      error: parseGigRpcError(error, "Unable to change gig status."),
    };
  }

  revalidateGigPaths(parsed.data.gigId);
  const label =
    parsed.data.status === "closed"
      ? "Gig closed to new applications."
      : parsed.data.status === "withdrawn"
      ? "Gig withdrawn from Artists."
      : "Gig reopened cleanly.";

  return { success: true, message: label, data: true };
}

export async function getBusinessPostedGigsAction(): Promise<
  GigActionResult<BusinessPostedGig[]>
> {
  const session = await requireRoleActionSession("business");
  if (!session.authorized) {
    return { success: false, error: session.error };
  }

  const { data, error } = await session.supabase.rpc("get_business_posted_gigs");
  if (error) {
    return {
      success: false,
      error: parseGigRpcError(error, "Unable to load your posted gigs."),
    };
  }

  return {
    success: true,
    data: (data || []) as BusinessPostedGig[],
  };
}

export async function getBusinessGigApplicantsAction(
  gigId: string
): Promise<GigActionResult<BusinessGigApplicantItem[]>> {
  const session = await requireRoleActionSession("business");
  if (!session.authorized) {
    return { success: false, error: session.error };
  }

  if (!isValidUuid(gigId)) {
    return { success: false, error: "Invalid gig ID." };
  }

  const { data, error } = await session.supabase.rpc(
    "get_business_gig_applicants",
    { p_gig_id: gigId.trim() }
  );

  if (error) {
    return {
      success: false,
      error: parseGigRpcError(error, "Unable to load gig applicants."),
    };
  }

  return {
    success: true,
    data: (data || []) as BusinessGigApplicantItem[],
  };
}

export async function reviewGigApplicationAction(
  input: ReviewGigApplicationInput
): Promise<GigActionResult<boolean>> {
  const session = await requireRoleActionSession("business");
  if (!session.authorized) {
    return { success: false, error: session.error };
  }

  const parsed = reviewGigApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid application review parameters.",
      validationErrors: formatZodErrors(parsed.error),
    };
  }

  const { error } = await session.supabase.rpc("review_gig_application", {
    p_application_id: parsed.data.applicationId,
    p_decision: parsed.data.decision,
    p_feedback: parsed.data.feedback ?? null,
  });

  if (error) {
    return {
      success: false,
      error: parseGigRpcError(error, "Unable to update application status."),
    };
  }

  revalidateGigPaths();
  return {
    success: true,
    message:
      parsed.data.decision === "shortlisted"
        ? "Applicant shortlisted for your review."
        : "Application marked as rejected.",
    data: true,
  };
}

/* ============================================================================
 * ARTIST ACTIONS (Eligibility, Browse Private Business Gigs, Apply, Track)
 * ============================================================================ */

export async function getArtistEligibilityAction(): Promise<
  GigActionResult<ArtistEligibilityState>
> {
  const session = await requireRoleActionSession("artist");
  if (!session.authorized) {
    return { success: false, error: session.error };
  }

  const { data: ap } = await session.supabase
    .from("artist_profiles")
    .select("profile_status")
    .eq("id", session.userId)
    .maybeSingle();

  const status = ap?.profile_status ?? null;
  if (status === "published") {
    return {
      success: true,
      data: { canApply: true, profileStatus: "published" },
    };
  }
  if (status === "suspended") {
    return {
      success: true,
      data: {
        canApply: false,
        profileStatus: "suspended",
        message:
          "Your artist profile is suspended and cannot submit gig applications. Contact support if needed.",
      },
    };
  }

  return {
    success: true,
    data: {
      canApply: false,
      profileStatus: status,
      message:
        "Complete and publish your Artist Profile before applying so hiring venues can inspect your stage work. Identity verification is optional.",
    },
  };
}

export async function getArtistBusinessGigsAction(
  filters: GigFilterParams = {}
): Promise<GigActionResult<ArtistVisibleGig[]>> {
  const session = await requireRoleActionSession("artist");
  if (!session.authorized) {
    return { success: false, error: session.error };
  }

  const { data, error } = await session.supabase.rpc("get_artist_business_gigs", {
    p_category: filters.category?.trim() || null,
    p_city: filters.city?.trim() || null,
    p_date_from: filters.dateFrom?.trim() || null,
    p_date_to: filters.dateTo?.trim() || null,
    p_min_budget:
      typeof filters.minBudget === "number" && !Number.isNaN(filters.minBudget)
        ? filters.minBudget
        : null,
    p_max_budget:
      typeof filters.maxBudget === "number" && !Number.isNaN(filters.maxBudget)
        ? filters.maxBudget
        : null,
    p_query: filters.query?.trim() || null,
  });

  if (error) {
    return {
      success: false,
      error: parseGigRpcError(error, "Unable to fetch business gigs."),
    };
  }

  return {
    success: true,
    data: (data || []) as ArtistVisibleGig[],
  };
}

export async function getArtistBusinessGigDetailAction(
  gigId: string
): Promise<GigActionResult<ArtistGigDetail | null>> {
  const session = await requireRoleActionSession("artist");
  if (!session.authorized) {
    return { success: false, error: session.error };
  }

  if (!isValidUuid(gigId)) {
    return { success: true, data: null };
  }

  const { data, error } = await session.supabase.rpc(
    "get_artist_business_gig_detail",
    { p_gig_id: gigId.trim() }
  );

  if (error) {
    return {
      success: false,
      error: parseGigRpcError(error, "Unable to load gig details."),
    };
  }

  const row = Array.isArray(data) ? data[0] ?? null : data ?? null;
  return {
    success: true,
    data: row as ArtistGigDetail | null,
  };
}

export async function submitGigApplicationAction(
  input: SubmitGigApplicationInput
): Promise<GigActionResult<string>> {
  const session = await requireRoleActionSession("artist");
  if (!session.authorized) {
    return { success: false, error: session.error };
  }

  const parsed = submitGigApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please check your application details.",
      validationErrors: formatZodErrors(parsed.error),
    };
  }

  const { data, error } = await session.supabase.rpc("submit_gig_application", {
    p_gig_id: parsed.data.gigId,
    p_pitch_message: parsed.data.pitchMessage,
    p_proposed_fee: parsed.data.proposedFee,
  });

  if (error || !data) {
    return {
      success: false,
      error: parseGigRpcError(error, "Failed to submit gig application."),
    };
  }

  revalidateGigPaths(parsed.data.gigId);
  return {
    success: true,
    message: "Your application has been submitted to the business.",
    data: String(data),
  };
}

export async function withdrawGigApplicationAction(
  applicationId: string
): Promise<GigActionResult<boolean>> {
  const session = await requireRoleActionSession("artist");
  if (!session.authorized) {
    return { success: false, error: session.error };
  }

  if (!isValidUuid(applicationId)) {
    return { success: false, error: "Invalid application ID." };
  }

  const { error } = await session.supabase.rpc("withdraw_gig_application", {
    p_application_id: applicationId.trim(),
  });

  if (error) {
    return {
      success: false,
      error: parseGigRpcError(error, "Failed to withdraw application."),
    };
  }

  revalidateGigPaths();
  return {
    success: true,
    message: "Application withdrawn.",
    data: true,
  };
}

export async function getArtistGigApplicationsAction(): Promise<
  GigActionResult<ArtistGigApplicationItem[]>
> {
  const session = await requireRoleActionSession("artist");
  if (!session.authorized) {
    return { success: false, error: session.error };
  }

  const { data, error } = await session.supabase.rpc(
    "get_artist_gig_applications"
  );

  if (error) {
    return {
      success: false,
      error: parseGigRpcError(error, "Unable to fetch your gig applications."),
    };
  }

  return {
    success: true,
    data: (data || []) as ArtistGigApplicationItem[],
  };
}
