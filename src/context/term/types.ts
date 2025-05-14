
export interface Term {
  id: string;
  termNumber: string;
  startDate: string;
  endDate: string;
  academicYear: number;
  isCurrent: boolean;
}

export interface TermContextType {
  currentTerm: Term | null;
  allTerms: Term[];
  selectedTerm: Term | null;
  isLoading: boolean;
  error: Error | null;
  setSelectedTerm: (term: Term | null) => void;
  refetchTerms: () => Promise<any>;
}

export interface NavigationItem {
  name: string;
  path: string;
  icon?: any;
  developerOnly?: boolean; // Add this property
}
