
export interface Term {
  id: string;
  term_number: string;
  startDate: string;
  endDate: string;
  academicYear: number;
  isCurrent: boolean;
}

export type TermNumber = '1' | '2' | '3' | '4';
export const TERM_STORAGE_KEY = 'mckaynine-term-selection';
export const TERM_CHANGE_DEBOUNCE_MS = 500;

// Legacy database format term data
export interface LegacyTermData {
  id: string;
  term_number: TermNumber;
  start_date: string;
  end_date: string;
  current?: boolean;
  year: number;
  academic_years?: {
    id: string;
    year: number;
  };
}

// Application format term data
export interface TermData {
  id: string;
  term_number: TermNumber;
  start_date: string;
  end_date: string;
  current?: boolean;
  academic_years?: {
    id: string;
    year: number;
  };
}

export interface TermDateRange {
  startDate: string;
  endDate: string;
}

export interface TermContextType {
  currentTerm: Term | null;
  allTerms: Term[];
  selectedTerm: Term | null;
  isLoading: boolean;
  error: Error | null;
  setSelectedTerm: (term: Term | null) => void;
  refetchTerms: () => Promise<any>;
  
  // Additional properties for backward compatibility
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedTermNumber: TermNumber;
  setSelectedTermNumber: (term: TermNumber) => void;
  termData: TermData | null;
  isTermLoading: boolean;
  termDateRange: TermDateRange | null;
  years: number[];
  terms: TermNumber[];
  refetchTerm: () => Promise<any>;
}

export interface NavigationItem {
  name: string;
  path: string;
  icon?: any;
  developerOnly?: boolean;
}
