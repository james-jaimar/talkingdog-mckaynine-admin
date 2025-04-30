
import { TermNumber } from './types';
import { startOfDay, endOfDay } from 'date-fns';

// Get current term number based on month
export const getCurrentTermNumber = (): TermNumber => {
  const month = new Date().getMonth() + 1; // getMonth() returns 0-11
  if (month <= 3) return '1';
  if (month <= 6) return '2';
  if (month <= 9) return '3';
  return '4';
};

// Helper to get stored term data from localStorage
export const getStoredTermData = () => {
  try {
    const storedData = localStorage.getItem('mckaynine-selected-term');
    if (storedData) {
      const parsed = JSON.parse(storedData);
      return {
        year: parsed.year || new Date().getFullYear(),
        termNumber: parsed.termNumber || getCurrentTermNumber()
      };
    }
  } catch (error) {
    // Silent failure, don't log here
  }
  return { 
    year: new Date().getFullYear(), 
    termNumber: getCurrentTermNumber() 
  };
};

// Helper to get start and end months for each term
export function getTermMonths(termNumber: TermNumber): [number, number] {
  switch(termNumber) {
    case '1': return [0, 2];   // Jan, Feb, Mar
    case '2': return [3, 5];   // Apr, May, Jun
    case '3': return [6, 8];   // Jul, Aug, Sep
    case '4': return [9, 11];  // Oct, Nov, Dec
  }
}

// Helper to calculate term date range
export const calculateTermDateRange = (
  year: number, 
  termNumber: TermNumber
): { startDate: string; endDate: string } => {
  const [startMonth, endMonth] = getTermMonths(termNumber);
  const startDate = startOfDay(new Date(year, startMonth, 1)).toISOString();
  const endDate = endOfDay(new Date(year, endMonth + 1, 0)).toISOString();
  return { startDate, endDate };
};
