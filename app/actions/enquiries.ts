"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  BookingEnquiryStatus,
  BookingEventType,
  BookingEnquiryEvent,
  BookingEnquiryWithDetails,
  EnquiryActionResult,
  EnquiryListFilter,
} from "@/lib/enquiries/types";
import {
  submitEnquirySchema,
  respondEnquirySchema,
  clarifyEnquirySchema,
  withdrawEnquirySchema,
  enquiryListFilterSchema,
  SubmitEnquiryInput,
  ClarifyEnquiryInput,
} from "@/lib/enquiries/schemas";

interface DbEnquiryRow {
  id: string;
  business_id: string;
  artist_id: string;
  status: BookingEnquiryStatus;
  event_date: string;
  event_type: BookingEventType;
  event_location: string | null;
  requirements: string | null;
  indicative_budget: string | number | null;
  business_message: string | null;
  artist_response: string | null;
  business_clarification: string | null;
  seen_at: string | null;
  responded_at: string | null;
  clarified_at: string | null;
  created_at: string;
  updated_at: string;
  artist_profiles?: {
    id: string;
    stage_name: string;
    slug: string;
    category: string | null;
    city: string | null;
    profile_image_url: string | null;
    is_verified: boolean;
  } | null;
  profiles?: {
    id: string;
    full_name: string | null;
    role: "business";
  } | null;
  booking_enquiry_events?: BookingEnquiryEvent[];
}

/**
 * Format Zod validation errors into field-keyed error arrays
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path.join(".") || "form";
    if (!formatted[field]) {
      formatted[field] = [];
    }
    formatted[field].push(issue.message);
  }
  return formatted;
}

/**
 * Sanitize and extract user-friendly error messages from Supabase RPC exceptions
 */
function parseRpcError(
  error: { message?: string; code?: string } | null,
  defaultMsg: string
): string {
  if (!error) return defaultMsg;
  const msg = error.message || "";

  // Pass through verified application-level validation and security exceptions
  if (msg.includes("Active Limit Reached")) return msg;
  if (msg.includes("Duplicate Enquiry")) return msg;
  if (msg.includes("Platform Limit Reached")) return msg;
  if (msg.includes("Rate Limit Exceeded")) return msg;
  if (msg.includes("Artist Unavailable")) return msg;
  if (msg.includes("Artist Not Found")) return msg;
  if (msg.includes("Invalid Target")) return msg;
  if (msg.includes("Invalid Date")) return msg;
  if (msg.includes("Invalid Budget")) return msg;
  if (msg.includes("Invalid Event Type")) return msg;
  if (msg.includes("Clarification request requires")) return msg;
  if (msg.includes("Clarification message")) return msg;
  if (msg.includes("Cannot express interest")) return msg;
  if (msg.includes("Cannot clarify enquiry")) return msg;
  if (msg.includes("Cannot decline enquiry")) return msg;
  if (msg.includes("Cannot request information")) return msg;
  if (msg.includes("Enquiry cannot be withdrawn")) return msg;
  if (msg.includes("Enquiry Not Found or Access Denied")) {
    return "Enquiry not found or you do not have permission to access it.";
  }
  if (msg.includes("Access Denied")) return msg;
  if (msg.includes("Authentication required")) {
    return "Authentication required. Please sign in to continue.";
  }

  return defaultMsg;
}

/**
 * Verify business session and database role in public.profiles
 * Fails closed on missing session, invalid role, or database read error.
 */
async function verifyBusinessSession(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<
  | { authorized: true; userId: string; fullName: string }
  | { authorized: false; error: string }
> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      authorized: false,
      error: "Authentication required. Please log in as a business account.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      authorized: false,
      error: "User profile not found. Please contact support.",
    };
  }

  if (profile.role !== "business") {
    return {
      authorized: false,
      error:
        "Access denied. Only registered business accounts can perform this action.",
    };
  }

  return {
    authorized: true,
    userId: user.id,
    fullName: profile.full_name || "Business",
  };
}

/**
 * Verify artist session and database role in public.profiles
 * Fails closed on missing session, invalid role, or database read error.
 */
async function verifyArtistSession(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<
  | { authorized: true; userId: string; fullName: string }
  | { authorized: false; error: string }
> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      authorized: false,
      error: "Authentication required. Please log in as an artist.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      authorized: false,
      error: "User profile not found. Please contact support.",
    };
  }

  if (profile.role !== "artist") {
    return {
      authorized: false,
      error:
        "Access denied. Only registered artists can perform this action.",
    };
  }

  return {
    authorized: true,
    userId: user.id,
    fullName: profile.full_name || "Artist",
  };
}

