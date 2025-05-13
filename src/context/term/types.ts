
export interface TermData {
  id: string;
  term_number: number;
  start_date: string;
  end_date: string;
  academic_years?: {
    year: number;
  };
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
  selectedTermNumber: number | null;
  selectedYear: number | null;
  setSelectedTermNumber: (termNumber: number) => void;
  setSelectedYear: (year: number) => void;
  termDateRange: TermDateRange | null;
}
