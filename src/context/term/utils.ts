
import { format, addDays, parse, startOfYear, endOfYear } from 'date-fns';
import { TermNumber, TERM_STORAGE_KEY } from './types';

// Get default data for term selection
export const getStoredTermData = () => {
  const currentYear = new Date().getFullYear();
  const defaultData = { year: currentYear, termNumber: '1' as TermNumber };
  
  try {
    const stored = localStorage.getItem(TERM_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        year: Number(parsed.year) || currentYear,
        termNumber: parsed.termNumber || '1'
      };
    }
    return defaultData;
  } catch (err) {
    console.error('Error reading saved term data:', err);
    return defaultData;
  }
};

// Calculate a term's date range based on year and term number
export const calculateTermDateRange = (year: number, termNumber: string) => {
  // Create a default fallback range for the whole year
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));
  
  // Define term date ranges
  switch(termNumber) {
    case '1':
      return {
        startDate: format(new Date(year, 0, 15), 'yyyy-MM-dd'),  // Jan 15
        endDate: format(new Date(year, 3, 15), 'yyyy-MM-dd')     // Apr 15
      };
    case '2':
      return {
        startDate: format(new Date(year, 3, 16), 'yyyy-MM-dd'),  // Apr 16
        endDate: format(new Date(year, 6, 15), 'yyyy-MM-dd')     // Jul 15
      };
    case '3':
      return {
        startDate: format(new Date(year, 6, 16), 'yyyy-MM-dd'),  // Jul 16
        endDate: format(new Date(year, 9, 15), 'yyyy-MM-dd')     // Oct 15
      };
    case '4':
      return {
        startDate: format(new Date(year, 9, 16), 'yyyy-MM-dd'),  // Oct 16
        endDate: format(new Date(year, 11, 31), 'yyyy-MM-dd')    // Dec 31
      };
    default:
      // Fallback to full year if term number is invalid
      return {
        startDate: format(yearStart, 'yyyy-MM-dd'),
        endDate: format(yearEnd, 'yyyy-MM-dd') 
      };
  }
};