/**
 * Verify session for either party (business, artist, or admin)
 */
async function verifyEnquiryPartySession(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<
  | { authorized: true; userId: string; role: "business" | "artist" | "admin" }
  | { authorized: false; error: string }
> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { authorized: false, error: "Authentication required." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { authorized: false, error: "User profile not found." };
  }

  const role = profile.role;
  if (role !== "business" && role !== "artist" && role !== "admin") {
    return { authorized: false, error: "Access denied." };
  }

  return { authorized: true, userId: user.id, role };
}

// ==============================================================================
// 1. Submit Booking Enquiry (Business Role)
// ==============================================================================

/**
 * Submit a new booking enquiry to a published artist.
 * Validates inputs with Zod, checks session role server-side,
 * and calls the atomic SECURITY DEFINER RPC `submit_booking_enquiry`.
 */
export async function submitBookingEnquiryAction(
  rawInput: SubmitEnquiryInput
): Promise<EnquiryActionResult<{ enquiryId: string }>> {
  const parsed = submitEnquirySchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the highlighted form errors.",
      validationErrors: formatZodErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const session = await verifyBusinessSession(supabase);
  if (!session.authorized) {
    return { success: false, error: session.error };
  }

  try {
    const { data: enquiryId, error } = await supabase.rpc(
      "submit_booking_enquiry",
      {
        p_artist_id: parsed.data.artistId,
        p_event_date: parsed.data.eventDate,
        p_event_type: parsed.data.eventType,
        p_event_location: parsed.data.eventLocation ?? null,
        p_requirements: parsed.data.requirements ?? null,
        p_indicative_budget: parsed.data.indicativeBudget ?? null,
        p_business_message: parsed.data.businessMessage ?? null,
      }
    );

    if (error) {
      return {
        success: false,
        error: parseRpcError(error, "Failed to submit booking enquiry."),
      };
    }

    revalidatePath("/dashboard/restaurant");
    return {
      success: true,
      data: { enquiryId: enquiryId as string },
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: message };
  }
}

// ==============================================================================
// 2. Mark Enquiry Seen (Artist Role)
// ==============================================================================

/**
 * Explicitly mark an enquiry as seen when the artist expands the drawer.
 * Idempotent safe no-op on repeated views. Does NOT trigger automatically on fetch.
 */
export async function markEnquirySeenAction(
  enquiryId: string
): Promise<EnquiryActionResult<void>> {
  const parsed = respondEnquirySchema.safeParse({
    enquiryId,
    action: "seen",
  });
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid enquiry ID format.",
      validationErrors: formatZodErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const session = await verifyArtistSession(supabase);
  if (!session.authorized) {
    return { success: false, error: session.error };
  }

  try {
    const { error } = await supabase.rpc("respond_to_booking_enquiry", {
      p_enquiry_id: parsed.data.enquiryId,
      p_action: "seen",
      p_response: null,
    });

    if (error) {
      return {
        success: false,
        error: parseRpcError(error, "Failed to update enquiry status."),
      };
    }

    revalidatePath("/dashboard/artist");
    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: message };
  }
}

// ==============================================================================
// 3. Express Interest (Artist Role)
// ==============================================================================

/**
 * Express non-binding interest in an enquiry.
 * Transitions to 'interested' (Terminal state). Does NOT create a calendar booking.
 */
