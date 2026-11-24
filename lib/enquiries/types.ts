/**
 * The Artist Network — Phase 5.1: Booking Enquiry System
 * Type Definitions & Invariants
 *
 * File: lib/enquiries/types.ts
 */

export type BookingEnquiryStatus =
  | "submitted"
  | "seen"
  | "info_requested"
  | "clarified"
  | "interested"
  | "declined"
  | "withdrawn";

export type BookingEventType =
  | "wedding"
  | "corporate"
  | "restaurant"
  | "festival"
  | "private"
  | "concert"
  | "other";

export type ActorRole = "business" | "artist" | "admin" | "individual";

/**
 * Open statuses consume active enquiry quotas (max 3 per pair, max 10 platform-wide).
 */
export const OPEN_ENQUIRY_STATUSES: readonly BookingEnquiryStatus[] = [
  "submitted",
  "seen",
  "info_requested",
  "clarified",
] as const;

/**
 * Terminal statuses are concluded and do NOT consume active enquiry quotas.
 * Note: 'interested' is a non-binding expression of mutual interest and NOT a confirmed booking.
 */
export const TERMINAL_ENQUIRY_STATUSES: readonly BookingEnquiryStatus[] = [
  "interested",
  "declined",
  "withdrawn",
] as const;

/**
 * Core booking enquiry entity matching public.booking_enquiries
 */
export interface BookingEnquiry {
  id: string;
  business_id: string;
  requester_id?: string | null;
  requester_type?: "business" | "individual" | null;
  artist_id: string;
  status: BookingEnquiryStatus;
  event_date: string; // YYYY-MM-DD
  event_type: BookingEventType;
  event_location: string | null;
  requirements: string | null;
  indicative_budget: number | null; // Always denominated in INR, non-binding
  number_of_guests?: number | null;
  business_message: string | null;
  artist_response: string | null;
  business_clarification: string | null;
  seen_at: string | null;
  responded_at: string | null;
  clarified_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Immutable audit history event matching public.booking_enquiry_events
 */
export interface BookingEnquiryEvent {
  id: string;
  enquiry_id: string;
  actor_id: string | null;
  actor_role: ActorRole;
  action: BookingEnquiryStatus;
  notes: string | null;
  created_at: string;
}

/**
 * Joined artist profile summary for enquiry display
 */
export interface EnquiryArtistProfile {
  id: string;
  stage_name: string;
  slug: string;
  category: string | null;
  city: string | null;
  profile_image_url: string | null;
  is_verified: boolean;
}

/**
 * Joined business profile summary for enquiry display (safe public fields only)
 */
export interface EnquiryBusinessProfile {
  id: string;
  full_name: string;
  role: "business" | "individual";
}

/**
 * Joined requester profile summary (business or individual)
 */
export interface EnquiryRequesterProfile {
  id: string;
  full_name: string;
  role: "business" | "individual";
}

/**
 * Comprehensive enquiry object with joined profiles and event trail
 */
export interface BookingEnquiryWithDetails extends BookingEnquiry {
  artist_profile?: EnquiryArtistProfile | null;
  business_profile?: EnquiryBusinessProfile | null;
  requester_profile?: EnquiryRequesterProfile | null;
  events?: BookingEnquiryEvent[];
}

/**
 * Server action return envelope
 */
export interface EnquiryActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: Record<string, string[]>;
}

/**
 * Query filter for enquiry listings
 */
export type EnquiryStatusFilter =
  | "all"
  | "open"
  | "terminal"
  | BookingEnquiryStatus;

export interface EnquiryListFilter {
  status?: EnquiryStatusFilter;
  limit?: number;
  offset?: number;
}

/**
 * Helper: Check whether a status is active / open
 */
export function isOpenStatus(status: BookingEnquiryStatus): boolean {
  return (OPEN_ENQUIRY_STATUSES as readonly string[]).includes(status);
}

/**
 * Helper: Check whether a status is terminal / concluded
 */
export function isTerminalStatus(status: BookingEnquiryStatus): boolean {
  return (TERMINAL_ENQUIRY_STATUSES as readonly string[]).includes(status);
}

/**
 * Helper: Check if an event date is in the past relative to Indian Standard Time (UTC+5:30)
 */
export function isPastEventDate(eventDate: string): boolean {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(
    now.getTime() + now.getTimezoneOffset() * 60 * 1000 + istOffset
  );
  const todayIst = istDate.toISOString().slice(0, 10);
  return eventDate < todayIst;
}

/**
 * Helper: Calculate minimum allowed event date in Indian Standard Time (strictly tomorrow or later)
 */
export function getMinimumEventDateIST(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(
    now.getTime() + now.getTimezoneOffset() * 60 * 1000 + istOffset
  );
  // Add 1 day
  istDate.setDate(istDate.getDate() + 1);
  return istDate.toISOString().slice(0, 10);
}

