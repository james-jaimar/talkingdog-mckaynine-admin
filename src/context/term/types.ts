
export type TermNumber = '1' | '2' | '3' | '4';

export interface TermData {
  id: string;
  term_number: TermNumber;
  start_date: string;
  end_date: string;
  current?: boolean;
  academic_years?: {
    year: number;
  };
}

export interface TermContextType {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedTermNumber: TermNumber;
  setSelectedTermNumber: (termNumber: TermNumber) => void;
  termData: TermData | null;
  isTermLoading: boolean;
  error: Error | null;
  termDateRange: { startDate: string; endDate: string } | null;
  years: number[];
  terms: TermNumber[];
  refetchTerm: () => Promise<any>;
}

export const TERM_STORAGE_KEY = 'mckaynine-selected-term';
export const TERM_CHANGE_DEBOUNCE_MS = 500; // Debounce time in ms
