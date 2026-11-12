import { ArtistCalendarEvent } from "./types";

/**
 * THE ARTIST NETWORK — Phase 4.6: Calendar Date & Time Utilities
 * Timezone: Asia/Kolkata (IST, UTC+05:30, fixed offset, zero DST)
 */

export const IST_TIMEZONE = "Asia/Kolkata";
export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5 hours 30 mins

/**
 * Get current date in Asia/Kolkata as "YYYY-MM-DD"
 */
export function getTodayIstDateStr(): string {
  const istEpoch = Date.now() + IST_OFFSET_MS;
  const d = new Date(istEpoch);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Extract "YYYY-MM-DD" in Asia/Kolkata from a UTC ISO timestamp
 */
export function utcIsoToIstDateStr(isoString: string): string {
  const d = new Date(new Date(isoString).getTime() + IST_OFFSET_MS);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Extract "HH:mm" in Asia/Kolkata from a UTC ISO timestamp
 */
export function utcIsoToIstTimeStr(isoString: string): string {
  const d = new Date(new Date(isoString).getTime() + IST_OFFSET_MS);
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const mins = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${mins}`;
}

/**
 * Format a UTC ISO timestamp for display in Asia/Kolkata
 */
export function formatIstDate(
  isoString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: IST_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  };

  return new Intl.DateTimeFormat("en-IN", defaultOptions).format(date);
}

/**
 * Format a UTC ISO timestamp for time display in Asia/Kolkata (e.g., "08:00 PM")
 */
export function formatIstTime(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Format time range for calendar pills (e.g., "7:00 PM - 11:00 PM" or "All day")
 */
export function formatIstTimeRange(
  startIso: string,
  endIso: string,
  isAllDay: boolean
): string {
  if (isAllDay) return "All day";
  const start = formatIstTime(startIso);
  const end = formatIstTime(endIso);
  return `${start} – ${end}`;
}

/**
 * Convert an IST date string (YYYY-MM-DD) and optional time (HH:mm) to UTC ISO string
 */
export function istToUtcIso(dateStr: string, timeStr = "00:00"): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);

  // UTC epoch representation of the IST wall-clock time
  const istAsUtcEpoch = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
  const actualUtcEpoch = istAsUtcEpoch - IST_OFFSET_MS;

  return new Date(actualUtcEpoch).toISOString();
}

/**
 * Determine whether a calendar event falls on or overlaps a given IST date ("YYYY-MM-DD").
 * Correctly accounts for multi-day and overnight bookings.
 */
export function eventOccursOnIstDate(
  event: ArtistCalendarEvent,
  istDateStr: string
): boolean {
  // Day boundaries in UTC
  const dayStartUtc = istToUtcIso(istDateStr, "00:00");
  
  // Day end (midnight start of next day)
  const [y, m, d] = istDateStr.split("-").map(Number);
  const nextDate = new Date(Date.UTC(y, m - 1, d + 1));
  const nextDateStr = `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, "0")}-${String(nextDate.getUTCDate()).padStart(2, "0")}`;
  const dayEndUtc = istToUtcIso(nextDateStr, "00:00");

  // Interval overlap: event.start_time < dayEndUtc AND event.end_time > dayStartUtc
  return event.start_time < dayEndUtc && event.end_time > dayStartUtc;
}

/**
 * Format currency in Indian Rupees (INR)
 */
export function formatCurrencyInr(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Helper to get month boundary ISO strings in Asia/Kolkata
 * Month is 1-indexed (1 = January, 12 = December)
 */
export function getMonthDateRange(
  year: number,
  month: number
): { startIso: string; endIso: string } {
  // Start of month at 00:00:00 IST
  const startStr = `${year}-${String(month).padStart(2, "0")}-01`;
  const startIso = istToUtcIso(startStr, "00:00");

  // Start of next month at 00:00:00 IST (exclusive upper bound)
  const nextMonthYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const endStr = `${nextMonthYear}-${String(nextMonth).padStart(2, "0")}-01`;
  const endIso = istToUtcIso(endStr, "00:00");

  return { startIso, endIso };
}

/**
 * Helper to get week boundary ISO strings in Asia/Kolkata
 * Monday 00:00:00 IST to next Monday 00:00:00 IST (7 days)
 */
export function getWeekDateRange(anchorDate: Date | string = new Date()): {
  startIso: string;
  endIso: string;
} {
  const date = typeof anchorDate === "string" ? new Date(anchorDate) : anchorDate;
  
  // Calculate day in IST
  const istEpoch = date.getTime() + IST_OFFSET_MS;
  const istDate = new Date(istEpoch);
  const dayOfWeek = istDate.getUTCDay(); // 0 is Sunday, 1 is Monday

  // Distance to Monday (if Sunday (0), it's -6 days; otherwise 1 - dayOfWeek)
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const mondayEpoch = istEpoch + diffToMonday * 24 * 60 * 60 * 1000;
  const mondayDate = new Date(mondayEpoch);

  const year = mondayDate.getUTCFullYear();
  const month = mondayDate.getUTCMonth() + 1;
  const day = mondayDate.getUTCDate();

  const startStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const startIso = istToUtcIso(startStr, "00:00");

  // End 7 days later
  const nextMondayEpoch = mondayEpoch + 7 * 24 * 60 * 60 * 1000;
  const nextMondayDate = new Date(nextMondayEpoch);
  const endStr = `${nextMondayDate.getUTCFullYear()}-${String(nextMondayDate.getUTCMonth() + 1).padStart(2, "0")}-${String(nextMondayDate.getUTCDate()).padStart(2, "0")}`;
  const endIso = istToUtcIso(endStr, "00:00");

  return { startIso, endIso };
}

export interface MonthGridDay {
  dateStr: string; // "YYYY-MM-DD"
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

/**
 * Generate 35 or 42 grid cells for an entire monthly calendar display (Monday-first)
 */
export function getDaysInMonthGrid(year: number, month: number): MonthGridDay[] {
  const todayStr = getTodayIstDateStr();
  
  // 1st of month in IST
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const dayOfWeek = firstOfMonth.getUTCDay(); // 0 is Sun, 1 is Mon...
  // Monday is index 0:
  const offsetToMonday = (dayOfWeek + 6) % 7;

  // Number of days in current month
  const daysInCurrentMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const cells: MonthGridDay[] = [];

  // Previous month trailing days
  if (offsetToMonday > 0) {
    const prevMonthDays = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonth = month === 1 ? 12 : month - 1;

    for (let i = offsetToMonday - 1; i >= 0; i--) {
      const dNum = prevMonthDays - i;
      const dateStr = `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(dNum).padStart(2, "0")}`;
      cells.push({
        dateStr,
        dayNumber: dNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }
  }

  // Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({
      dateStr,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    });
  }

  // Next month leading days to complete full week rows
  const remainingCells = (7 - (cells.length % 7)) % 7;
  const totalCellsNeeded = cells.length + remainingCells < 35 ? 35 : cells.length + remainingCells;
  const nextMonthDaysNeeded = totalCellsNeeded - cells.length;

  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;

  for (let d = 1; d <= nextMonthDaysNeeded; d++) {
    const dateStr = `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({
      dateStr,
      dayNumber: d,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  return cells;
}

export interface WeekGridDay {
  dateStr: string; // "YYYY-MM-DD"
  dayName: string; // "Mon", "Tue"
  dayNumber: number;
  isToday: boolean;
}

/**
 * Generate 7 days for a week calendar view starting on Monday
 */
export function getDaysInWeekGrid(anchorDateStr: string): WeekGridDay[] {
  const todayStr = getTodayIstDateStr();
  const [y, m, d] = anchorDateStr.split("-").map(Number);
  const targetDate = new Date(Date.UTC(y, m - 1, d));
  const dayOfWeek = targetDate.getUTCDay();
  const diffToMonday = (dayOfWeek + 6) % 7;

  const mondayEpoch = targetDate.getTime() - diffToMonday * 24 * 60 * 60 * 1000;
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const days: WeekGridDay[] = [];
  for (let i = 0; i < 7; i++) {
    const dObj = new Date(mondayEpoch + i * 24 * 60 * 60 * 1000);
    const dateStr = `${dObj.getUTCFullYear()}-${String(dObj.getUTCMonth() + 1).padStart(2, "0")}-${String(dObj.getUTCDate()).padStart(2, "0")}`;
    days.push({
      dateStr,
      dayName: dayNames[i],
      dayNumber: dObj.getUTCDate(),
      isToday: dateStr === todayStr,
    });
  }

  return days;
}
