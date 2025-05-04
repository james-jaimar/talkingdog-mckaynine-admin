
import { TERM_STORAGE_KEY, TermNumber } from "./types";

/**
 * Gets stored term selection data from localStorage
 */
export function getStoredTermData(): { year: number; termNumber: TermNumber } {
  try {
    const savedData = localStorage.getItem(TERM_STORAGE_KEY);
    if (!savedData) {
      return { 
        year: new Date().getFullYear(), 
        termNumber: "1" 
      };
    }
    
    const parsed = JSON.parse(savedData);
    return {
      year: typeof parsed.year === 'number' ? parsed.year : new Date().getFullYear(),
      termNumber: parsed.term || parsed.termNumber || "1"
    };
  } catch (e) {
    console.error('Error parsing stored term data', e);
    return { 
      year: new Date().getFullYear(), 
      termNumber: "1" 
    };
  }
}

/**
 * Calculate term date range based on term number and year
 */
export function calculateTermDateRange(year: number, termNumber: TermNumber) {
  switch (termNumber) {
    case "1":
      return {
        startDate: `${year}-01-01`,
        endDate: `${year}-03-31`
      };
    case "2":
      return {
        startDate: `${year}-04-01`,
        endDate: `${year}-06-30`
      };
    case "3":
      return {
        startDate: `${year}-07-01`,
        endDate: `${year}-09-30`
      };
    case "4":
      return {
        startDate: `${year}-10-01`,
        endDate: `${year}-12-31`
      };
    default:
      return {
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`
      };
  }
}
