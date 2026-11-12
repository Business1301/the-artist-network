"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArtistCalendarEvent, CalendarEventType } from "@/lib/calendar/types";
import {
  getTodayIstDateStr,
  getMonthDateRange,
  getWeekDateRange,
} from "@/lib/calendar/utils";
import {
  getArtistCalendarEventsAction,
  deleteCalendarEventAction,
} from "@/app/actions/calendar";
import MonthView from "@/app/components/calendar/MonthView";
import WeekView from "@/app/components/calendar/WeekView";
import EventDetailsModal from "@/app/components/calendar/EventDetailsModal";
import EventFormModal from "@/app/components/calendar/EventFormModal";
import DeleteConfirmModal from "@/app/components/calendar/DeleteConfirmModal";

type ViewMode = "month" | "week";

function getMonthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function getWeekLabel(anchorStr: string): string {
  const [y, m, d] = anchorStr.split("-").map(Number);
  const anchor = new Date(Date.UTC(y, m - 1, d));
  const dow = anchor.getUTCDay();
  const diff = (dow + 6) % 7;
  const mon = new Date(anchor.getTime() - diff * 86400000);
  const sun = new Date(mon.getTime() + 6 * 86400000);
  const fmt = (date: Date) =>
    date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      timeZone: "Asia/Kolkata",
    });
  return `${fmt(mon)} – ${fmt(sun)} ${sun.getUTCFullYear()}`;
}

