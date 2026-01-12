import { format, parseISO } from "date-fns";

/**
 * Formats an array of class dates into a readable string
 * @param dates Array of ISO date strings
 * @returns Formatted string like "18 Jan - 22 Mar 2026 (10 sessions)"
 */
export function formatClassDates(dates: string[] | null): string {
  if (!dates || dates.length === 0) {
    return "Dates to be confirmed";
  }

  // Sort dates chronologically
  const sortedDates = [...dates].sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  const firstDate = parseISO(sortedDates[0]);
  const lastDate = parseISO(sortedDates[sortedDates.length - 1]);
  const sessionCount = sortedDates.length;

  // Format based on whether dates span different years
  const firstYear = firstDate.getFullYear();
  const lastYear = lastDate.getFullYear();

  if (firstYear === lastYear) {
    // Same year: "18 Jan - 22 Mar 2026 (10 sessions)"
    return `${format(firstDate, "d MMM")} - ${format(lastDate, "d MMM yyyy")} (${sessionCount} session${sessionCount !== 1 ? 's' : ''})`;
  } else {
    // Different years: "18 Nov 2025 - 22 Mar 2026 (10 sessions)"
    return `${format(firstDate, "d MMM yyyy")} - ${format(lastDate, "d MMM yyyy")} (${sessionCount} session${sessionCount !== 1 ? 's' : ''})`;
  }
}

/**
 * Formats a start time into day and time
 * @param startTime ISO datetime string
 * @returns Formatted string like "Saturdays at 09:00"
 */
export function formatClassDayTime(startTime: string | null): string {
  if (!startTime) {
    return "Time to be confirmed";
  }

  const date = parseISO(startTime);
  const dayName = format(date, "EEEE") + "s"; // e.g., "Saturdays"
  const time = format(date, "HH:mm");

  return `${dayName} at ${time}`;
}
