"use client";

import { ArtistCalendarEvent } from "@/lib/calendar/types";
import {
  WeekGridDay,
  getDaysInWeekGrid,
  eventOccursOnIstDate,
  utcIsoToIstTimeStr,
  getTodayIstDateStr,
} from "@/lib/calendar/utils";
import EventBadge from "./EventBadge";

interface WeekViewProps {
  anchorDateStr: string; // Any YYYY-MM-DD in the week
  events: ArtistCalendarEvent[];
  isLoading: boolean;
  onEventClick: (event: ArtistCalendarEvent) => void;
  onAddEvent: (dateStr: string) => void;
}

// Compress time grid: show 07:00–23:00 (16 hours)
const GRID_START_HOUR = 7;
const GRID_END_HOUR = 23;
const GRID_HOURS = GRID_END_HOUR - GRID_START_HOUR;
const HOUR_HEIGHT_PX = 60; // px per hour
const GRID_HEIGHT_PX = GRID_HOURS * HOUR_HEIGHT_PX;

function timeToGridPercent(isoString: string): number {
  const [hStr, mStr] = utcIsoToIstTimeStr(isoString).split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const totalMins = (h - GRID_START_HOUR) * 60 + m;
  return Math.max(0, Math.min(100, (totalMins / (GRID_HOURS * 60)) * 100));
}

function durationToGridPercent(startIso: string, endIso: string): number {
  const [sh, sm] = utcIsoToIstTimeStr(startIso).split(":").map(Number);
  const [eh, em] = utcIsoToIstTimeStr(endIso).split(":").map(Number);
  const startMins = (sh - GRID_START_HOUR) * 60 + sm;
  const endMins = (eh - GRID_START_HOUR) * 60 + em;
  const duration = Math.max(30, endMins - startMins); // Min 30-min height
  return Math.min(100 - Math.max(0, (startMins / (GRID_HOURS * 60)) * 100), (duration / (GRID_HOURS * 60)) * 100);
}

function isAllDayOrMultiDay(ev: ArtistCalendarEvent): boolean {
  return ev.is_all_day;
}

