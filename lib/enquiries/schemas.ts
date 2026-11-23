/**
 * The Artist Network — Phase 5.1: Booking Enquiry System
 * Zod Validation Schemas
 *
 * File: lib/enquiries/schemas.ts
 */

import { z } from "zod";
import { getMinimumEventDateIST } from "./types";

/**
 * Event types supported by the booking enquiry system
 */
export const EVENT_TYPES = [
  "wedding",
  "corporate",
  "restaurant",
  "festival",
  "private",
  "concert",
  "other",
] as const;

/**
 * Actions supported for artist responses
 */
export const ARTIST_ACTIONS = [
  "seen",
  "interested",
  "decline",
  "request_info",
] as const;

/**
 * Validation schema for submitting a new booking enquiry (Business role)
 */
export const submitEnquirySchema = z.object({
  artistId: z.string().uuid({ message: "Invalid target artist ID" }),
  eventDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "Event date must be in YYYY-MM-DD format",
    })
    .refine(
      (date) => {
        const minDate = getMinimumEventDateIST();
        return date >= minDate;
      },
      {
        message:
          "Event date must be in the future (at least tomorrow in Indian Standard Time)",
      }
    )
    .refine(
      (date) => {
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const maxDate = new Date(
          now.getTime() + now.getTimezoneOffset() * 60 * 1000 + istOffset
        );
        maxDate.setDate(maxDate.getDate() + 730);
        return date <= maxDate.toISOString().slice(0, 10);
      },
      {
        message: "Event date cannot be more than 2 years in advance",
      }
    ),
  eventType: z.enum(EVENT_TYPES, {
    message:
      "Invalid event type. Must be wedding, corporate, restaurant, festival, private, concert, or other",
  }),
  eventLocation: z
    .string()
    .trim()
    .max(255, { message: "Location text cannot exceed 255 characters" })
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  requirements: z
    .string()
    .trim()
    .max(2000, { message: "Requirements text cannot exceed 2000 characters" })
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  indicativeBudget: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === undefined || val === null || val === "") return null;
      const num = typeof val === "number" ? val : parseFloat(val);
      return isNaN(num) ? null : num;
    })
    .pipe(
      z
        .number({ message: "Indicative budget must be a valid number" })
        .min(0, { message: "Indicative budget cannot be negative" })
        .max(100_000_000, {
          message: "Indicative budget exceeds maximum limit (₹10,00,00,000)",
        })
        .nullable()
    ),
  businessMessage: z
    .string()
    .trim()
    .max(2000, { message: "Business message cannot exceed 2000 characters" })
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
});

export type SubmitEnquiryInput = z.infer<typeof submitEnquirySchema>;

/**
 * Validation schema for artist response actions
 */
export const respondEnquirySchema = z
  .object({
    enquiryId: z.string().uuid({ message: "Invalid enquiry ID" }),
    action: z.enum(ARTIST_ACTIONS, {
      message:
        'Action must be "seen", "interested", "decline", or "request_info"',
    }),
    response: z
      .string()
      .trim()
      .max(2000, { message: "Response cannot exceed 2000 characters" })
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : null)),
  })
  .refine(
    (data) => {
      if (data.action === "request_info") {
        return (
          data.response !== null &&
          data.response !== undefined &&
          data.response.length >= 5
        );
      }
      return true;
    },
    {
      message:
        "Clarification request requires a descriptive question or note (at least 5 characters)",
      path: ["response"],
    }
  );

export type RespondEnquiryInput = z.infer<typeof respondEnquirySchema>;

/**
 * Validation schema for business providing single clarification (Business role)
 */
export const clarifyEnquirySchema = z.object({
  enquiryId: z.string().uuid({ message: "Invalid enquiry ID" }),
  clarification: z
    .string()
    .trim()
    .min(5, {
      message: "Clarification message must be at least 5 characters long",
    })
    .max(2000, {
      message: "Clarification message cannot exceed 2000 characters",
    }),
});

export type ClarifyEnquiryInput = z.infer<typeof clarifyEnquirySchema>;

/**
 * Validation schema for withdrawing an open enquiry (Business role)
 */
export const withdrawEnquirySchema = z.object({
  enquiryId: z.string().uuid({ message: "Invalid enquiry ID" }),
});

export type WithdrawEnquiryInput = z.infer<typeof withdrawEnquirySchema>;

/**
 * Validation schema for listing enquiries with filters
 */
export const enquiryListFilterSchema = z.object({
  status: z
    .enum([
      "all",
      "open",
      "terminal",
      "submitted",
      "seen",
      "info_requested",
      "clarified",
      "interested",
      "declined",
      "withdrawn",
    ])
    .optional()
    .default("all"),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type EnquiryListFilterInput = z.infer<typeof enquiryListFilterSchema>;

