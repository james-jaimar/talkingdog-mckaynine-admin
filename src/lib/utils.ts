
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date for display
 */
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return "-";
  try {
    const date = parseISO(dateString);
    return format(date, "MMM d, yyyy");
  } catch (e) {
    console.error("Error formatting date:", e);
    return dateString;
  }
};

/**
 * Format a date for input fields (yyyy-MM-dd)
 */
export const formatDateForInput = (dateString: string | null): string => {
  if (!dateString) return "";
  try {
    const date = parseISO(dateString);
    return format(date, "yyyy-MM-dd");
  } catch (e) {
    console.error("Error formatting date for input:", e);
    return "";
  }
};