export default function WeekView({
  anchorDateStr,
  events,
  isLoading,
  onEventClick,
  onAddEvent,
}: WeekViewProps) {
  const days: WeekGridDay[] = getDaysInWeekGrid(anchorDateStr);
  const todayStr = getTodayIstDateStr();

  // Separate all-day events from timed events
  const allDayEvents = events.filter(isAllDayOrMultiDay);
  const timedEvents = events.filter((e) => !isAllDayOrMultiDay(e));

  // Mobile: show selected day (anchorDateStr) only
  const mobileDay = days.find((d) => d.dateStr === anchorDateStr) ?? days[0];
  const mobileDayEvents = events.filter((e) =>
    eventOccursOnIstDate(e, mobileDay.dateStr)
  );

  return (
    <div className="relative">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 bg-white/60 flex items-center justify-center rounded-2xl">
          <span className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ── DESKTOP WEEK VIEW (sm+) ── */}
      <div className="hidden sm:block overflow-x-auto">
        {/* Day header row */}
        <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-gray-100">
          {/* Time gutter header */}
          <div className="py-2 text-center text-[9px] font-bold text-gray-400 uppercase">
            IST
          </div>
          {days.map((day) => (
            <div
              key={day.dateStr}
              className={`py-2 text-center border-l border-gray-100 ${
                day.isToday ? "bg-purple-50/60" : ""
              }`}
            >
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                {day.dayName}
              </p>
              <span
                className={`text-sm font-extrabold w-8 h-8 flex items-center justify-center rounded-full mx-auto mt-0.5 ${
                  day.isToday
                    ? "bg-purple-600 text-white"
                    : "text-gray-900"
                }`}
              >
                {day.dayNumber}
              </span>
            </div>
          ))}
        </div>

        {/* All-day events row */}
        <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-gray-100 min-h-[32px]">
          <div className="text-[9px] text-gray-400 font-bold flex items-center justify-center uppercase tracking-wider">
            All day
          </div>
          {days.map((day) => {
            const dayAllDay = allDayEvents.filter((e) =>
              eventOccursOnIstDate(e, day.dateStr)
            );
            return (
              <div
                key={day.dateStr}
                className={`border-l border-gray-100 p-0.5 space-y-0.5 ${
                  day.isToday ? "bg-purple-50/40" : ""
                }`}
              >
                {dayAllDay.map((ev) => (
                  <EventBadge
                    key={ev.id}
                    event={ev}
                    compact
                    onClick={() => onEventClick(ev)}
                  />
                ))}
              </div>
            );
          })}
        </div>

        {/* Timed grid */}
        <div
          className="grid grid-cols-[48px_repeat(7,1fr)] overflow-y-auto"
          style={{ maxHeight: `${GRID_HEIGHT_PX + 32}px` }}
        >
          {/* Time labels */}
          <div className="relative" style={{ height: `${GRID_HEIGHT_PX}px` }}>
            {Array.from({ length: GRID_HOURS }, (_, i) => (
              <div
                key={i}
                className="absolute right-1 text-[9px] font-bold text-gray-400 leading-none"
                style={{ top: `${i * HOUR_HEIGHT_PX - 6}px` }}
              >
                {String(GRID_START_HOUR + i).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dayTimed = timedEvents.filter((e) =>
              eventOccursOnIstDate(e, day.dateStr)
            );
            return (
              <div
                key={day.dateStr}
                className={`relative border-l border-gray-100 cursor-pointer ${
                  day.isToday ? "bg-purple-50/20" : "hover:bg-gray-50/60"
                }`}
                style={{ height: `${GRID_HEIGHT_PX}px` }}
                onClick={() => onAddEvent(day.dateStr)}
              >
                {/* Hour grid lines */}
                {Array.from({ length: GRID_HOURS }, (_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-t border-gray-100"
                    style={{ top: `${i * HOUR_HEIGHT_PX}px` }}
                  />
                ))}

                {/* Today line */}
                {day.dateStr === todayStr && (
                  <div
                    className="absolute left-0 right-0 border-t-2 border-purple-500 z-10"
                    style={{
                      top: `${timeToGridPercent(new Date().toISOString()) * GRID_HEIGHT_PX / 100}px`,
                    }}
                  />
                )}

                {/* Timed events */}
                {dayTimed.map((ev) => {
                  const topPct = timeToGridPercent(ev.start_time);
                  const heightPct = durationToGridPercent(ev.start_time, ev.end_time);
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(ev);
                      }}
                      className={`absolute inset-x-0.5 rounded-lg p-1 text-left overflow-hidden z-10 shadow-xs text-[10px] font-bold leading-tight ${
                        ev.event_type === "unavailable_block"
                          ? "bg-rose-100 border border-rose-300 text-rose-900"
                          : ev.status === "tentative"
                          ? "bg-amber-100 border border-amber-300 text-amber-900"
                          : ev.status === "completed"
                          ? "bg-emerald-100 border border-emerald-300 text-emerald-900"
                          : ev.status === "cancelled"
                          ? "bg-gray-100 border border-gray-300 text-gray-500 line-through"
                          : "bg-purple-100 border border-purple-300 text-purple-900"
                      }`}
                      style={{
                        top: `${(topPct / 100) * GRID_HEIGHT_PX}px`,
                        height: `${Math.max(24, (heightPct / 100) * GRID_HEIGHT_PX)}px`,
                      }}
                    >
                      <span className="truncate block">{ev.title}</span>
                      <span className="truncate block opacity-75 font-normal">
                        {utcIsoToIstTimeStr(ev.start_time)}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MOBILE WEEK VIEW ── */}
      <div className="sm:hidden">
        {/* Horizontal day selector */}
        <div className="flex overflow-x-auto gap-1 px-3 py-2 border-b border-gray-100 no-scrollbar">
          {days.map((day) => {
            const isAnchor = day.dateStr === anchorDateStr;
            const hasEvents = events.some((e) =>
              eventOccursOnIstDate(e, day.dateStr)
            );
            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => onAddEvent(day.dateStr)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl min-w-[44px] transition-colors ${
                  isAnchor
                    ? "bg-purple-600 text-white"
                    : day.isToday
                    ? "bg-purple-50 text-purple-700"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="text-[9px] font-bold uppercase">{day.dayName}</span>
                <span className="text-sm font-extrabold">{day.dayNumber}</span>
                {hasEvents && (
                  <span
                    className={`w-1 h-1 rounded-full ${
                      isAnchor ? "bg-white" : "bg-purple-500"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile day agenda */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-900">
              {new Date(mobileDay.dateStr + "T00:00:00").toLocaleDateString(
                "en-IN",
                { weekday: "long", day: "numeric", month: "long" }
              )}
            </h3>
            <button
              type="button"
              onClick={() => onAddEvent(mobileDay.dateStr)}
              className="px-3 py-1 rounded-xl text-[11px] font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            >
              + Add
            </button>
          </div>

          {mobileDayEvents.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">
              No events scheduled for this day.
            </p>
          ) : (
            <div className="space-y-2">
              {mobileDayEvents.map((ev) => (
                <EventBadge
                  key={ev.id}
                  event={ev}
                  onClick={() => onEventClick(ev)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

