"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArtistCalendarEvent,
  CalendarEventType,
  CalendarBookingStatus,
  ConflictingEvent,
} from "@/lib/calendar/types";
import {
  istToUtcIso,
  utcIsoToIstDateStr,
  utcIsoToIstTimeStr,
  getTodayIstDateStr,
  getTomorrowIstDateStr,
  getDefaultFutureIstTimings,
} from "@/lib/calendar/utils";
import {
  createManualGigAction,
  createUnavailableBlockAction,
  updateCalendarEventAction,
} from "@/app/actions/calendar";
import ConflictModal from "./ConflictModal";

interface EventFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  eventType: CalendarEventType;
  initialData?: ArtistCalendarEvent;
  defaultDate?: string; // "YYYY-MM-DD" in IST
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  title: string;
  event_type: CalendarEventType;
  status: CalendarBookingStatus;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  is_all_day: boolean;
  city: string;
  venue_name: string;
  venue_address: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  agreed_fee: string;
  deposit_paid: string;
  private_notes: string;
}

function buildInitialForm(
  mode: "create" | "edit",
  eventType: CalendarEventType,
  initialData?: ArtistCalendarEvent,
  defaultDate?: string
): FormState {
  if (mode === "edit" && initialData) {
    return {
      title: initialData.title,
      event_type: initialData.event_type,
      status: initialData.status,
      start_date: utcIsoToIstDateStr(initialData.start_time),
      start_time: initialData.is_all_day
        ? "00:00"
        : utcIsoToIstTimeStr(initialData.start_time),
      end_date: utcIsoToIstDateStr(initialData.end_time),
      end_time: initialData.is_all_day
        ? "23:59"
        : utcIsoToIstTimeStr(initialData.end_time),
      is_all_day: initialData.is_all_day,
      city: initialData.city ?? "",
      venue_name: initialData.venue_name ?? "",
      venue_address: initialData.venue_address ?? "",
      client_name: initialData.client_name ?? "",
      client_phone: initialData.client_phone ?? "",
      client_email: initialData.client_email ?? "",
      agreed_fee:
        initialData.agreed_fee != null
          ? String(initialData.agreed_fee)
          : "",
      deposit_paid:
        initialData.deposit_paid != null
          ? String(initialData.deposit_paid)
          : "",
      private_notes: initialData.private_notes ?? "",
    };
  }

  const timings = getDefaultFutureIstTimings(defaultDate);
  const isBlock = eventType === "unavailable_block";
  const defaultIsAllDay = isBlock;
  const tomorrow = getTomorrowIstDateStr();

  // All-day bookings must start tomorrow or later (today's midnight has passed)
  const startDate = defaultIsAllDay
    ? (timings.startDate <= getTodayIstDateStr() ? tomorrow : timings.startDate)
    : timings.startDate;
  const endDate = defaultIsAllDay
    ? (timings.endDate < startDate ? startDate : timings.endDate)
    : timings.endDate;

  return {
    title: "",
    event_type: eventType,
    status: "confirmed",
    start_date: startDate,
    start_time: timings.startTime,
    end_date: endDate,
    end_time: timings.endTime,
    is_all_day: defaultIsAllDay,
    city: "",
    venue_name: "",
    venue_address: "",
    client_name: "",
    client_phone: "",
    client_email: "",
    agreed_fee: "",
    deposit_paid: "",
    private_notes: "",
  };
}

function FieldError({ errors, field }: { errors: Record<string, string[]>; field: string }) {
  const msgs = errors[field];
  if (!msgs?.length) return null;
  return (
    <p className="text-[11px] text-rose-600 mt-1 font-medium">
      {msgs[0]}
    </p>
  );
}

