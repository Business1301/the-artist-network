/**
 * The Artist Network — Phase 6B-1: Business Gigs & Artist Applications
 * Shared TypeScript Types & Safe Formatting Utilities
 */

export const GIG_ARTIST_CATEGORIES = [
  "Singers & Vocalists",
  "DJs & Electronic Music",
  "Live Bands & Instrumentalists",
  "Stand-up Comedians",
  "Dancers & Choreographers",
  "Painters & Visual Artists",
  "Magicians & Illusionists",
  "Anchors & Event Hosts",
  "Classical & Folk Artists",
  "Multiple Categories / Open",
] as const;

export type CompensationType = "fixed" | "range" | "negotiable";
export type GigStatus = "open" | "closed" | "withdrawn";
export type GigModerationStatus = "active" | "removed";
export type GigApplicationStatus = "submitted" | "shortlisted" | "rejected" | "withdrawn";

export interface BusinessPostedGig {
  id: string;
  business_id: string;
  business_name: string;
  business_verified: boolean;
  business_suspended: boolean;
  title: string;
  artist_category: string;
  description: string;
  requirements: string | null;
  event_date: string; // YYYY-MM-DD
  event_start_time: string; // HH:MM:SS or HH:MM
  event_end_time: string | null;
  city: string;
  venue_location: string;
  compensation_type: CompensationType;
  budget_min: number | null;
  budget_max: number | null;
  application_deadline: string; // ISO timestamptz
  status: GigStatus;
  moderation_status: GigModerationStatus;
  moderation_reason: string | null;
  published_at: string;
  created_at: string;
  updated_at: string;
  total_applicants: number;
  shortlisted_count: number;
}

export interface ArtistVisibleGig {
  id: string;
  business_id: string;
  business_name: string;
  business_verified: boolean;
  business_category: string;
  title: string;
  artist_category: string;
  description: string;
  requirements: string | null;
  event_date: string;
  event_start_time: string;
  event_end_time: string | null;
  city: string;
  venue_location: string;
  compensation_type: CompensationType;
  budget_min: number | null;
  budget_max: number | null;
  application_deadline: string;
  published_at: string;
  my_application_id: string | null;
  my_application_status: GigApplicationStatus | null;
}

export interface ArtistGigDetail extends ArtistVisibleGig {
  business_active: boolean;
  status: GigStatus;
  my_pitch_message: string | null;
  my_proposed_fee: number | null;
  my_business_feedback: string | null;
}

export interface ArtistGigApplicationItem {
  application_id: string;
  gig_id: string;
  gig_title: string;
  artist_category: string;
  event_date: string;
  event_start_time: string;
  event_end_time: string | null;
  city: string;
  venue_location: string;
  compensation_type: CompensationType;
  budget_min: number | null;
  budget_max: number | null;
  application_deadline: string;
  gig_status: GigStatus;
  gig_moderation_status: GigModerationStatus;
  business_name: string;
  business_verified: boolean;
  business_suspended: boolean;
  pitch_message: string;
  proposed_fee: number | null;
  application_status: GigApplicationStatus;
  business_feedback: string | null;
  reviewed_at: string | null;
  applied_at: string;
}

export interface BusinessGigApplicantItem {
  application_id: string;
  gig_id: string;
  artist_id: string;
  stage_name: string;
  artist_slug: string;
  artist_category: string;
  artist_city: string;
  profile_image_url: string | null;
  artist_verified: boolean;
  profile_status: string;
  pitch_message: string;
  proposed_fee: number | null;
  status: GigApplicationStatus;
  business_feedback: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface ArtistEligibilityState {
  canApply: boolean;
  profileStatus: string | null;
  message?: string;
}

export interface GigActionResult<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  validationErrors?: Record<string, string[]>;
}

export interface GigFilterParams {
  category?: string;
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  minBudget?: number | null;
  maxBudget?: number | null;
  query?: string;
}

/** Today's calendar date YYYY-MM-DD in Asia/Kolkata (IST) */
export function getTodayIstDateStr(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

/** Max event calendar date YYYY-MM-DD (+730 days in IST) */
export function getMaxEventIstDateStr(): string {
  const now = new Date();
  const future = new Date(now.getTime() + 730 * 86400000);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(future);
}

/** Convert an ISO UTC string to an IST YYYY-MM-DD calendar string */
export function toIstDateStr(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Convert IST `datetime-local` input (`YYYY-MM-DDTHH:mm`) to ISO string with +05:30 offset */
export function istLocalInputToIso(localDateTime: string): string {
  const trimmed = localDateTime.trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    const base = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
    return `${base}+05:30`;
  }
  return trimmed;
}

/** Convert ISO string to IST `YYYY-MM-DDTHH:mm` for datetime-local inputs */
export function isoToIstLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
}

/** Format compensation in INR consistently */
export function formatGigBudgetInr(
  type: CompensationType,
  min: number | null,
  max: number | null
): string {
  const fmt = (n: number) => `₹${Number(n).toLocaleString("en-IN")}`;
  if (type === "fixed" && min !== null) {
    return `${fmt(min)} (Fixed)`;
  }
  if (type === "range" && min !== null && max !== null) {
    return `${fmt(min)} – ${fmt(max)}`;
  }
  if (min !== null && max !== null && max > min) {
    return `${fmt(min)} – ${fmt(max)} (Negotiable)`;
  }
  if (min !== null && min > 0) {
    return `From ${fmt(min)} (Negotiable)`;
  }
  return "Negotiable / Discuss with Venue";
}

/** Format HH:MM(:SS) cleanly for display */
export function formatTime12h(timeStr: string | null | undefined): string {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return timeStr;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Format YYYY-MM-DD nicely in Indian English */
export function formatEventDateIst(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Format ISO timestamptz in IST */
export function formatDeadlineIst(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }) + " IST";
}
