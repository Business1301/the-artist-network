/**
 * The Artist Network — Phase 6B-1: Business Gigs & Applications
 * Zod Validation Schemas
 */

import { z } from "zod";
import {
  getMaxEventIstDateStr,
  getTodayIstDateStr,
  istLocalInputToIso,
  toIstDateStr,
} from "./types";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}(:\d{2})?$/;

const nullableBudgetField = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((val, ctx) => {
    if (val === undefined || val === null || val === "") return null;
    const n = typeof val === "number" ? val : Number(val.trim());
    if (Number.isNaN(n) || !Number.isFinite(n)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Budget must be a valid number in INR",
      });
      return z.NEVER;
    }
    if (n < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Budget cannot be negative",
      });
      return z.NEVER;
    }
    if (n > 100_000_000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Budget value is unrealistically high",
      });
      return z.NEVER;
    }
    return Math.round(n * 100) / 100;
  });

const gigBaseFields = z.object({
  title: z
    .string()
    .trim()
    .min(5, { message: "Title must be at least 5 characters" })
    .max(120, { message: "Title cannot exceed 120 characters" }),
  artistCategory: z
    .string()
    .trim()
    .min(2, { message: "Artist category is required" })
    .max(100, { message: "Artist category cannot exceed 100 characters" }),
  description: z
    .string()
    .trim()
    .min(20, { message: "Description must be at least 20 characters" })
    .max(3000, { message: "Description cannot exceed 3000 characters" }),
  requirements: z
    .string()
    .trim()
    .max(2000, { message: "Requirements cannot exceed 2000 characters" })
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
  eventDate: z
    .string()
    .regex(DATE_REGEX, { message: "Event date must be YYYY-MM-DD" })
    .refine((d) => d >= getTodayIstDateStr(), {
      message: "Event date must be today or in the future (IST)",
    })
    .refine((d) => d <= getMaxEventIstDateStr(), {
      message: "Event date cannot be more than 2 years in advance",
    }),
  eventStartTime: z
    .string()
    .regex(TIME_REGEX, { message: "Start time must be HH:MM" }),
  eventEndTime: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : null))
    .refine((v) => v === null || TIME_REGEX.test(v), {
      message: "End time must be HH:MM",
    }),
  city: z
    .string()
    .trim()
    .min(2, { message: "City is required" })
    .max(100, { message: "City cannot exceed 100 characters" }),
  venueLocation: z
    .string()
    .trim()
    .min(2, { message: "Venue / locality is required" })
    .max(200, { message: "Venue / locality cannot exceed 200 characters" }),
  compensationType: z.enum(["fixed", "range", "negotiable"], {
    message: "Select fixed, range, or negotiable compensation",
  }),
  budgetMin: nullableBudgetField,
  budgetMax: nullableBudgetField,
  applicationDeadline: z
    .string()
    .trim()
    .min(1, { message: "Application deadline is required" })
    .transform((val) => istLocalInputToIso(val))
    .refine((val) => !Number.isNaN(new Date(val).getTime()), {
      message: "Please enter a valid application deadline",
    })
    .refine((val) => new Date(val).getTime() > Date.now(), {
      message: "Application deadline must be in the future",
    }),
});

function validateGigRefinements(
  data: z.infer<typeof gigBaseFields>,
  ctx: z.RefinementCtx
) {
  if (data.compensationType === "fixed") {
    if (data.budgetMin === null || data.budgetMin <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["budgetMin"],
        message: "Fixed compensation requires a positive amount in INR",
      });
    }
  } else if (data.compensationType === "range") {
    if (data.budgetMin === null || data.budgetMin <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["budgetMin"],
        message: "Minimum budget in INR is required for range compensation",
      });
    }
    if (data.budgetMax === null || data.budgetMax <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["budgetMax"],
        message: "Maximum budget in INR is required for range compensation",
      });
    }
    if (
      data.budgetMin !== null &&
      data.budgetMax !== null &&
      data.budgetMax < data.budgetMin
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["budgetMax"],
        message: "Maximum budget must be greater than or equal to minimum budget",
      });
    }
  } else if (
    data.budgetMin !== null &&
    data.budgetMax !== null &&
    data.budgetMax < data.budgetMin
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["budgetMax"],
      message: "Maximum budget must be greater than or equal to minimum budget",
    });
  }

  const deadlineIstDate = toIstDateStr(data.applicationDeadline);
  if (deadlineIstDate && deadlineIstDate > data.eventDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["applicationDeadline"],
      message: "Application deadline cannot be after the event date",
    });
  }
}

export const createGigSchema = gigBaseFields.superRefine(validateGigRefinements);

export const updateGigSchema = gigBaseFields
  .extend({
    gigId: z.string().uuid({ message: "Invalid gig ID" }),
  })
  .superRefine((data, ctx) => validateGigRefinements(data, ctx));

export const setGigStatusSchema = z.object({
  gigId: z.string().uuid({ message: "Invalid gig ID" }),
  status: z.enum(["open", "closed", "withdrawn"], {
    message: "Status must be open, closed, or withdrawn",
  }),
});

export const submitGigApplicationSchema = z.object({
  gigId: z.string().uuid({ message: "Invalid gig ID" }),
  pitchMessage: z
    .string()
    .trim()
    .min(15, { message: "Your pitch must be at least 15 characters" })
    .max(2000, { message: "Pitch message cannot exceed 2000 characters" }),
  proposedFee: nullableBudgetField,
});

export const reviewGigApplicationSchema = z.object({
  applicationId: z.string().uuid({ message: "Invalid application ID" }),
  decision: z.enum(["shortlisted", "rejected"], {
    message: "Decision must be shortlisted or rejected",
  }),
  feedback: z
    .string()
    .trim()
    .max(1000, { message: "Feedback cannot exceed 1000 characters" })
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type CreateGigInput = z.input<typeof createGigSchema>;
export type UpdateGigInput = z.input<typeof updateGigSchema>;
export type SubmitGigApplicationInput = z.input<typeof submitGigApplicationSchema>;
export type ReviewGigApplicationInput = z.input<typeof reviewGigApplicationSchema>;
