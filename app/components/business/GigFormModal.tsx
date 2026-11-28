"use client";

import { useState } from "react";
import {
  GIG_ARTIST_CATEGORIES,
  type BusinessPostedGig,
  type CompensationType,
  getMaxEventIstDateStr,
  getTodayIstDateStr,
  isoToIstLocalInput,
  istLocalInputToIso,
} from "@/lib/gigs/types";
import { createGigSchema, updateGigSchema } from "@/lib/gigs/schemas";
import {
  createBusinessGigAction,
  updateBusinessGigAction,
} from "@/app/actions/businessGigs";

interface GigFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (gigId: string, mode: "create" | "edit", message: string) => void;
  editingGig?: BusinessPostedGig | null;
}

function getDefaultEventDateIst(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(Date.now() + 3 * 86400000));
}

function getDefaultDeadlineLocal(): string {
  const deadlineDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(Date.now() + 2 * 86400000));
  return `${deadlineDate}T18:00`;
}

export default function GigFormModal({
  isOpen,
  onClose,
  onSuccess,
  editingGig,
}: GigFormModalProps) {
  const isEdit = Boolean(editingGig);
  const todayIst = getTodayIstDateStr();
  const maxDateIst = getMaxEventIstDateStr();

  const [title, setTitle] = useState(editingGig?.title ?? "");
  const [artistCategory, setArtistCategory] = useState<string>(
    editingGig?.artist_category ?? GIG_ARTIST_CATEGORIES[0]
  );
  const [eventDate, setEventDate] = useState(
    editingGig?.event_date ?? getDefaultEventDateIst()
  );
  const [eventStartTime, setEventStartTime] = useState(
    editingGig ? editingGig.event_start_time.slice(0, 5) : "20:00"
  );
  const [eventEndTime, setEventEndTime] = useState(
    editingGig?.event_end_time ? editingGig.event_end_time.slice(0, 5) : editingGig ? "" : "23:00"
  );
  const [city, setCity] = useState(editingGig?.city ?? "");
  const [venueLocation, setVenueLocation] = useState(editingGig?.venue_location ?? "");
  const [description, setDescription] = useState(editingGig?.description ?? "");
  const [requirements, setRequirements] = useState(editingGig?.requirements ?? "");
  const [compensationType, setCompensationType] = useState<CompensationType>(
    editingGig?.compensation_type ?? "fixed"
  );
  const [budgetMin, setBudgetMin] = useState(
    editingGig && editingGig.budget_min !== null ? String(editingGig.budget_min) : ""
  );
  const [budgetMax, setBudgetMax] = useState(
    editingGig && editingGig.budget_max !== null ? String(editingGig.budget_max) : ""
  );
  const [applicationDeadline, setApplicationDeadline] = useState(
    editingGig ? isoToIstLocalInput(editingGig.application_deadline) : getDefaultDeadlineLocal()
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const rawPayload = {
      title,
      artistCategory,
      description,
      requirements: requirements.trim() || null,
      eventDate,
      eventStartTime,
      eventEndTime: eventEndTime.trim() || null,
      city,
      venueLocation,
      compensationType,
      budgetMin: budgetMin.trim() === "" ? null : Number(budgetMin),
      budgetMax:
        compensationType === "fixed"
          ? budgetMin.trim() === ""
            ? null
            : Number(budgetMin)
          : budgetMax.trim() === ""
          ? null
          : Number(budgetMax),
      applicationDeadline: istLocalInputToIso(applicationDeadline),
    };

    if (editingGig) {
      const editPayload = { ...rawPayload, gigId: editingGig.id };
      const parsed = updateGigSchema.safeParse(editPayload);
      if (!parsed.success) {
        const grouped: Record<string, string[]> = {};
        for (const issue of parsed.error.issues) {
          const key = issue.path.join(".") || "form";
          grouped[key] = [...(grouped[key] || []), issue.message];
        }
        setFieldErrors(grouped);
        setFormError("Please review the highlighted fields below.");
        return;
      }

      setIsSubmitting(true);
      const res = await updateBusinessGigAction(parsed.data);
      setIsSubmitting(false);

      if (!res.success || !res.data) {
        if (res.validationErrors) setFieldErrors(res.validationErrors);
        setFormError(res.error || "Unable to update gig.");
        return;
      }

      onSuccess(
        res.data,
        "edit",
        res.message || "Gig details updated successfully."
      );
      return;
    }

    const parsed = createGigSchema.safeParse(rawPayload);
    if (!parsed.success) {
      const grouped: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".") || "form";
        grouped[key] = [...(grouped[key] || []), issue.message];
      }
      setFieldErrors(grouped);
      setFormError("Please review the highlighted fields below.");
      return;
    }

    setIsSubmitting(true);
    const res = await createBusinessGigAction(parsed.data);
    setIsSubmitting(false);

    if (!res.success || !res.data) {
      if (res.validationErrors) setFieldErrors(res.validationErrors);
      setFormError(res.error || "Unable to publish gig.");
      return;
    }

    onSuccess(
      res.data,
      "create",
      res.message || "Gig published live! Registered Artists can now view and apply."
    );
  }

  const errMsg = (field: string) => fieldErrors[field]?.[0] || null;
  const hasCustomCategory =
    artistCategory && !GIG_ARTIST_CATEGORIES.includes(artistCategory as (typeof GIG_ARTIST_CATEGORIES)[number]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gig-form-modal-title"
    >
      <div className="bg-white rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl border border-gray-200 my-auto max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 id="gig-form-modal-title" className="text-xl font-extrabold text-gray-900">
              {isEdit ? "Edit Business Gig" : "Post a Live Gig Opportunity"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isEdit
                ? "Updates take effect immediately for Artists browsing Opportunities."
                : "Published immediately to Opportunities → Business Gigs (Artist-only directory). No Admin wait queue."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="text-gray-400 hover:text-gray-700 text-xl font-bold px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {formError && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Gig Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              required
              placeholder="e.g., Saturday Night Acoustic Trio for Rooftop Lounge"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900"
            />
            {errMsg("title") && <p className="mt-1 text-[11px] text-red-600">{errMsg("title")}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Artist Category <span className="text-red-500">*</span>
              </label>
              <select
                value={artistCategory}
                onChange={(e) => setArtistCategory(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white text-gray-900"
              >
                {hasCustomCategory && (
                  <option value={artistCategory}>{artistCategory}</option>
                )}
                {GIG_ARTIST_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errMsg("artistCategory") && (
                <p className="mt-1 text-[11px] text-red-600">{errMsg("artistCategory")}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                maxLength={100}
                required
                placeholder="e.g., Bengaluru, Mumbai, Delhi NCR"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900"
              />
              {errMsg("city") && <p className="mt-1 text-[11px] text-red-600">{errMsg("city")}</p>}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Venue / Locality <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={venueLocation}
              onChange={(e) => setVenueLocation(e.target.value)}
              maxLength={200}
              required
              placeholder="e.g., Indiranagar 100ft Road Rooftop Deck"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900"
            />
            {errMsg("venueLocation") && (
              <p className="mt-1 text-[11px] text-red-600">{errMsg("venueLocation")}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Event Date (IST) <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={eventDate}
                min={todayIst}
                max={maxDateIst}
                onChange={(e) => setEventDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900"
              />
              {errMsg("eventDate") && (
                <p className="mt-1 text-[11px] text-red-600">{errMsg("eventDate")}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={eventStartTime}
                onChange={(e) => setEventStartTime(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900"
              />
              {errMsg("eventStartTime") && (
                <p className="mt-1 text-[11px] text-red-600">{errMsg("eventStartTime")}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                End Time <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="time"
                value={eventEndTime}
                onChange={(e) => setEventEndTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900"
              />
              {errMsg("eventEndTime") && (
                <p className="mt-1 text-[11px] text-red-600">{errMsg("eventEndTime")}</p>
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <label className="block font-semibold text-gray-800">
              Budget / Compensation (INR ₹) <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "fixed", label: "Fixed Budget" },
                  { id: "range", label: "Budget Range" },
                  { id: "negotiable", label: "Negotiable" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCompensationType(opt.id)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    compensationType === opt.id
                      ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                      : "bg-white text-gray-700 border-gray-200 hover:border-purple-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {compensationType === "fixed" && (
              <div>
                <label className="block font-medium text-gray-600 mb-1">
                  Fixed Compensation (₹ INR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  step="1"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  required
                  placeholder="e.g., 18000"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900"
                />
                {errMsg("budgetMin") && (
                  <p className="mt-1 text-[11px] text-red-600">{errMsg("budgetMin")}</p>
                )}
              </div>
            )}

            {compensationType === "range" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-600 mb-1">
                    Minimum (₹ INR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    step="1"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    required
                    placeholder="e.g., 15000"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900"
                  />
                  {errMsg("budgetMin") && (
                    <p className="mt-1 text-[11px] text-red-600">{errMsg("budgetMin")}</p>
                  )}
                </div>
                <div>
                  <label className="block font-medium text-gray-600 mb-1">
                    Maximum (₹ INR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    step="1"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    required
                    placeholder="e.g., 28000"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900"
                  />
                  {errMsg("budgetMax") && (
                    <p className="mt-1 text-[11px] text-red-600">{errMsg("budgetMax")}</p>
                  )}
                </div>
              </div>
            )}

            {compensationType === "negotiable" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-600 mb-1">
                    Indicative Min ₹ <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="1"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-600 mb-1">
                    Indicative Max ₹ <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="1"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900"
                  />
                  {errMsg("budgetMax") && (
                    <p className="mt-1 text-[11px] text-red-600">{errMsg("budgetMax")}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Application Deadline (IST) <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={applicationDeadline}
              onChange={(e) => setApplicationDeadline(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Must be in the future and on or before the event date (Asia/Kolkata time).
            </p>
            {errMsg("applicationDeadline") && (
              <p className="mt-1 text-[11px] text-red-600">{errMsg("applicationDeadline")}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-gray-700">
                Gig Description <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-gray-400">{description.length}/3000</span>
            </div>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              minLength={20}
              maxLength={3000}
              required
              placeholder="Describe the vibe, audience, performance duration, set expectations, and venue atmosphere..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900 resize-y"
            />
            {errMsg("description") && (
              <p className="mt-1 text-[11px] text-red-600">{errMsg("description")}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-gray-700">
                Requirements & Logistics <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <span className="text-[11px] text-gray-400">{requirements.length}/2000</span>
            </div>
            <textarea
              rows={2}
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              maxLength={2000}
              placeholder="PA/sound system provided, soundcheck timings, dress code, gear needed..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900 resize-y"
            />
            {errMsg("requirements") && (
              <p className="mt-1 text-[11px] text-red-600">{errMsg("requirements")}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              {isSubmitting
                ? isEdit
                  ? "Saving Changes…"
                  : "Publishing Gig…"
                : isEdit
                ? "Save Changes"
                : "Publish Gig Immediately"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