function addMonths(year: number, month: number, delta: number) {
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

function addWeekDays(anchorStr: string, weeks: number): string {
  const [y, m, d] = anchorStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + weeks * 7));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export default function ArtistCalendarPage() {
  const todayStr = getTodayIstDateStr();
  const todayParts = todayStr.split("-").map(Number);

  // Navigation state
  const [view, setView] = useState<ViewMode>("month");
  const [currentYear, setCurrentYear] = useState(todayParts[0]);
  const [currentMonth, setCurrentMonth] = useState(todayParts[1]);
  const [anchorDateStr, setAnchorDateStr] = useState(todayStr);
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);

  // Events state
  const [events, setEvents] = useState<ArtistCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // Modal state
  const [detailsEvent, setDetailsEvent] = useState<ArtistCalendarEvent | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formEventType, setFormEventType] = useState<CalendarEventType>("gig_booking");
  const [formDefaultDate, setFormDefaultDate] = useState<string | undefined>();
  const [formInitialData, setFormInitialData] = useState<ArtistCalendarEvent | undefined>();

  const [deleteTarget, setDeleteTarget] = useState<ArtistCalendarEvent | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Manual refresh trigger: increment to force a reload
  const [refreshTick, setRefreshTick] = useState(0);

  // Stale-fetch guard
  const fetchIdRef = useRef(0);

  // Load events — uses local async function inside effect (project-standard pattern)
  useEffect(() => {
    const myFetchId = ++fetchIdRef.current;

    async function fetchEvents() {
      setIsLoading(true);
      setEventsError(null);

      let range: { start_date: string; end_date: string };
      if (view === "month") {
        const { startIso, endIso } = getMonthDateRange(currentYear, currentMonth);
        range = { start_date: startIso, end_date: endIso };
      } else {
        const { startIso, endIso } = getWeekDateRange(anchorDateStr);
        range = { start_date: startIso, end_date: endIso };
      }

      const result = await getArtistCalendarEventsAction(range);
      if (myFetchId !== fetchIdRef.current) return; // discard stale response

      setIsLoading(false);
      if (result.success) {
        setEvents(result.data);
      } else {
        setEventsError(result.error || "Failed to load calendar events.");
        setEvents([]);
      }
    }

    fetchEvents();
  }, [view, currentYear, currentMonth, anchorDateStr, refreshTick]);

  // Auto-dismiss success notice
  useEffect(() => {
    if (successNotice) {
      const t = setTimeout(() => setSuccessNotice(null), 3500);
      return () => clearTimeout(t);
    }
  }, [successNotice]);

  function triggerRefresh() {
    setRefreshTick((n) => n + 1);
  }

  // Navigation handlers
  function goToToday() {
    const today = getTodayIstDateStr();
    const [y, m] = today.split("-").map(Number);
    setCurrentYear(y);
    setCurrentMonth(m);
    setAnchorDateStr(today);
    setSelectedDateStr(today);
  }

  function goBack() {
    if (view === "month") {
      const { year, month } = addMonths(currentYear, currentMonth, -1);
      setCurrentYear(year);
      setCurrentMonth(month);
    } else {
      setAnchorDateStr((prev) => addWeekDays(prev, -1));
    }
  }

  function goForward() {
    if (view === "month") {
      const { year, month } = addMonths(currentYear, currentMonth, 1);
      setCurrentYear(year);
      setCurrentMonth(month);
    } else {
      setAnchorDateStr((prev) => addWeekDays(prev, 1));
    }
  }

  // Form openers
  function openAddGig(dateStr?: string) {
    setFormMode("create");
    setFormEventType("gig_booking");
    setFormDefaultDate(dateStr);
    setFormInitialData(undefined);
    setShowDetails(false);
    setShowForm(true);
  }

  function openAddBlock(dateStr?: string) {
    setFormMode("create");
    setFormEventType("unavailable_block");
    setFormDefaultDate(dateStr);
    setFormInitialData(undefined);
    setShowDetails(false);
    setShowForm(true);
  }

  function openEdit(event: ArtistCalendarEvent) {
    setFormMode("edit");
    setFormEventType(event.event_type);
    setFormInitialData(event);
    setFormDefaultDate(undefined);
    setShowDetails(false);
    setShowForm(true);
  }

  function openDelete(event: ArtistCalendarEvent) {
    setDeleteTarget(event);
    setShowDetails(false);
    setShowDelete(true);
  }

  function openDetails(event: ArtistCalendarEvent) {
    setDetailsEvent(event);
    setShowDetails(true);
  }

  async function handleDelete() {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    const result = await deleteCalendarEventAction(deleteTarget.id);
    setIsDeleting(false);
    setShowDelete(false);
    setDeleteTarget(null);

    if (result.success) {
      setSuccessNotice("Event deleted.");
      triggerRefresh();
    } else {
      setEventsError(result.error || "Failed to delete event.");
    }
  }

  function handleSaved() {
    setSuccessNotice("Calendar updated successfully.");
    triggerRefresh();
  }

  function handleDateSelect(dateStr: string) {
    setSelectedDateStr(dateStr);
    setAnchorDateStr(dateStr);
  }

  const rangeLabel =
    view === "month"
      ? getMonthLabel(currentYear, currentMonth)
      : getWeekLabel(anchorDateStr);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {/* Back link */}
        <Link
          href="/dashboard/artist"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-purple-700 transition-colors"
        >
          ← Artist Dashboard
        </Link>

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              My Calendar &amp; Availability
            </h1>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
              <span className="font-semibold text-purple-600">IST</span>
              All times in Asia/Kolkata (UTC+05:30) · Private to you
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => openAddGig()}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-xs transition-colors flex items-center gap-1.5"
            >
              🎵 Add Gig
            </button>
            <button
              type="button"
              onClick={() => openAddBlock()}
              className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 shadow-xs transition-colors flex items-center gap-1.5"
            >
              ⛔ Block Dates
            </button>
          </div>
        </div>

        {/* Controls: view switcher + navigation */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Month / Week toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-0.5 self-start">
            <button
              type="button"
              onClick={() => setView("month")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                view === "month"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setView("week")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                view === "week"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Week
            </button>
          </div>

          {/* Prev / Today / Next + range label */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={goBack}
              className="w-8 h-8 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm flex items-center justify-center transition-colors"
              aria-label="Previous"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={goForward}
              className="w-8 h-8 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm flex items-center justify-center transition-colors"
              aria-label="Next"
            >
              ›
            </button>
            <span className="text-sm font-extrabold text-gray-900 min-w-[160px] sm:text-right">
              {rangeLabel}
            </span>
          </div>
        </div>

        {/* Success notice */}
        {successNotice && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in duration-200">
            <span>✅</span> {successNotice}
          </div>
        )}

        {/* Error banner */}
        {eventsError && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs text-rose-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{eventsError}</span>
            </div>
            <button
              type="button"
              onClick={triggerRefresh}
              className="px-3 py-1 rounded-xl text-[11px] font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold text-gray-600">
          <span className="text-gray-400 font-bold uppercase tracking-wider">Legend:</span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" /> Confirmed Gig
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Tentative
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Completed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" /> Cancelled
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Blocked
          </span>
        </div>

        {/* Calendar body */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
          {view === "month" ? (
            <MonthView
              year={currentYear}
              month={currentMonth}
              events={events}
              selectedDateStr={selectedDateStr}
              isLoading={isLoading}
              onDateSelect={handleDateSelect}
              onEventClick={openDetails}
              onAddEvent={openAddGig}
            />
          ) : (
            <WeekView
              anchorDateStr={anchorDateStr}
              events={events}
              isLoading={isLoading}
              onEventClick={openDetails}
              onAddEvent={(dateStr) => {
                setAnchorDateStr(dateStr);
                openAddGig(dateStr);
              }}
            />
          )}
        </div>

        {/* Empty state */}
        {!isLoading && !eventsError && events.length === 0 && (
          <div className="text-center py-10 space-y-3">
            <div className="text-4xl">📅</div>
            <p className="text-sm font-bold text-gray-700">No events this period</p>
            <p className="text-xs text-gray-400">
              Add an external gig or block dates to get started.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => openAddGig()}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors"
              >
                🎵 Add Gig
              </button>
              <button
                type="button"
                onClick={() => openAddBlock()}
                className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
              >
                ⛔ Block Dates
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <EventDetailsModal
        isOpen={showDetails}
        event={detailsEvent}
        onClose={() => setShowDetails(false)}
        onEdit={openEdit}
        onDelete={openDelete}
      />

      <EventFormModal
        isOpen={showForm}
        mode={formMode}
        eventType={formEventType}
        initialData={formInitialData}
        defaultDate={formDefaultDate}
        onClose={() => setShowForm(false)}
        onSaved={handleSaved}
      />

      <DeleteConfirmModal
        isOpen={showDelete}
        event={deleteTarget}
        isDeleting={isDeleting}
        onClose={() => {
          setShowDelete(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
