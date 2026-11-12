"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  ArtistCalendarEvent,
  CalendarActionResult,
  ConflictingEvent,
} from "@/lib/calendar/types";
import {
  calendarDateRangeSchema,
  createManualGigSchema,
  createUnavailableBlockSchema,
  updateCalendarEventSchema,
  checkCalendarConflictSchema,
  CalendarDateRangeInput,
  CheckCalendarConflictInput,
} from "@/lib/calendar/schemas";

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
 * Helper to authenticate caller and verify 'artist' role from public.profiles
 * Fails closed on any session, network, or role mismatch
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
      error: "Authentication required. Please log in to manage your calendar.",
    };
  }

  // Strictly verify role from database public.profiles (never metadata or cookies)
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
      error: "Access denied. Only registered artists can manage calendar events.",
    };
  }

  return {
    authorized: true,
    userId: user.id,
    fullName: profile.full_name || "Artist",
  };
}

/**
 * Retrieve calendar events for the authenticated artist within a date range
 * Uses standard interval overlap: (start_time < rangeEnd AND end_time > rangeStart)
 * Multi-day and overnight events are correctly included.
 */
export async function getArtistCalendarEventsAction(
  rangeInput: CalendarDateRangeInput
): Promise<CalendarActionResult<ArtistCalendarEvent[]>> {
  const parsed = calendarDateRangeSchema.safeParse(rangeInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid date range parameters",
      validationErrors: formatZodErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const authCheck = await verifyArtistSession(supabase);
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const { start_date, end_date } = parsed.data;

  // Query events overlapping the requested range
  const { data, error } = await supabase
    .from("artist_calendar_events")
    .select("*")
    .eq("artist_id", authCheck.userId)
    .lt("start_time", end_date)
    .gt("end_time", start_date)
    .order("start_time", { ascending: true });

  if (error) {
    return {
      success: false,
      error: `Database query failed: ${error.message}`,
    };
  }

  return {
    success: true,
    data: (data as ArtistCalendarEvent[]) || [],
  };
}

/**
 * Create a manual external gig booking
 * Mutations execute exclusively through atomic RPC save_artist_calendar_event
 */
export async function createManualGigAction(
  input: unknown
): Promise<CalendarActionResult<{ event_id: string }>> {
  const parsed = createManualGigSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed. Please correct the highlighted fields.",
      validationErrors: formatZodErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const authCheck = await verifyArtistSession(supabase);
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const payload = parsed.data;

  // Strict server-side verification: new bookings must start in the future
  if (new Date(payload.start_time).getTime() <= Date.now()) {
    return {
      success: false,
      error: "Bookings must start in the future. Please select a later date or time.",
      validationErrors: {
        start_time: [
          "Bookings must start in the future. Please select a later date or time.",
        ],
      },
    };
  }

  const { data, error } = await supabase.rpc("save_artist_calendar_event", {
    p_title: payload.title,
    p_event_type: "gig_booking",
    p_status: payload.status,
    p_start_time: payload.start_time,
    p_end_time: payload.end_time,
    p_is_all_day: payload.is_all_day,
    p_city: payload.city || null,
    p_venue_name: payload.venue_name || null,
    p_venue_address: payload.venue_address || null,
    p_client_name: payload.client_name || null,
    p_client_phone: payload.client_phone || null,
    p_client_email: payload.client_email || null,
    p_agreed_fee: payload.agreed_fee != null ? payload.agreed_fee : null,
    p_deposit_paid: payload.deposit_paid != null ? payload.deposit_paid : null,
    p_private_notes: payload.private_notes || null,
    p_allow_overlap: payload.allow_overlap || false,
  });

  if (error) {
    return {
      success: false,
      error: error.message || "Failed to save calendar event",
    };
  }

  // Parse RPC response structure
  const rpcResult = data as {
    success: boolean;
    conflict?: boolean;
    conflicts?: ConflictingEvent[];
    message?: string;
    error?: string;
    event_id?: string;
  };

  if (!rpcResult.success && rpcResult.conflict) {
    return {
      success: false,
      conflict: true,
      error:
        rpcResult.message ||
        "Scheduling conflict detected with existing confirmed event(s). Explicit confirmation required.",
      conflicts: rpcResult.conflicts || [],
    };
  }

  if (!rpcResult.success) {
    return {
      success: false,
      error: rpcResult.error || "Failed to create calendar event.",
    };
  }

  revalidatePath("/dashboard/artist/calendar");
  revalidatePath("/dashboard/artist");

  return {
    success: true,
    message: "Gig booking added to your calendar.",
    data: { event_id: rpcResult.event_id! },
  };
}

/**
 * Mark a date or time range as unavailable / blocked
 * Mutations execute exclusively through atomic RPC save_artist_calendar_event
 */
export async function createUnavailableBlockAction(
  input: unknown
): Promise<CalendarActionResult<{ event_id: string }>> {
  const parsed = createUnavailableBlockSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed. Please correct the highlighted fields.",
      validationErrors: formatZodErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const authCheck = await verifyArtistSession(supabase);
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const payload = parsed.data;

  // Strict server-side verification: new bookings must start in the future
  if (new Date(payload.start_time).getTime() <= Date.now()) {
    return {
      success: false,
      error: "Bookings must start in the future. Please select a later date or time.",
      validationErrors: {
        start_time: [
          "Bookings must start in the future. Please select a later date or time.",
        ],
      },
    };
  }

  const { data, error } = await supabase.rpc("save_artist_calendar_event", {
    p_title: payload.title,
    p_event_type: "unavailable_block",
    p_status: payload.status,
    p_start_time: payload.start_time,
    p_end_time: payload.end_time,
    p_is_all_day: payload.is_all_day,
    p_city: payload.city || null,
    p_venue_name: payload.venue_name || null,
    p_venue_address: payload.venue_address || null,
    p_client_name: null,
    p_client_phone: null,
    p_client_email: null,
    p_agreed_fee: null,
    p_deposit_paid: null,
    p_private_notes: payload.private_notes || null,
    p_allow_overlap: payload.allow_overlap || false,
  });

  if (error) {
    return {
      success: false,
      error: error.message || "Failed to save unavailable period",
    };
  }

  const rpcResult = data as {
    success: boolean;
    conflict?: boolean;
    conflicts?: ConflictingEvent[];
    message?: string;
    error?: string;
    event_id?: string;
  };

  if (!rpcResult.success && rpcResult.conflict) {
    return {
      success: false,
      conflict: true,
      error:
        rpcResult.message ||
        "Scheduling conflict detected with existing confirmed event(s). Explicit confirmation required.",
      conflicts: rpcResult.conflicts || [],
    };
  }

  if (!rpcResult.success) {
    return {
      success: false,
      error: rpcResult.error || "Failed to mark time unavailable.",
    };
  }

  revalidatePath("/dashboard/artist/calendar");
  revalidatePath("/dashboard/artist");

  return {
    success: true,
    message: "Unavailable block added to your calendar.",
    data: { event_id: rpcResult.event_id! },
  };
}

/**
 * Update an existing calendar event
 * Enforces ownership and immutability of platform bookings via RPC
 */
export async function updateCalendarEventAction(
  input: unknown
): Promise<CalendarActionResult<{ event_id: string }>> {
  const parsed = updateCalendarEventSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed. Please correct the highlighted fields.",
      validationErrors: formatZodErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const authCheck = await verifyArtistSession(supabase);
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const payload = parsed.data;

  // 1. Verify existence, ownership, and platform immutability
  const { data: existingEvent, error: fetchError } = await supabase
    .from("artist_calendar_events")
    .select("id, start_time, end_time, is_all_day, source")
    .eq("id", payload.event_id)
    .eq("artist_id", authCheck.userId)
    .single();

  if (fetchError || !existingEvent) {
    return {
      success: false,
      error: "Event not found or access denied.",
    };
  }

  if (existingEvent.source === "platform_booking") {
    return {
      success: false,
      error: "Platform-generated bookings cannot be modified manually.",
    };
  }

  // 2. Prevent past-booking violations and preserve historical event scheduling
  // - Once an event has started (start_time <= now), do not permit changes to start_time, end_time, or is_all_day.
  //   Metadata updates (notes, venue, contacts, fee, status, title) remain permitted.
  // - For future events, rescheduling cannot set start_time into the past.
  const existingStartTime = new Date(existingEvent.start_time).getTime();
  const existingEndTime = new Date(existingEvent.end_time).getTime();
  const now = Date.now();
  const hasEventStarted = existingStartTime <= now;

  if (hasEventStarted) {
    const isStartTimeChanged =
      existingStartTime !== new Date(payload.start_time).getTime();
    const isEndTimeChanged =
      existingEndTime !== new Date(payload.end_time).getTime();
    const isAllDayChanged =
      Boolean(existingEvent.is_all_day) !== Boolean(payload.is_all_day);

    if (isStartTimeChanged || isEndTimeChanged || isAllDayChanged) {
      const vErrors: Record<string, string[]> = {};
      if (isStartTimeChanged) {
        vErrors.start_time = [
          "Scheduling details cannot be modified for events that have already started or concluded.",
        ];
      }
      if (isEndTimeChanged) {
        vErrors.end_time = [
          "Scheduling details cannot be modified for events that have already started or concluded.",
        ];
      }
      if (isAllDayChanged) {
        vErrors.is_all_day = [
          "Scheduling details cannot be modified for events that have already started or concluded.",
        ];
      }
      return {
        success: false,
        error:
          "Scheduling details (start time, end time, and all-day setting) cannot be modified for events that have already started or concluded. You may still update notes, venue, client details, fee, and status.",
        validationErrors: vErrors,
      };
    }
  } else {
    // For future events, prevent rescheduling start_time into the past
    const isStartTimeChanged =
      existingStartTime !== new Date(payload.start_time).getTime();
    if (isStartTimeChanged && new Date(payload.start_time).getTime() <= now) {
      return {
        success: false,
        error:
          "Rescheduled events must start in the future. Please select a later date or time.",
        validationErrors: {
          start_time: [
            "Rescheduled events must start in the future. Please select a later date or time.",
          ],
        },
      };
    }
  }

  const { data, error } = await supabase.rpc("save_artist_calendar_event", {
    p_event_id: payload.event_id,
    p_title: payload.title,
    p_event_type: payload.event_type,
    p_status: payload.status,
    p_start_time: payload.start_time,
    p_end_time: payload.end_time,
    p_is_all_day: payload.is_all_day,
    p_city: payload.city || null,
    p_venue_name: payload.venue_name || null,
    p_venue_address: payload.venue_address || null,
    p_client_name: payload.client_name || null,
    p_client_phone: payload.client_phone || null,
    p_client_email: payload.client_email || null,
    p_agreed_fee: payload.agreed_fee != null ? payload.agreed_fee : null,
    p_deposit_paid: payload.deposit_paid != null ? payload.deposit_paid : null,
    p_private_notes: payload.private_notes || null,
    p_allow_overlap: payload.allow_overlap || false,
  });

  if (error) {
    return {
      success: false,
      error: error.message || "Failed to update calendar event",
    };
  }

  const rpcResult = data as {
    success: boolean;
    conflict?: boolean;
    conflicts?: ConflictingEvent[];
    message?: string;
    error?: string;
    event_id?: string;
  };

  if (!rpcResult.success && rpcResult.conflict) {
    return {
      success: false,
      conflict: true,
      error:
        rpcResult.message ||
        "Scheduling conflict detected with existing confirmed event(s). Explicit confirmation required.",
      conflicts: rpcResult.conflicts || [],
    };
  }

  if (!rpcResult.success) {
    return {
      success: false,
      error: rpcResult.error || "Failed to update calendar event.",
    };
  }

  revalidatePath("/dashboard/artist/calendar");
  revalidatePath("/dashboard/artist");

  return {
    success: true,
    message: "Calendar event updated successfully.",
    data: { event_id: rpcResult.event_id! },
  };
}

/**
 * Delete a calendar event
 * Enforces ownership and platform booking deletion shield via RPC
 */
export async function deleteCalendarEventAction(
  eventId: string
): Promise<CalendarActionResult<{ message: string }>> {
  if (
    !eventId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      eventId.trim()
    )
  ) {
    return {
      success: false,
      error: "Invalid event ID format.",
    };
  }

  const supabase = await createClient();
  const authCheck = await verifyArtistSession(supabase);
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const { data, error } = await supabase.rpc("delete_artist_calendar_event", {
    p_event_id: eventId.trim(),
  });

  if (error) {
    return {
      success: false,
      error: error.message || "Failed to delete calendar event.",
    };
  }

  const rpcResult = data as {
    success: boolean;
    error?: string;
    message?: string;
  };

  if (!rpcResult.success) {
    return {
      success: false,
      error: rpcResult.error || "Event not found or access denied.",
    };
  }

  revalidatePath("/dashboard/artist/calendar");
  revalidatePath("/dashboard/artist");

  return {
    success: true,
    message: rpcResult.message || "Event deleted successfully.",
    data: { message: rpcResult.message || "Event deleted successfully." },
  };
}

