"use client";

import { useState, useEffect, useCallback, useId } from "react";
import Link from "next/link";
import { submitBookingEnquiryAction } from "@/app/actions/enquiries";
import {
  BookingEventType,
  getMinimumEventDateIST,
} from "@/lib/enquiries/types";
import { EVENT_TYPES } from "@/lib/enquiries/schemas";

interface CurrentUser {
  id: string;
  email?: string;
  role: string;
  fullName: string;
}

interface BookingEnquirySectionProps {
  artistId: string;
  artistSlug: string;
  artistStageName: string;
  currentUser: CurrentUser | null;
}

const EVENT_TYPE_LABELS: Record<BookingEventType, string> = {
  corporate: "Corporate Event",
  wedding: "Wedding / Reception",
  restaurant: "Restaurant / Cafe / Lounge",
  festival: "Festival / Public Event",
  private: "Private Party / Gathering",
  concert: "Concert / Ticketed Show",
  other: "Other Event",
};

export default function BookingEnquirySection({
  artistId,
  artistSlug,
  artistStageName,
  currentUser,
}: BookingEnquirySectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEnquiryId, setSubmittedEnquiryId] = useState<string | null>(
    null
  );
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Minimum allowed date is tomorrow in Indian Standard Time (UTC+5:30)
  const minDate = getMinimumEventDateIST();

  // Form State
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState<BookingEventType>("corporate");
  const [eventLocation, setEventLocation] = useState("");
  const [indicativeBudget, setIndicativeBudget] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState("");
  const [requirements, setRequirements] = useState("");
  const [businessMessage, setBusinessMessage] = useState("");

  const modalTitleId = useId();

  // Reset form
  const handleReset = useCallback(() => {
    setEventDate("");
    setEventType("corporate");
    setEventLocation("");
    setIndicativeBudget("");
    setNumberOfGuests("");
    setRequirements("");
    setBusinessMessage("");
    setGeneralError(null);
    setFieldErrors({});
    setSubmittedEnquiryId(null);
  }, []);

  const handleOpen = () => {
    handleReset();
    setIsOpen(true);
  };

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setIsOpen(false);
    }
  }, [isSubmitting]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, handleClose]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setGeneralError(null);
    setFieldErrors({});

    try {
      const budgetNum = indicativeBudget ? parseFloat(indicativeBudget) : null;
      const guestsNum = numberOfGuests ? parseInt(numberOfGuests, 10) : null;

      const res = await submitBookingEnquiryAction({
        artistId,
        eventDate,
        eventType,
        eventLocation: eventLocation.trim() || null,
        indicativeBudget: budgetNum !== null && !isNaN(budgetNum) ? budgetNum : null,
        numberOfGuests: guestsNum !== null && !isNaN(guestsNum) ? guestsNum : null,
        requirements: requirements.trim() || null,
        businessMessage: businessMessage.trim() || null,
        message: businessMessage.trim() || null,
      });

      if (!res.success) {
        if (res.validationErrors) {
          setFieldErrors(res.validationErrors);
        }
        setGeneralError(res.error || "Failed to submit enquiry. Please check the form.");
        setIsSubmitting(false);
        return;
      }

      if (res.data?.enquiryId) {
        setSubmittedEnquiryId(res.data.enquiryId);
      }
    } catch {
      setGeneralError("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // ROLE-BASED CONDITIONAL RENDERING (Section 2 Requirements)
  // --------------------------------------------------------------------------

  // Case A: Unauthenticated / Anonymous Visitor
  if (!currentUser) {
    return (
      <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl border border-blue-200/80 p-5 sm:p-6 mb-10 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl" aria-hidden="true">
                📅
              </span>
              <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                Plan an Event with {artistStageName}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Sign in with an Individual or Business account to check availability and submit direct enquiries.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <Link
              href={`/login?redirectTo=/artists/${artistSlug}`}
              className="flex-1 sm:flex-initial text-center bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              Sign In
            </Link>
            <Link
              href={`/signup?role=individual&redirectTo=/artists/${artistSlug}`}
              className="flex-1 sm:flex-initial text-center bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              Join as Individual
            </Link>
            <Link
              href={`/signup?role=business&redirectTo=/artists/${artistSlug}`}
              className="flex-1 sm:flex-initial text-center bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-gray-300 shadow-xs transition-colors"
            >
              Join as Business
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Case B: Authenticated Artist
  if (currentUser.role === "artist") {
    const isSelf = currentUser.id === artistId;
    return (
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 sm:p-5 mb-10 text-xs sm:text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className="text-base" aria-hidden="true">
            ℹ️
          </span>
          <span>
            {isSelf ? (
              <strong>This is your public artist profile.</strong>
            ) : (
              <span>
                You are logged in as an artist. Booking enquiries are submitted by business and client accounts.
              </span>
            )}
          </span>
        </div>
      </div>
    );
  }

  // Case C: Authenticated Admin
  if (currentUser.role === "admin") {
    return (
      <div className="bg-amber-50/70 rounded-2xl border border-amber-200 p-4 sm:p-5 mb-10 text-xs sm:text-sm text-amber-900">
        <div className="flex items-center gap-2">
          <span className="text-base" aria-hidden="true">
            🛡️
          </span>
          <span>
            <strong>Administrator Mode:</strong> Booking enquiry submissions are reserved for client and business accounts.
          </span>
        </div>
      </div>
    );
  }

  // Case D: Authenticated Business or Individual User (Actionable CTA & Modal)
  return (
    <>
      {/* Primary Action Card in Profile */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-5 sm:p-6 mb-10 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl" aria-hidden="true">
                ✨
              </span>
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                Enquire About Booking {artistStageName}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed max-w-xl">
              Submit your event date, type, requirements, and indicative budget directly to the artist. No booking fee or obligation.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpen}
            className="w-full sm:w-auto px-6 py-3 bg-white text-blue-700 hover:bg-blue-50 font-black text-sm rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer"
          >
            <span>📅</span>
            <span>Send Booking Enquiry</span>
          </button>
        </div>
      </div>

      {/* MODAL DIALOG */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={modalTitleId}
        >
          {/* Modal Container */}
          <div className="relative bg-white rounded-2xl max-w-xl w-full border border-gray-200 shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <div>
                <h2
                  id={modalTitleId}
                  className="text-lg sm:text-xl font-black text-gray-900 tracking-tight"
                >
                  Send Booking Enquiry
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  To: <span className="font-bold text-gray-700">{artistStageName}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
                aria-label="Close enquiry modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
              {/* SUCCESS VIEW */}
              {submittedEnquiryId ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black shadow-xs">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900">
                      Enquiry Submitted Successfully!
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1.5 max-w-md mx-auto leading-relaxed">
                      Your enquiry has been delivered to <strong>{artistStageName}</strong>. The artist will review your event details in their workspace.
                    </p>
                    <p className="text-xs font-mono text-gray-400 mt-2">
                      Reference ID: {submittedEnquiryId}
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200/80 rounded-xl p-3 text-xs text-blue-900 text-left">
                    <p className="font-semibold mb-0.5">What happens next?</p>
                    <p className="text-blue-800">
                      You will see this enquiry in your {currentUser.role === "individual" ? "Client" : "Business"} Dashboard. If the artist needs more details or accepts, you will be updated directly in the app.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
                    <Link
                      href={currentUser.role === "individual" ? "/dashboard/client" : "/dashboard/restaurant"}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors"
                    >
                      View in My Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                /* FORM VIEW */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* General Error Banner */}
                  {generalError && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium flex items-start gap-2">
                      <span className="flex-shrink-0 text-base">⚠️</span>
                      <div className="flex-1">
                        <p>{generalError}</p>
                      </div>
                    </div>
                  )}

                  {/* Legal Notice Callout */}
                  <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                    <span className="text-base flex-shrink-0" aria-hidden="true">
                      ℹ️
                    </span>
                    <p className="leading-relaxed">
                      <strong>Non-Binding Notice:</strong> Sending an enquiry does not confirm a booking, guarantee artist availability, or create any payment obligation.
                    </p>
                  </div>

                  {/* Row 1: Event Date & Event Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label
                        htmlFor="enquiry-event-date"
                        className="block text-xs font-bold text-gray-700 mb-1"
                      >
                        Event Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="enquiry-event-date"
                        type="date"
                        min={minDate}
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        required
                        disabled={isSubmitting}
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 font-medium"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">
                        At least tomorrow in IST (UTC+5:30)
                      </p>
                      {fieldErrors.eventDate && (
                        <p className="text-xs text-red-600 mt-0.5">
                          {fieldErrors.eventDate[0]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="enquiry-event-type"
                        className="block text-xs font-bold text-gray-700 mb-1"
                      >
                        Event Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="enquiry-event-type"
                        value={eventType}
                        onChange={(e) =>
                          setEventType(e.target.value as BookingEventType)
                        }
                        required
                        disabled={isSubmitting}
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 font-medium bg-white"
                      >
                        {EVENT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {EVENT_TYPE_LABELS[type]}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.eventType && (
                        <p className="text-xs text-red-600 mt-0.5">
                          {fieldErrors.eventType[0]}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Location & Indicative Budget */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label
                        htmlFor="enquiry-location"
                        className="block text-xs font-bold text-gray-700 mb-1"
                      >
                        Event Location / Venue
                      </label>
                      <input
                        id="enquiry-location"
                        type="text"
                        maxLength={255}
                        placeholder="e.g. Bandra West, Mumbai"
                        value={eventLocation}
                        onChange={(e) => setEventLocation(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 font-medium"
                      />
                      {fieldErrors.eventLocation && (
                        <p className="text-xs text-red-600 mt-0.5">
                          {fieldErrors.eventLocation[0]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="enquiry-budget"
                        className="block text-xs font-bold text-gray-700 mb-1"
                      >
                        Indicative Budget (₹ INR)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-400 text-xs sm:text-sm font-semibold">
                          ₹
                        </span>
                        <input
                          id="enquiry-budget"
                          type="number"
                          min={0}
                          max={100000000}
                          step={500}
                          placeholder="e.g. 50,000"
                          value={indicativeBudget}
                          onChange={(e) => setIndicativeBudget(e.target.value)}
                          disabled={isSubmitting}
                          className="w-full pl-7 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 font-medium"
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Optional non-binding budget estimate
                      </p>
                      {fieldErrors.indicativeBudget && (
                        <p className="text-xs text-red-600 mt-0.5">
                          {fieldErrors.indicativeBudget[0]}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Estimated Number of Guests */}
                  <div>
                    <label
                      htmlFor="enquiry-guests"
                      className="block text-xs font-bold text-gray-700 mb-1"
                    >
                      Estimated Number of Guests
                    </label>
                    <input
                      id="enquiry-guests"
                      type="number"
                      min={1}
                      max={100000}
                      placeholder="e.g. 150 guests"
                      value={numberOfGuests}
                      onChange={(e) => setNumberOfGuests(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 font-medium"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Optional guest headcount (helps the artist assess stage and sound requirements)
                    </p>
                    {fieldErrors.numberOfGuests && (
                      <p className="text-xs text-red-600 mt-0.5">
                        {fieldErrors.numberOfGuests[0]}
                      </p>
                    )}
                  </div>

                  {/* Requirements Textarea */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        htmlFor="enquiry-requirements"
                        className="block text-xs font-bold text-gray-700"
                      >
                        Performance & Technical Requirements
                      </label>
                      <span className="text-[10px] text-gray-400 font-semibold">
                        {requirements.length}/2000
                      </span>
                    </div>
                    <textarea
                      id="enquiry-requirements"
                      rows={3}
                      maxLength={2000}
                      placeholder="Describe stage setup, required performance duration, sound rider details..."
                      value={requirements}
                      onChange={(e) => setRequirements(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 leading-relaxed font-normal resize-y"
                    />
                    {fieldErrors.requirements && (
                      <p className="text-xs text-red-600 mt-0.5">
                        {fieldErrors.requirements[0]}
                      </p>
                    )}
                  </div>

                  {/* Business Message Textarea */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        htmlFor="enquiry-message"
                        className="block text-xs font-bold text-gray-700"
                      >
                        Message to Artist
                      </label>
                      <span className="text-[10px] text-gray-400 font-semibold">
                        {businessMessage.length}/2000
                      </span>
                    </div>
                    <textarea
                      id="enquiry-message"
                      rows={3}
                      maxLength={2000}
                      placeholder="Tell the artist about your venue, event timeline, or specific song preferences..."
                      value={businessMessage}
                      onChange={(e) => setBusinessMessage(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 leading-relaxed font-normal resize-y"
                    />
                    {fieldErrors.businessMessage && (
                      <p className="text-xs text-red-600 mt-0.5">
                        {fieldErrors.businessMessage[0]}
                      </p>
                    )}
                  </div>

                  {/* Form Action Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="px-4 py-2.5 text-xs sm:text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Sending Enquiry...</span>
                        </>
                      ) : (
                        <>
                          <span>✉️</span>
                          <span>Send Enquiry</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

