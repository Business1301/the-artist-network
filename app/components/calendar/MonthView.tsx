"use client";

import { ArtistCalendarEvent } from "@/lib/calendar/types";
import {
  MonthGridDay,
  getDaysInMonthGrid,
  eventOccursOnIstDate,
  formatIstTimeRange,
} from "@/lib/calendar/utils";
import EventBadge from "./EventBadge";

interface MonthViewProps {
  year: number;
  month: number; // 1-indexed
  events: ArtistCalendarEvent[];
  selectedDateStr: string;
  isLoading: boolean;
  onDateSelect: (dateStr: string) => void;
  onEventClick: (event: ArtistCalendarEvent) => void;
  onAddEvent: (dateStr: string) => void;
}

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_VISIBLE_PILLS = 3;

export default function MonthView({
  year,
  month,
  events,
  selectedDateStr,
  isLoading,
  onDateSelect,
  onEventClick,
  onAddEvent,
}: MonthViewProps) {
  const grid: MonthGridDay[] = getDaysInMonthGrid(year, month);

  function eventsForDate(dateStr: string): ArtistCalendarEvent[] {
    return events.filter((e) => eventOccursOnIstDate(e, dateStr));
  }

  const selectedEvents = eventsForDate(selectedDateStr);

  return (
    <div className="flex flex-col gap-0">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 bg-white/60 flex items-center justify-center rounded-2xl">
          <span className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Day header row */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAY_HEADERS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid — hidden on mobile, shown on sm+ */}
      <div className="hidden sm:grid grid-cols-7 divide-x divide-y divide-gray-100 border-b border-gray-100">
        {grid.map((cell) => {
          const dayEvents = eventsForDate(cell.dateStr);
          const overflow = dayEvents.length - MAX_VISIBLE_PILLS;
          const isSelected = cell.dateStr === selectedDateStr;

          return (
            <div
              key={cell.dateStr}
              onClick={() => onDateSelect(cell.dateStr)}
              className={`min-h-[88px] p-1.5 cursor-pointer transition-colors group relative ${
                cell.isCurrentMonth
                  ? "bg-white hover:bg-purple-50/40"
                  : "bg-gray-50/60 hover:bg-gray-100/60"
              } ${isSelected ? "ring-inset ring-2 ring-purple-400" : ""}`}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold leading-none w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                    cell.isToday
                      ? "bg-purple-600 text-white"
                      : cell.isCurrentMonth
                      ? "text-gray-900"
                      : "text-gray-400"
                  }`}
                >
                  {cell.dayNumber}
                </span>
                {/* Quick-add button */}
                {cell.isCurrentMonth && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddEvent(cell.dateStr);
                    }}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-700 text-[10px] flex items-center justify-center transition-opacity font-bold"
                    title={`Add event on ${cell.dateStr}`}
                    aria-label={`Add event on ${cell.dateStr}`}
                  >
                    +
                  </button>
                )}
              </div>

              {/* Event pills */}
              <div className="space-y-0.5">
                {dayEvents.slice(0, MAX_VISIBLE_PILLS).map((ev) => (
                  <div
                    key={ev.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(ev);
                    }}
                  >
                    <EventBadge
                      event={ev}
                      compact
                      onClick={() => onEventClick(ev)}
                    />
                  </div>
                ))}
                {overflow > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDateSelect(cell.dateStr);
                    }}
                    className="text-[10px] text-purple-600 font-bold hover:underline pl-1"
                  >
                    +{overflow} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile mini-calendar: dots + selected day agenda */}
      <div className="sm:hidden">
        {/* Compact grid (numbers + dots) */}
        <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 border-b border-gray-100">
          {grid.map((cell) => {
            const dayEvents = eventsForDate(cell.dateStr);
            const isSelected = cell.dateStr === selectedDateStr;
            return (
              <button
                key={cell.dateStr}
                type="button"
                onClick={() => onDateSelect(cell.dateStr)}
                className={`flex flex-col items-center py-2 gap-0.5 transition-colors ${
                  cell.isCurrentMonth
                    ? "bg-white hover:bg-purple-50"
                    : "bg-gray-50 hover:bg-gray-100"
                } ${isSelected ? "bg-purple-50" : ""}`}
              >
                <span
                  className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full ${
                    cell.isToday
                      ? "bg-purple-600 text-white"
                      : isSelected
                      ? "bg-purple-100 text-purple-700"
                      : cell.isCurrentMonth
                      ? "text-gray-900"
                      : "text-gray-400"
                  }`}
                >
                  {cell.dayNumber}
                </span>
                {/* Event dots (max 3) */}
                <div className="flex gap-0.5">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <span
                      key={ev.id}
                      className={`w-1 h-1 rounded-full ${
                        ev.event_type === "unavailable_block"
                          ? "bg-rose-400"
                          : ev.status === "tentative"
                          ? "bg-amber-400"
                          : ev.status === "completed"
                          ? "bg-emerald-500"
                          : ev.status === "cancelled"
                          ? "bg-gray-400"
                          : "bg-purple-500"
                      }`}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected day agenda */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-900">
              {new Date(selectedDateStr + "T00:00:00").toLocaleDateString(
                "en-IN",
                { weekday: "long", day: "numeric", month: "long" }
              )}
            </h3>
            <button
              type="button"
              onClick={() => onAddEvent(selectedDateStr)}
              className="px-3 py-1 rounded-xl text-[11px] font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            >
              + Add
            </button>
          </div>

          {selectedEvents.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">
              No events scheduled for this day.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => onEventClick(ev)}
                  className="w-full text-left cursor-pointer"
                >
                  <EventBadge event={ev} onClick={() => onEventClick(ev)} />
                  <p className="text-[10px] text-gray-500 pl-5 mt-0.5">
                    {formatIstTimeRange(ev.start_time, ev.end_time, ev.is_all_day)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
