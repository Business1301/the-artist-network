import { z } from "zod";

/**
 * Common ISO-8601 Datetime String Validator
 */
const isoDatetimeString = z
  .string()
  .min(1, "Timestamp is required")
  .refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid ISO datetime string",
  });

/**
 * Raw unrefined shape for calendar events
 */
const calendarEventRawShape = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Event title is required")
    .max(120, "Event title cannot exceed 120 characters"),
  event_type: z.enum(["gig_booking", "unavailable_block"], {
    error: "Event type must be 'gig_booking' or 'unavailable_block'",
  }),
  status: z
    .enum(["tentative", "confirmed", "cancelled", "completed"], {
      error: "Status must be 'tentative', 'confirmed', 'cancelled', or 'completed'",
    })
    .default("confirmed"),
  start_time: isoDatetimeString,
  end_time: isoDatetimeString,
  is_all_day: z.boolean().default(false),
  city: z.string().trim().max(100, "City cannot exceed 100 characters").nullish(),
  venue_name: z
    .string()
    .trim()
    .max(150, "Venue name cannot exceed 150 characters")
    .nullish(),
  venue_address: z
    .string()
    .trim()
    .max(300, "Venue address cannot exceed 300 characters")
    .nullish(),
  client_name: z
    .string()
    .trim()
    .max(120, "Client name cannot exceed 120 characters")
    .nullish(),
  client_phone: z
    .string()
    .trim()
    .max(30, "Client phone cannot exceed 30 characters")
    .nullish(),
  client_email: z
    .string()
    .trim()
    .max(120, "Client email cannot exceed 120 characters")
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Invalid client email address format",
    })
    .nullish(),
  agreed_fee: z
    .number()
    .min(0, "Agreed fee cannot be negative")
    .max(99999999.99, "Agreed fee exceeds maximum allowed limit")
    .nullish(),
  deposit_paid: z
    .number()
    .min(0, "Deposit paid cannot be negative")
    .max(99999999.99, "Deposit paid exceeds maximum allowed limit")
    .nullish(),
  private_notes: z
    .string()
    .trim()
    .max(1000, "Private notes cannot exceed 1000 characters")
    .nullish(),
  allow_overlap: z.boolean().default(false),
});

/**
 * Shared timing and financial refinements
 */
interface CalendarRefinementData {
  start_time: string;
  end_time: string;
  agreed_fee?: number | null;
  deposit_paid?: number | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyCalendarRefinements<T extends z.ZodObject<any>>(schema: T) {
  return schema
    .refine(
      (data) => {
        const item = data as CalendarRefinementData;
        return new Date(item.end_time).getTime() > new Date(item.start_time).getTime();
      },
      {
        message: "End time must be strictly after start time",
        path: ["end_time"],
      }
    )
    .refine(
      (data) => {
        const item = data as CalendarRefinementData;
        if (item.agreed_fee != null && item.deposit_paid != null) {
          return item.deposit_paid <= item.agreed_fee;
        }
        return true;
      },
      {
        message: "Deposit paid cannot exceed total agreed fee",
        path: ["deposit_paid"],
      }
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFutureStartRefinement<T extends z.ZodType<any>>(schema: T) {
  return schema.refine(
    (data) => {
      const item = data as CalendarRefinementData;
      return new Date(item.start_time).getTime() > Date.now();
    },
    {
      message: "Bookings must start in the future. Please select a later date or time.",
      path: ["start_time"],
    }
  );
}

/**
 * Base Schema for Calendar Event Payload
 */
export const calendarEventBaseSchema = applyCalendarRefinements(calendarEventRawShape);

/**
 * Schema for Creating a Manual External Gig
 */
export const createManualGigSchema = applyFutureStartRefinement(
  applyCalendarRefinements(
    calendarEventRawShape.extend({
      event_type: z.literal("gig_booking").default("gig_booking"),
    })
  )
);

/**
 * Schema for Creating an Unavailable / Blocked Time Period
 */
export const createUnavailableBlockSchema = applyFutureStartRefinement(
  applyCalendarRefinements(
    calendarEventRawShape.extend({
      event_type: z.literal("unavailable_block").default("unavailable_block"),
    })
  )
);

/**
 * Schema for Updating an Existing Calendar Event
 */
export const updateCalendarEventSchema = applyCalendarRefinements(
  calendarEventRawShape.extend({
    event_id: z.string().uuid("Invalid calendar event ID format"),
  })
);

/**
 * Schema for Calendar Date Range Queries
 */
export const calendarDateRangeSchema = z
  .object({
    start_date: isoDatetimeString,
    end_date: isoDatetimeString,
  })
  .refine(
    (data) => new Date(data.end_date).getTime() > new Date(data.start_date).getTime(),
    {
      message: "Range end date must be strictly after start date",
      path: ["end_date"],
    }
  );

/**
 * Schema for Checking Conflict
 */
export const checkCalendarConflictSchema = z.object({
  event_id: z.string().uuid().nullish(),
  start_time: isoDatetimeString,
  end_time: isoDatetimeString,
  status: z
    .enum(["tentative", "confirmed", "cancelled", "completed"])
    .default("confirmed"),
});

export type CreateManualGigInput = z.infer<typeof createManualGigSchema>;
export type CreateUnavailableBlockInput = z.infer<typeof createUnavailableBlockSchema>;
export type UpdateCalendarEventInput = z.infer<typeof updateCalendarEventSchema>;
export type CalendarDateRangeInput = z.infer<typeof calendarDateRangeSchema>;
export type CheckCalendarConflictInput = z.infer<typeof checkCalendarConflictSchema>;
