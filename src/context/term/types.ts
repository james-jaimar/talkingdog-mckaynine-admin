
export interface TermData {
  id: string;
  term_number: string; // Changed from number to string to match database
  start_date: string;
  end_date: string;
  academic_years?: {
    year: number;
  };
  current?: boolean; // Added to match actual data structure
}

export interface TermDateRange {
  startDate: string;
  endDate: string;
}

export interface TermContextType {
  termData: TermData | null;
  isTermLoading: boolean;
  error: Error | null;
  refetchTerm: () => Promise<any>;
  selectedTermNumber: string | null; // Changed from number to string
  selectedYear: number | null;
  setSelectedTermNumber: (termNumber: string) => void; // Changed parameter type
  setSelectedYear: (year: number) => void;
  termDateRange: TermDateRange | null;
  // Add missing properties needed by TermSelectorRow
  years: number[];
  terms: string[];
}