export async function expressInterestAction(
  enquiryId: string,
  responseNote?: string | null
): Promise<EnquiryActionResult<void>> {
  const parsed = respondEnquirySchema.safeParse({
    enquiryId,
    action: "interested",
    response: responseNote ?? null,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid response parameters.",
      validationErrors: formatZodErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const session = await verifyArtistSession(supabase);
  if (!session.authorized) {
    return { success: false, error: session.error };
  }

  try {
    const { error } = await supabase.rpc("respond_to_booking_enquiry", {
      p_enquiry_id: parsed.data.enquiryId,
      p_action: "interested",
      p_response: parsed.data.response ?? null,
    });

    if (error) {
      return {
        success: false,
        error: parseRpcError(error, "Failed to express interest in enquiry."),
      };
    }

    revalidatePath("/dashboard/artist");
    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: message };
  }
}

// ==============================================================================
// 4. Decline Enquiry (Artist Role)
// ==============================================================================

/**
 * Politely decline an enquiry.
 * Transitions to 'declined' (Terminal state).
 */
export async function declineEnquiryAction(
  enquiryId: string,
  reason?: string | null
): Promise<EnquiryActionResult<void>> {
  const parsed = respondEnquirySchema.safeParse({
    enquiryId,
    action: "decline",
    response: reason ?? null,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid decline parameters.",
      validationErrors: formatZodErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const session = await verifyArtistSession(supabase);
  if (!session.authorized) {
    return { success: false, error: session.error };
  }

  try {
    const { error } = await supabase.rpc("respond_to_booking_enquiry", {
      p_enquiry_id: parsed.data.enquiryId,
      p_action: "decline",
      p_response: parsed.data.response ?? null,
    });

    if (error) {
      return {
        success: false,
        error: parseRpcError(error, "Failed to decline enquiry."),
      };
    }

    revalidatePath("/dashboard/artist");
    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: message };
  }
}

// ==============================================================================
// 5. Request Information (Artist Role)
// ==============================================================================

/**
 * Request clarification from the business regarding the event details.
 * Transitions to 'info_requested'. Requires a question of at least 5 characters.
 */
export async function requestInfoAction(
  enquiryId: string,
  question: string
): Promise<EnquiryActionResult<void>> {
  const parsed = respondEnquirySchema.safeParse({
    enquiryId,
    action: "request_info",
    response: question,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: "Clarification request requires a descriptive question (at least 5 characters).",
      validationErrors: formatZodErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const session = await verifyArtistSession(supabase);
  if (!session.authorized) {
    return { success: false, error: session.error };
  }

  try {
    const { error } = await supabase.rpc("respond_to_booking_enquiry", {
      p_enquiry_id: parsed.data.enquiryId,
      p_action: "request_info",
      p_response: parsed.data.response ?? null,
    });

    if (error) {
      return {
        success: false,
        error: parseRpcError(error, "Failed to request clarification."),
      };
    }

    revalidatePath("/dashboard/artist");
    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: message };
  }
}

// ==============================================================================
// 6. Clarify Enquiry (Business Role)
// ==============================================================================

/**
 * Submit the single business clarification in response to an artist's question.
 * Transitions from 'info_requested' -> 'clarified'.
 */
export async function clarifyEnquiryAction(
  rawInput: ClarifyEnquiryInput
): Promise<EnquiryActionResult<void>> {
  const parsed = clarifyEnquirySchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Clarification message must be at least 5 characters long.",
      validationErrors: formatZodErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const session = await verifyBusinessSession(supabase);
  if (!session.authorized) {
    return { success: false, error: session.error };
  }

  try {
    const { error } = await supabase.rpc("clarify_booking_enquiry", {
      p_enquiry_id: parsed.data.enquiryId,
      p_clarification: parsed.data.clarification,
    });

    if (error) {
      return {
        success: false,
        error: parseRpcError(error, "Failed to submit clarification."),
      };
    }

    revalidatePath("/dashboard/restaurant");
    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: message };
  }
}

// ==============================================================================
// 7. Withdraw Enquiry (Business Role)
// ==============================================================================

/**
 * Withdraw an open enquiry before conclusion.
 * Transitions to 'withdrawn' (Terminal state). Blocked if already in a terminal state.
 */
export async function withdrawEnquiryAction(
  enquiryId: string
): Promise<EnquiryActionResult<void>> {
  const parsed = withdrawEnquirySchema.safeParse({ enquiryId });
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid enquiry ID format.",
      validationErrors: formatZodErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const session = await verifyBusinessSession(supabase);
  if (!session.authorized) {
    return { success: false, error: session.error };
  }

  try {
    const { error } = await supabase.rpc("withdraw_booking_enquiry", {
      p_enquiry_id: parsed.data.enquiryId,
    });

    if (error) {
      return {
        success: false,
        error: parseRpcError(error, "Failed to withdraw enquiry."),
      };
    }

    revalidatePath("/dashboard/restaurant");
    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: message };
  }
}

// ==============================================================================
// 8. Retrieve Business Enquiries (Sent Enquiries)
// ==============================================================================

/**
 * Retrieve sent booking enquiries for the authenticated business.
 * Filterable by 'all', 'open', 'terminal', or specific status.
 * Enforces RLS and joins artist public profile details and audit history.
 */
export async function getBusinessEnquiriesAction(
  filter?: EnquiryListFilter
): Promise<EnquiryActionResult<BookingEnquiryWithDetails[]>> {
  const parsedFilter = enquiryListFilterSchema.safeParse(filter || {});
  if (!parsedFilter.success) {
    return {
      success: false,
      error: "Invalid query filters.",
      validationErrors: formatZodErrors(parsedFilter.error),
    };
  }

  const { status, limit, offset } = parsedFilter.data;
  const supabase = await createClient();
  const session = await verifyBusinessSession(supabase);
  if (!session.authorized) {
    return { success: false, error: session.error };
  }

  try {
    let query = supabase
      .from("booking_enquiries")
      .select(
        `
        *,
        artist_profiles (
          id, stage_name, slug, category, city, profile_image_url, is_verified
        ),
        booking_enquiry_events (
          id, enquiry_id, actor_id, actor_role, action, notes, created_at
        )
      `
      )
      .eq("business_id", session.userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status === "open") {
      query = query.in("status", [
        "submitted",
        "seen",
        "info_requested",
        "clarified",
      ]);
    } else if (status === "terminal") {
      query = query.in("status", ["interested", "declined", "withdrawn"]);
    } else if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return {
        success: false,
        error: "Failed to load enquiries. Please try again.",
      };
    }

    // Map nested relational data to clean strongly-typed model
    const rows = (data || []) as unknown as DbEnquiryRow[];
    const results: BookingEnquiryWithDetails[] = rows.map((row) => ({
      id: row.id,
      business_id: row.business_id,
      artist_id: row.artist_id,
      status: row.status,
      event_date: row.event_date,
      event_type: row.event_type,
      event_location: row.event_location,
      requirements: row.requirements,
      indicative_budget:
        row.indicative_budget !== null
          ? typeof row.indicative_budget === "number"
            ? row.indicative_budget
            : parseFloat(row.indicative_budget)
          : null,
      business_message: row.business_message,
      artist_response: row.artist_response,
      business_clarification: row.business_clarification,
      seen_at: row.seen_at,
      responded_at: row.responded_at,
      clarified_at: row.clarified_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      artist_profile: row.artist_profiles
        ? {
            id: row.artist_profiles.id,
            stage_name: row.artist_profiles.stage_name,
            slug: row.artist_profiles.slug,
            category: row.artist_profiles.category,
            city: row.artist_profiles.city,
            profile_image_url: row.artist_profiles.profile_image_url,
            is_verified: row.artist_profiles.is_verified,
          }
        : null,
      events: (row.booking_enquiry_events || []).sort(
        (a: BookingEnquiryEvent, b: BookingEnquiryEvent) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    }));

    return {
      success: true,
      data: results,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: message };
  }
}

// ==============================================================================
// 9. Retrieve Artist Enquiries (Received Enquiries)
// ==============================================================================

/**
 * Retrieve received booking enquiries for the authenticated artist.
 * Filterable by 'all', 'open', 'terminal', or specific status.
 * Enforces RLS and joins business public profile details and audit history.
 */
export async function getArtistEnquiriesAction(
  filter?: EnquiryListFilter
): Promise<EnquiryActionResult<BookingEnquiryWithDetails[]>> {
  const parsedFilter = enquiryListFilterSchema.safeParse(filter || {});
  if (!parsedFilter.success) {
    return {
      success: false,
      error: "Invalid query filters.",
      validationErrors: formatZodErrors(parsedFilter.error),
    };
  }

  const { status, limit, offset } = parsedFilter.data;
  const supabase = await createClient();
  const session = await verifyArtistSession(supabase);
  if (!session.authorized) {
    return { success: false, error: session.error };
  }

  try {
    let query = supabase
      .from("booking_enquiries")
      .select(
        `
        *,
        profiles!booking_enquiries_business_id_fkey (
          id, full_name, role
        ),
        booking_enquiry_events (
          id, enquiry_id, actor_id, actor_role, action, notes, created_at
        )
      `
      )
      .eq("artist_id", session.userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status === "open") {
      query = query.in("status", [
        "submitted",
        "seen",
        "info_requested",
        "clarified",
      ]);
    } else if (status === "terminal") {
      query = query.in("status", ["interested", "declined", "withdrawn"]);
    } else if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return {
        success: false,
        error: "Failed to load enquiries. Please try again.",
      };
    }

    // Map nested relational data to clean strongly-typed model
    const rows = (data || []) as unknown as DbEnquiryRow[];
    const results: BookingEnquiryWithDetails[] = rows.map((row) => ({
      id: row.id,
      business_id: row.business_id,
      artist_id: row.artist_id,
      status: row.status,
      event_date: row.event_date,
      event_type: row.event_type,
      event_location: row.event_location,
      requirements: row.requirements,
      indicative_budget:
        row.indicative_budget !== null
          ? typeof row.indicative_budget === "number"
            ? row.indicative_budget
            : parseFloat(row.indicative_budget)
          : null,
      business_message: row.business_message,
      artist_response: row.artist_response,
      business_clarification: row.business_clarification,
      seen_at: row.seen_at,
      responded_at: row.responded_at,
      clarified_at: row.clarified_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      business_profile: row.profiles
        ? {
            id: row.profiles.id,
            full_name: row.profiles.full_name || "Business",
            role: row.profiles.role,
          }
        : {
            id: row.business_id,
            full_name: "Business Client",
            role: "business" as const,
          },
      events: (row.booking_enquiry_events || []).sort(
        (a: BookingEnquiryEvent, b: BookingEnquiryEvent) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    }));

    return {
      success: true,
      data: results,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: message };
  }
}

// ==============================================================================
// 10. Retrieve Single Enquiry Details (Authenticated Participant or Admin)
// ==============================================================================

/**
 * Retrieve full details and event audit history for a single enquiry.
 * Verified to ensure caller is the owning business, target artist, or platform admin.
 */
export async function getEnquiryDetailsAction(
  enquiryId: string
): Promise<EnquiryActionResult<BookingEnquiryWithDetails>> {
  const parsed = withdrawEnquirySchema.safeParse({ enquiryId });
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid enquiry ID format.",
    };
  }

  const supabase = await createClient();
  const session = await verifyEnquiryPartySession(supabase);
  if (!session.authorized) {
    return { success: false, error: session.error };
  }

  try {
    let query = supabase
      .from("booking_enquiries")
      .select(
        `
        *,
        artist_profiles (
          id, stage_name, slug, category, city, profile_image_url, is_verified
        ),
        profiles!booking_enquiries_business_id_fkey (
          id, full_name, role
        ),
        booking_enquiry_events (
          id, enquiry_id, actor_id, actor_role, action, notes, created_at
        )
      `
      )
      .eq("id", parsed.data.enquiryId);

    // Apply strict ownership filtering unless platform admin
    if (session.role === "business") {
      query = query.eq("business_id", session.userId);
    } else if (session.role === "artist") {
      query = query.eq("artist_id", session.userId);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return {
        success: false,
        error: "Enquiry not found or access denied.",
      };
    }

    const row = data as unknown as DbEnquiryRow;
    const result: BookingEnquiryWithDetails = {
      id: row.id,
      business_id: row.business_id,
      artist_id: row.artist_id,
      status: row.status,
      event_date: row.event_date,
      event_type: row.event_type,
      event_location: row.event_location,
      requirements: row.requirements,
      indicative_budget:
        row.indicative_budget !== null
          ? typeof row.indicative_budget === "number"
            ? row.indicative_budget
            : parseFloat(row.indicative_budget)
          : null,
      business_message: row.business_message,
      artist_response: row.artist_response,
      business_clarification: row.business_clarification,
      seen_at: row.seen_at,
      responded_at: row.responded_at,
      clarified_at: row.clarified_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      artist_profile: row.artist_profiles
        ? {
            id: row.artist_profiles.id,
            stage_name: row.artist_profiles.stage_name,
            slug: row.artist_profiles.slug,
            category: row.artist_profiles.category,
            city: row.artist_profiles.city,
            profile_image_url: row.artist_profiles.profile_image_url,
            is_verified: row.artist_profiles.is_verified,
          }
        : null,
      business_profile: row.profiles
        ? {
            id: row.profiles.id,
            full_name: row.profiles.full_name || "Business",
            role: row.profiles.role,
          }
        : {
            id: row.business_id,
            full_name: "Business Client",
            role: "business" as const,
          },
      events: (row.booking_enquiry_events || []).sort(
        (a: BookingEnquiryEvent, b: BookingEnquiryEvent) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    };

    return {
      success: true,
      data: result,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: message };
  }
}

