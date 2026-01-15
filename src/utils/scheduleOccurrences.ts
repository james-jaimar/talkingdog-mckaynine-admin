/**
 * Utility functions to compute class schedule occurrences from selected_dates or recurrence patterns.
 * This ensures multi-date schedules are correctly identified as "upcoming" even after their first date passes.
 */

export interface ScheduleForOccurrence {
  start_time: string;
  end_time?: string;
  selected_dates?: string[] | null;
  recurring?: boolean | null;
  recurrence_pattern?: string | null;
}

/**
 * Extract hours and minutes from an ISO timestamp
 */
function extractTimeParts(isoString: string): { hours: number; minutes: number } {
  const date = new Date(isoString);
  return {
    hours: date.getUTCHours(),
    minutes: date.getUTCMinutes(),
  };
}

/**
 * Combine the date portion from one ISO string with the time portion from another
 */
function combineDateWithTime(dateIso: string, timeIso: string): Date {
  const datePart = new Date(dateIso);
  const timeParts = extractTimeParts(timeIso);
  
  // Use UTC to avoid timezone issues
  return new Date(Date.UTC(
    datePart.getUTCFullYear(),
    datePart.getUTCMonth(),
    datePart.getUTCDate(),
    timeParts.hours,
    timeParts.minutes,
    0,
    0
  ));
}

/**
 * Generate all occurrences for a schedule based on selected_dates or recurrence_pattern
 */
export function getScheduleOccurrences(schedule: ScheduleForOccurrence): Date[] {
  // Priority 1: Use selected_dates if available
  if (schedule.selected_dates && Array.isArray(schedule.selected_dates) && schedule.selected_dates.length > 0) {
    const occurrences = schedule.selected_dates
      .map(dateStr => combineDateWithTime(dateStr, schedule.start_time))
      .sort((a, b) => a.getTime() - b.getTime());
    return occurrences;
  }
  
  // Priority 2: Generate from recurrence pattern
  if (schedule.recurring && schedule.recurrence_pattern) {
    try {
      const pattern = JSON.parse(schedule.recurrence_pattern);
      
      if (!pattern?.startDate || !pattern?.endDate || !Array.isArray(pattern?.daysOfWeek)) {
        // Invalid pattern, fall back to start_time
        return schedule.start_time ? [new Date(schedule.start_time)] : [];
      }
      
      const startDate = new Date(pattern.startDate);
      const endDate = new Date(pattern.endDate);
      const daysOfWeek = pattern.daysOfWeek as number[];
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return schedule.start_time ? [new Date(schedule.start_time)] : [];
      }
      
      const occurrences: Date[] = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        if (daysOfWeek.includes(dayOfWeek)) {
          occurrences.push(combineDateWithTime(currentDate.toISOString(), schedule.start_time));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return occurrences.sort((a, b) => a.getTime() - b.getTime());
    } catch (e) {
      console.error("Error parsing recurrence pattern:", e);
      return schedule.start_time ? [new Date(schedule.start_time)] : [];
    }
  }
  
  // Priority 3: Fall back to start_time as single occurrence
  return schedule.start_time ? [new Date(schedule.start_time)] : [];
}

/**
 * Get the next occurrence date for a schedule (first occurrence >= now)
 */
export function getNextOccurrence(schedule: ScheduleForOccurrence, now: Date = new Date()): Date | null {
  const occurrences = getScheduleOccurrences(schedule);
  return occurrences.find(d => d >= now) || null;
}

/**
 * Get the last occurrence date for a schedule (most recent occurrence < now)
 */
export function getLastOccurrence(schedule: ScheduleForOccurrence, now: Date = new Date()): Date | null {
  const occurrences = getScheduleOccurrences(schedule);
  const pastOccurrences = occurrences.filter(d => d < now);
  return pastOccurrences.length > 0 ? pastOccurrences[pastOccurrences.length - 1] : null;
}

/**
 * Check if a schedule has any future occurrences
 */
export function hasUpcomingOccurrence(schedule: ScheduleForOccurrence, now: Date = new Date()): boolean {
  return getNextOccurrence(schedule, now) !== null;
}
