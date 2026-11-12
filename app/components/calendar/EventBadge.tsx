"use client";

import { ArtistCalendarEvent } from "@/lib/calendar/types";
import { formatIstTime } from "@/lib/calendar/utils";

interface EventBadgeProps {
  event: ArtistCalendarEvent;
  compact?: boolean;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
}

export function getEventStyle(event: ArtistCalendarEvent) {
  if (event.event_type === "unavailable_block") {
    return {
      bg: "bg-rose-50 hover:bg-rose-100",
      text: "text-rose-900",
      border: "border-rose-200",
      dot: "bg-rose-500",
      label: "Blocked",
    };
  }

  switch (event.status) {
    case "tentative":
      return {
        bg: "bg-amber-50 hover:bg-amber-100",
        text: "text-amber-900",
        border: "border-amber-200",
        dot: "bg-amber-500",
        label: "Tentative",
      };
    case "completed":
      return {
        bg: "bg-emerald-50 hover:bg-emerald-100",
        text: "text-emerald-900",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
        label: "Completed",
      };
    case "cancelled":
      return {
        bg: "bg-gray-100 hover:bg-gray-200",
        text: "text-gray-500 line-through",
        border: "border-gray-200",
        dot: "bg-gray-400",
        label: "Cancelled",
      };
    case "confirmed":
    default:
      return {
        bg: "bg-purple-50 hover:bg-purple-100",
        text: "text-purple-900",
        border: "border-purple-200",
        dot: "bg-purple-600",
        label: "Confirmed",
      };
  }
}

export default function EventBadge({
  event,
  compact = false,
  onClick,
}: EventBadgeProps) {
  const style = getEventStyle(event);
  const isBlocked = event.event_type === "unavailable_block";
  const timeLabel = event.is_all_day ? "All day" : formatIstTime(event.start_time);

  return (
    <button
      type="button"
      onClick={(e) => onClick?.(e)}
      className={`w-full text-left rounded-lg px-2 py-1 border transition-all text-xs flex items-center gap-1.5 cursor-pointer shadow-xs ${style.bg} ${style.border} ${style.text}`}
      title={`${event.title} (${timeLabel})`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
      <span className="truncate font-semibold flex-1">
        {isBlocked ? "⛔ " : ""}
        {event.title}
      </span>
      {!compact && (
        <span className="text-[10px] opacity-75 shrink-0 font-medium">
          {timeLabel}
        </span>
      )}
    </button>
  );
}

