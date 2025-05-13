
export type TermNumber = '1' | '2' | '3' | '4';

export interface AcademicYear {
  year: number;
}

export interface TermData {
  id: string;
  term_number: TermNumber;
  start_date: string;
  end_date: string;
  current: boolean;
  academic_years?: AcademicYear;
}

export interface TermDateRange {
  startDate: string;
  endDate: string;
}

export interface TermContextType {
  termData: TermData | null;
  isTermLoading: boolean;
  error: Error | null;
  refetchTerm: () => void;
  selectedTermNumber: string | null;
  selectedYear: number | null;
  setSelectedTermNumber: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedYear: React.Dispatch<React.SetStateAction<number | null>>;
  termDateRange: TermDateRange | null;
  years: number[];
  terms: string[];
}
