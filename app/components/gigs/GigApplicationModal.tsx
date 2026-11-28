"use client";

import { useState } from "react";
import Link from "next/link";
import {
  type ArtistEligibilityState,
  type ArtistGigDetail,
  type ArtistVisibleGig,
  formatDeadlineIst,
  formatEventDateIst,
  formatGigBudgetInr,
  formatTime12h,
} from "@/lib/gigs/types";
import { submitGigApplicationSchema } from "@/lib/gigs/schemas";
import { submitGigApplicationAction } from "@/app/actions/businessGigs";

interface GigApplicationModalProps {
  gig: ArtistVisibleGig | ArtistGigDetail;
  eligibility: ArtistEligibilityState | null;
  onClose: () => void;
  onSuccess: (gigId: string, applicationId: string, message: string) => void;
}

export default function GigApplicationModal({
  gig,
  eligibility,
  onClose,
  onSuccess,
}: GigApplicationModalProps) {
  const [pitchMessage, setPitchMessage] = useState("");
  const [proposedFee, setProposedFee] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const payload = {
      gigId: gig.id,
      pitchMessage,
      proposedFee: proposedFee.trim() === "" ? null : Number(proposedFee),
    };

    const parsed = submitGigApplicationSchema.safeParse(payload);
    if (!parsed.success) {
      const grouped: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".") || "form";
        grouped[key] = [...(grouped[key] || []), issue.message];
      }
      setFieldErrors(grouped);
      setFormError("Please fix the highlighted fields below.");
      return;
    }

    setIsSubmitting(true);
    const res = await submitGigApplicationAction(parsed.data);
    setIsSubmitting(false);

    if (!res.success || !res.data) {
      if (res.validationErrors) setFieldErrors(res.validationErrors);
      setFormError(res.error || "Unable to submit your application.");
      return;
    }

    onSuccess(
      gig.id,
      res.data,
      res.message || "Your application has been submitted to the business."
    );
  }

  const isIneligible = eligibility !== null && !eligibility.canApply;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gig-apply-modal-title"
    >
      <div className="bg-white rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl border border-gray-200 my-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">
              Apply to Business Gig
            </span>
            <h2
              id="gig-apply-modal-title"
              className="text-lg sm:text-xl font-extrabold text-gray-900 mt-0.5"
            >
              {gig.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="text-gray-400 hover:text-gray-700 text-xl font-bold px-2 py-1 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Summary Strip */}
        <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-1 mb-5">
          <div className="flex flex-wrap items-center gap-2 text-gray-800 font-semibold">
            <span>{gig.business_name}</span>
            {gig.business_verified && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                ✓ Verified Business
              </span>
            )}
          </div>
          <p className="text-gray-600">
            {formatEventDateIst(gig.event_date)} · {formatTime12h(gig.event_start_time)}
            {" · "}
            {gig.venue_location}, {gig.city}
          </p>
          <p className="text-gray-700 font-semibold">
            Budget: {formatGigBudgetInr(gig.compensation_type, gig.budget_min, gig.budget_max)}
            <span className="text-gray-400 font-normal ml-2">
              (Closes {formatDeadlineIst(gig.application_deadline)})
            </span>
          </p>
        </div>

        {isIneligible ? (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-3 text-xs">
            <h3 className="font-bold text-amber-900 text-sm">
              Artist Profile Publication Required Before Applying
            </h3>
            <p className="text-amber-800 leading-relaxed">
              {eligibility.message ||
                "Complete and publish your Artist Profile before applying so hiring venues can inspect your stage work. Identity verification is optional."}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {eligibility.profileStatus !== "suspended" && (
                <Link
                  href="/dashboard/artist/edit"
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs"
                >
                  Complete &amp; Publish Artist Profile →
                </Link>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-amber-300 bg-white text-amber-900 font-semibold hover:bg-amber-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-medium">
                {formError}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-gray-700">
                  Your Pitch to {gig.business_name} <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-gray-400">
                  {pitchMessage.length}/2000
                </span>
              </div>
              <textarea
                rows={5}
                value={pitchMessage}
                onChange={(e) => setPitchMessage(e.target.value)}
                minLength={15}
                maxLength={2000}
                required
                placeholder="Share why your act fits this venue, relevant set experience, band/gear setup, and any questions for the organiser..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900 resize-y"
              />
              {fieldErrors.pitchMessage?.[0] && (
                <p className="mt-1 text-[11px] text-red-600">
                  {fieldErrors.pitchMessage[0]}
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Proposed Fee in ₹ INR <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="number"
                min={0}
                step="1"
                value={proposedFee}
                onChange={(e) => setProposedFee(e.target.value)}
                placeholder="Leave blank if open to the listed budget"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900"
              />
              {fieldErrors.proposedFee?.[0] && (
                <p className="mt-1 text-[11px] text-red-600">
                  {fieldErrors.proposedFee[0]}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold shadow-sm cursor-pointer"
              >
                {isSubmitting ? "Submitting Application…" : "Submit Application"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
