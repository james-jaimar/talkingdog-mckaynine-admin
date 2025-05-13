
import { TermData, TermNumber, TERM_STORAGE_KEY } from "./types";

// Generate unique string IDs for default terms
export const generateDefaultTermId = (year: number, termNumber: string): string => {
  return `default-term-${year}-${termNumber}`;
};

// Check if current date is within range
export function isCurrentDateInRange(startDate: Date, endDate: Date): boolean {
  const currentDate = new Date();
  return currentDate >= startDate && currentDate <= endDate;
}

// Get stored term data from localStorage
export function getStoredTermData(): { year: number; termNumber: TermNumber } {
  try {
    const storedData = localStorage.getItem(TERM_STORAGE_KEY);
    if (storedData) {
      return JSON.parse(storedData);
    }
  } catch (error) {
    console.error("Error reading term data from localStorage:", error);
  }
  
  // Default to current year and term 1
  return {
    year: new Date().getFullYear(),
    termNumber: "1" as TermNumber
  };
}

// Get default terms for current year
export function getDefaultTermsForCurrentYear(): TermData[] {
  const currentYear = new Date().getFullYear();
  
  return [
    {
      id: generateDefaultTermId(currentYear, "1"),
      termNumber: "1",
      year: currentYear,
      startDate: `${currentYear}-01-01`, // January 1
      endDate: `${currentYear}-03-31`, // March 31
      current: isCurrentDateInRange(
        new Date(`${currentYear}-01-01`), 
        new Date(`${currentYear}-03-31`)
      ),
    },
    {
      id: generateDefaultTermId(currentYear, "2"),
      termNumber: "2",
      year: currentYear,
      startDate: `${currentYear}-04-01`, // April 1
      endDate: `${currentYear}-06-30`, // June 30
      current: isCurrentDateInRange(
        new Date(`${currentYear}-04-01`), 
        new Date(`${currentYear}-06-30`)
      ),
    },
    {
      id: generateDefaultTermId(currentYear, "3"),
      termNumber: "3",
      year: currentYear,
      startDate: `${currentYear}-07-01`, // July 1
      endDate: `${currentYear}-09-30`, // September 30
      current: isCurrentDateInRange(
        new Date(`${currentYear}-07-01`), 
        new Date(`${currentYear}-09-30`)
      ),
    },
    {
      id: generateDefaultTermId(currentYear, "4"),
      termNumber: "4",
      year: currentYear,
      startDate: `${currentYear}-10-01`, // October 1
      endDate: `${currentYear}-12-31`, // December 31
      current: isCurrentDateInRange(
        new Date(`${currentYear}-10-01`), 
        new Date(`${currentYear}-12-31`)
      ),
    },
  ];
}

// Format the term display name
export function formatTermDisplay(termData: TermData | null): string {
  if (!termData) return "No term selected";
  
  return `Term ${termData.termNumber} ${termData.year}`;
}
