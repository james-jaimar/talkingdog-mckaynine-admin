
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isValid, parse } from "date-fns";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string | Date | null): string {
  if (!dateString) return "";
  
  try {
    // Handle different input types
    let date: Date;
    
    if (dateString instanceof Date) {
      date = dateString;
    } else {
      // Try to parse ISO string format
      date = new Date(dateString);
      
      // If not valid, try to parse different formats
      if (!isValid(date)) {
        // Try DD/MM/YYYY format
        const parsedDate = parse(dateString, 'dd/MM/yyyy', new Date());
        if (isValid(parsedDate)) {
          date = parsedDate;
        } else {
          return "";
        }
      }
    }
    
    if (!isValid(date)) return "";
    
    return format(date, 'MMMM d, yyyy');
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
}

export function formatDateForInput(dateString?: string | Date | null): string {
  if (!dateString) return "";
  
  try {
    let date: Date;
    
    if (dateString instanceof Date) {
      date = dateString;
    } else {
      date = new Date(dateString);
    }
    
    if (!isValid(date)) return "";
    
    // Format as YYYY-MM-DD for input[type="date"]
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    console.error("Error formatting date for input:", error);
    return "";
  }
}
