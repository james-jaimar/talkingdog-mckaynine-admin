
import { isBefore, isAfter } from "date-fns";

// Helper function to filter dates by term period
export const filterDatesByTerm = (dates: Date[], termStart: Date, termEnd: Date): Date[] => {
  return dates.filter(date => {
    // Check if the date falls within this term
    return !isBefore(date, termStart) && !isAfter(date, termEnd);
  });
};

// Helper to prepare date and time values from form data
export const prepareDateTime = (dates: Date[], timeString: string): Date => {
  const [hour, minute] = timeString.split(":").map(Number);
  const dateTime = new Date(dates[0]);
  dateTime.setHours(hour, minute, 0, 0);
  return dateTime;
};
