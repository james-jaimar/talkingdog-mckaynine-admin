
import { format, setHours, setMinutes } from "date-fns";

export function useClassScheduleDateUtils() {
  // Helper to combine date and time
  const combineDateTime = (date: Date, timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return setMinutes(setHours(new Date(date), hours), minutes);
  };

  // Format dates and times
  const formatTimeFromDate = (date: Date): string => {
    return format(date, "HH:mm");
  };

  // Sort dates
  const sortDates = (dates: Date[]): Date[] => {
    return [...dates].sort((a, b) => a.getTime() - b.getTime());
  };

  return {
    combineDateTime,
    formatTimeFromDate,
    sortDates
  };
}
