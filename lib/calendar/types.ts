/**
-- THE ARTIST NETWORK — Phase 4.6: Artist Calendar & Availability Management
-- Types: lib/calendar/types.ts
*/

export type CalendarEventSource = "external_manual" | "platform_booking";
export type CalendarEventType = "gig_booking" | "unavailable_block";
export type CalendarBookingStatus = "tentative" | "confirmed" | "cancelled" | "completed";

export interface ArtistCalendarEvent {
  id: string;
  artist_id: string;
  source: CalendarEventSource;
  event_type: CalendarEventType;
  status: CalendarBookingStatus;
  title: string;
  start_time: string; // ISO 8601 UTC timestamptz
  end_time: string;   // ISO 8601 UTC timestamptz
  is_all_day: boolean;
  city: string | null;
  venue_name: string | null;
  venue_address: string | null;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  agreed_fee: number | null;
  deposit_paid: number | null;
  private_notes: string | null;
  platform_inquiry_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConflictingEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  event_type: CalendarEventType;
  is_all_day: boolean;
}

export interface ConflictResponse {
  success: false;
  conflict: true;
  message: string;
  conflicts: ConflictingEvent[];
}

export type CalendarActionResult<T = unknown> =
  | {
      success: true;
      message?: string;
      data: T;
    }
  | {
      success: false;
      error: string;
      conflict?: false;
      validationErrors?: Record<string, string[]>;
    }
  | {
      success: false;
      error: string;
      conflict: true;
      conflicts: ConflictingEvent[];
    };

