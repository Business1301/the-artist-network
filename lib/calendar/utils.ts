/**
 * THE ARTIST NETWORK — Phase 4.6: Calendar Date & Time Utilities
 * Timezone: Asia/Kolkata (IST, UTC+05:30, fixed offset, zero DST)
 */

export const IST_TIMEZONE = "Asia/Kolkata";
export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5 hours 30 mins

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