export default function EventFormModal({
  isOpen,
  mode,
  eventType,
  initialData,
  defaultDate,
  onClose,
  onSaved,
}: EventFormModalProps) {
  const [form, setForm] = useState<FormState>(() =>
    buildInitialForm(mode, eventType, initialData, defaultDate)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPastBooking, setIsPastBooking] = useState(false);
  const [conflictPending, setConflictPending] = useState<{
    conflicts: ConflictingEvent[];
    payload: unknown;
  } | null>(null);
  const [isConflictSaving, setIsConflictSaving] = useState(false);

  const wasOpenRef = useRef(false);

  // Helper to determine if a form state represents a past booking
  const evaluateIsPast = useCallback(
    (currentForm: FormState): boolean => {
      const startIso = currentForm.is_all_day
        ? istToUtcIso(currentForm.start_date, "00:00")
        : istToUtcIso(currentForm.start_date, currentForm.start_time || "00:00");

      const isModified =
        mode !== "edit" || !initialData
          ? true
          : new Date(startIso).getTime() !==
            new Date(initialData.start_time).getTime();

      return isModified && new Date(startIso).getTime() <= Date.now();
    },
    [mode, initialData]
  );

  // Reset form when modal opens (tracks open→closed→open transitions via ref)
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      wasOpenRef.current = true;
      const initial = buildInitialForm(mode, eventType, initialData, defaultDate);
      setForm(initial);
      setIsPastBooking(evaluateIsPast(initial));
      setIsSaving(false);
      setGlobalError(null);
      setFieldErrors({});
      setConflictPending(null);
      setIsConflictSaving(false);
    } else if (!isOpen) {
      wasOpenRef.current = false;
    }
  }, [isOpen, mode, eventType, initialData, defaultDate, evaluateIsPast]);

  // Escape key listener (when not saving or displaying a conflict)
  useEffect(() => {
    if (!isOpen || isSaving || conflictPending !== null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSaving, conflictPending, onClose]);

  const setField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        setIsPastBooking(evaluateIsPast(next));
        return next;
      });
      // Clear field error on change
      if (fieldErrors[key]) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [fieldErrors, evaluateIsPast]
  );

  const isBlocked = form.event_type === "unavailable_block";
  const isEdit = mode === "edit";

  const todayStr = getTodayIstDateStr();
  const tomorrowStr = getTomorrowIstDateStr();

  const pastErrorMessage = form.is_all_day
    ? "All-day bookings must be scheduled for future dates (tomorrow or later). Today's midnight has already passed."
    : "Bookings must start in the future. Please select a later date or time.";

  function toggleAllDay() {
    const nextAllDay = !form.is_all_day;
    setForm((prev) => {
      let nextStartDate = prev.start_date;
      let nextEndDate = prev.end_date;

      // If switching to all-day on a new booking, start_date must be tomorrow or later
      if (nextAllDay && !isEdit && nextStartDate <= todayStr) {
        nextStartDate = tomorrowStr;
        if (nextEndDate < tomorrowStr) {
          nextEndDate = tomorrowStr;
        }
      }

      const next = {
        ...prev,
        is_all_day: nextAllDay,
        start_date: nextStartDate,
        end_date: nextEndDate,
      };
      setIsPastBooking(evaluateIsPast(next));
      return next;
    });
  }

  if (!isOpen) return null;

  function buildPayload(allowOverlap: boolean) {
    // All times interpreted as IST
    const startIso = form.is_all_day
      ? istToUtcIso(form.start_date, "00:00")
      : istToUtcIso(form.start_date, form.start_time);

    // For all-day events, end is exclusive: start of next day
    let endIso: string;
    if (form.is_all_day) {
      // end_date is the LAST day inclusive → store as start of next day
      const [ey, em, ed] = form.end_date.split("-").map(Number);
      const nextDay = new Date(Date.UTC(ey, em - 1, ed + 1));
      const nextDateStr = `${nextDay.getUTCFullYear()}-${String(nextDay.getUTCMonth() + 1).padStart(2, "0")}-${String(nextDay.getUTCDate()).padStart(2, "0")}`;
      endIso = istToUtcIso(nextDateStr, "00:00");
    } else {
      endIso = istToUtcIso(form.end_date, form.end_time);
    }

    const base = {
      title: form.title.trim(),
      event_type: form.event_type,
      status: form.status,
      start_time: startIso,
      end_time: endIso,
      is_all_day: form.is_all_day,
      city: form.city.trim() || null,
      venue_name: form.venue_name.trim() || null,
      venue_address: form.venue_address.trim() || null,
      client_name: isBlocked ? null : form.client_name.trim() || null,
      client_phone: isBlocked ? null : form.client_phone.trim() || null,
      client_email: isBlocked ? null : form.client_email.trim() || null,
      agreed_fee:
        !isBlocked && form.agreed_fee !== ""
          ? parseFloat(form.agreed_fee)
          : null,
      deposit_paid:
        !isBlocked && form.deposit_paid !== ""
          ? parseFloat(form.deposit_paid)
          : null,
      private_notes: form.private_notes.trim() || null,
      allow_overlap: allowOverlap,
    };

    if (isEdit && initialData) {
      return { ...base, event_id: initialData.id };
    }
    return base;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSaving) return;
    setGlobalError(null);
    setFieldErrors({});

    // Immediate client-side revalidation at exact moment of submit
    const submitStartIso = form.is_all_day
      ? istToUtcIso(form.start_date, "00:00")
      : istToUtcIso(form.start_date, form.start_time);

    const isStartTimeChangedAtSubmit =
      !isEdit || !initialData
        ? true
        : new Date(submitStartIso).getTime() !==
          new Date(initialData.start_time).getTime();

    if (
      isStartTimeChangedAtSubmit &&
      new Date(submitStartIso).getTime() <= Date.now()
    ) {
      const msg = form.is_all_day
        ? "All-day bookings must be scheduled for future dates (tomorrow or later). Today's midnight has already passed."
        : "Bookings must start in the future. Please select a later date or time.";
      setGlobalError(msg);
      setFieldErrors({ start_time: [msg] });
      return;
    }

    setIsSaving(true);

    const payload = buildPayload(false);
    let result;

    if (isEdit) {
      result = await updateCalendarEventAction(payload);
    } else if (isBlocked) {
      result = await createUnavailableBlockAction(payload);
    } else {
      result = await createManualGigAction(payload);
    }

    setIsSaving(false);

    if (result.success) {
      onSaved();
      onClose();
      return;
    }

    if (!result.success && result.conflict === true) {
      setConflictPending({ conflicts: result.conflicts, payload });
      return;
    }

    if (!result.success && result.conflict !== true) {
      setGlobalError(result.error || "Failed to save event.");
      if (result.validationErrors) {
        setFieldErrors(result.validationErrors);
      }
    }
  }

  async function handleSaveAnyway() {
    if (!conflictPending || isConflictSaving) return;
    setIsConflictSaving(true);
    const payload = buildPayload(true);
    let result;

    if (isEdit) {
      result = await updateCalendarEventAction(payload);
    } else if (isBlocked) {
      result = await createUnavailableBlockAction(payload);
    } else {
      result = await createManualGigAction(payload);
    }

    setIsConflictSaving(false);

    if (result.success) {
      setConflictPending(null);
      onSaved();
      onClose();
      return;
    }

    setConflictPending(null);
    if (!result.success) {
      setGlobalError(result.error || "Failed to save event despite overlap.");
    }
  }

  const inputCls =
    "w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-colors bg-white";
  const labelCls = "text-[11px] font-bold text-gray-700 uppercase tracking-wider";

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={onClose}
      >
        <div
          className="bg-white w-full max-w-xl rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div>
              <h2 className="text-base font-extrabold text-gray-900">
                {isEdit
                  ? "Edit Calendar Event"
                  : isBlocked
                  ? "Block Dates / Mark Unavailable"
                  : "Add External Gig"}
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {isBlocked
                  ? "Block time you're unavailable for new bookings."
                  : "Record a manual booking outside The Artist Network."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="overflow-y-auto">
            <div className="p-5 space-y-5">
              {/* Global Error */}
              {globalError && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-800 flex items-start gap-2">
                  <span className="shrink-0">⚠️</span>
                  <span>{globalError}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className={labelCls}>
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder={
                    isBlocked ? "e.g. Unavailable — Family Wedding" : "e.g. Live Set at Blue Bar"
                  }
                  maxLength={120}
                  required
                  className={`${inputCls} mt-1`}
                />
                <FieldError errors={fieldErrors} field="title" />
              </div>

              {/* Status (not for unavailable_block which is always confirmed) */}
              {!isBlocked && (
                <div>
                  <label className={labelCls}>Booking Status</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setField("status", e.target.value as CalendarBookingStatus)
                    }
                    className={`${inputCls} mt-1`}
                  >
                    <option value="tentative">Tentative (Unconfirmed)</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <FieldError errors={fieldErrors} field="status" />
                </div>
              )}

              {/* All Day Toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.is_all_day}
                  onClick={toggleAllDay}
                  className={`relative w-9 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                    form.is_all_day ? "bg-purple-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                      form.is_all_day ? "left-4" : "left-0.5"
                    }`}
                  />
                </button>
                <span className="text-xs font-semibold text-gray-700">All-day event</span>
              </div>

              {/* Date / Time Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.start_date}
                    min={!isEdit ? (form.is_all_day ? tomorrowStr : todayStr) : undefined}
                    onChange={(e) => setField("start_date", e.target.value)}
                    required
                    className={`${inputCls} mt-1`}
                  />
                  <FieldError errors={fieldErrors} field="start_time" />
                </div>
                <div>
                  <label className={labelCls}>
                    {form.is_all_day ? "Last Day" : "End Date"}{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.end_date}
                    min={form.start_date}
                    onChange={(e) => setField("end_date", e.target.value)}
                    required
                    className={`${inputCls} mt-1`}
                  />
                  <FieldError errors={fieldErrors} field="end_time" />
                </div>
              </div>

              {!form.is_all_day && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Start Time (IST)</label>
                    <input
                      type="time"
                      value={form.start_time}
                      onChange={(e) => setField("start_time", e.target.value)}
                      className={`${inputCls} mt-1`}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>End Time (IST)</label>
                    <input
                      type="time"
                      value={form.end_time}
                      onChange={(e) => setField("end_time", e.target.value)}
                      className={`${inputCls} mt-1`}
                    />
                  </div>
                </div>
              )}

              {/* Inline warning when selected time is in the past */}
              {isPastBooking && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 flex items-start gap-2 animate-in fade-in duration-150">
                  <span className="shrink-0 text-sm">⚠️</span>
                  <span className="font-medium">{pastErrorMessage}</span>
                </div>
              )}

              {/* Location — only for gigs */}
              {!isBlocked && (
                <div className="space-y-3 border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    📍 Venue &amp; Location (Optional)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>City</label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => setField("city", e.target.value)}
                        placeholder="Mumbai"
                        maxLength={100}
                        className={`${inputCls} mt-1`}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Venue Name</label>
                      <input
                        type="text"
                        value={form.venue_name}
                        onChange={(e) => setField("venue_name", e.target.value)}
                        placeholder="The Blue Bar"
                        maxLength={150}
                        className={`${inputCls} mt-1`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Venue Address</label>
                    <input
                      type="text"
                      value={form.venue_address}
                      onChange={(e) => setField("venue_address", e.target.value)}
                      placeholder="123 MG Road, Bandra West"
                      maxLength={300}
                      className={`${inputCls} mt-1`}
                    />
                  </div>
                </div>
              )}

              {/* Private Client Info — only for gigs */}
              {!isBlocked && (
                <div className="space-y-3 border border-blue-100 rounded-xl p-4 bg-blue-50/20">
                  <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                    👤 Private Client Contact (Confidential)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Client Name</label>
                      <input
                        type="text"
                        value={form.client_name}
                        onChange={(e) => setField("client_name", e.target.value)}
                        placeholder="Venue Manager"
                        maxLength={120}
                        className={`${inputCls} mt-1`}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Client Phone</label>
                      <input
                        type="tel"
                        value={form.client_phone}
                        onChange={(e) => setField("client_phone", e.target.value)}
                        placeholder="+91 98765 43210"
                        maxLength={30}
                        className={`${inputCls} mt-1`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Client Email</label>
                    <input
                      type="email"
                      value={form.client_email}
                      onChange={(e) => setField("client_email", e.target.value)}
                      placeholder="contact@venue.com"
                      maxLength={120}
                      className={`${inputCls} mt-1`}
                    />
                    <FieldError errors={fieldErrors} field="client_email" />
                  </div>
                </div>
              )}

              {/* Private Financials — only for gigs */}
              {!isBlocked && (
                <div className="space-y-3 border border-emerald-100 rounded-xl p-4 bg-emerald-50/20">
                  <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                    💰 Private Financials (Confidential — in ₹)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Agreed Fee (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={form.agreed_fee}
                        onChange={(e) => setField("agreed_fee", e.target.value)}
                        placeholder="15000"
                        className={`${inputCls} mt-1`}
                      />
                      <FieldError errors={fieldErrors} field="agreed_fee" />
                    </div>
                    <div>
                      <label className={labelCls}>Deposit Received (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={form.deposit_paid}
                        onChange={(e) => setField("deposit_paid", e.target.value)}
                        placeholder="5000"
                        className={`${inputCls} mt-1`}
                      />
                      <FieldError errors={fieldErrors} field="deposit_paid" />
                    </div>
                  </div>
                </div>
              )}

              {/* Private Notes */}
              <div>
                <label className={labelCls}>Private Notes (Confidential)</label>
                <textarea
                  value={form.private_notes}
                  onChange={(e) => setField("private_notes", e.target.value)}
                  placeholder="Arrival time, sound check, set list, special requirements..."
                  rows={3}
                  maxLength={2000}
                  className={`${inputCls} mt-1 resize-none`}
                />
              </div>

              <p className="text-[10px] text-gray-400 flex items-center gap-1">
                🔒 All times are stored and displayed in Asia/Kolkata (IST). Private details are only visible to you.
              </p>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isPastBooking}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : isEdit ? (
                  "Save Changes"
                ) : (
                  "Add to Calendar"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Conflict Modal rendered as sibling overlay */}
      <ConflictModal
        isOpen={conflictPending !== null}
        conflicts={conflictPending?.conflicts ?? []}
        proposedTitle={form.title}
        isSaving={isConflictSaving}
        onClose={() => setConflictPending(null)}
        onSaveAnyway={handleSaveAnyway}
      />
    </>
  );
}
