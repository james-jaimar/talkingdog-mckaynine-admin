
export interface TermData {
  id: string;
  termNumber: string;
  year: number;
  startDate: string;
  endDate: string;
  current: boolean;
}

export type TermNumber = '1' | '2' | '3' | '4';

// Constants for term data handling
export const TERM_STORAGE_KEY = 'mckaynine-selected-term';
export const TERM_CHANGE_DEBOUNCE_MS = 500;

// For backwards compatibility with existing code using the old property names
export interface LegacyTermData {
  id: string;
  term_number: string;  // Snake case version
  year: number;
  start_date: string;   // Snake case version
  end_date: string;     // Snake case version
  current: boolean;
  academic_years?: {
    year: number;
  };
}