/**
 * Read-only conflict check for a prospective booking or date change
 * Returns conflicting confirmed events without saving to database
 */
export async function checkCalendarConflictAction(
  input: CheckCalendarConflictInput
): Promise<
  CalendarActionResult<{ hasConflict: boolean; conflicts: ConflictingEvent[] }>
> {
  const parsed = checkCalendarConflictSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid parameters for conflict check",
      validationErrors: formatZodErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const authCheck = await verifyArtistSession(supabase);
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const { start_time, end_time, event_id, status } = parsed.data;

  // Non-confirmed events do not generate conflicts
  if (status !== "confirmed") {
    return {
      success: true,
      data: { hasConflict: false, conflicts: [] },
    };
  }

  let query = supabase
    .from("artist_calendar_events")
    .select("id, title, start_time, end_time, event_type, is_all_day")
    .eq("artist_id", authCheck.userId)
    .eq("status", "confirmed")
    .lt("start_time", end_time)
    .gt("end_time", start_time);

  if (event_id) {
    query = query.neq("id", event_id);
  }

  const { data, error } = await query;

  if (error) {
    return {
      success: false,
      error: `Conflict check query failed: ${error.message}`,
    };
  }

  const conflicts = (data as ConflictingEvent[]) || [];

  return {
    success: true,
    data: {
      hasConflict: conflicts.length > 0,
      conflicts,
    },
  };
}

