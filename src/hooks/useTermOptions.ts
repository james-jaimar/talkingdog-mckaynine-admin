import { useMemo } from "react";

interface TermOption {
  label: string;
  term_number: string;
  year: number;
}

export function useTermOptions() {
  const currentYear = new Date().getFullYear();
  
  const terms = useMemo<TermOption[]>(() => {
    const options: TermOption[] = [];
    
    // Generate terms for current year and next year
    [currentYear, currentYear + 1].forEach(year => {
      ['1', '2', '3', '4'].forEach(term => {
        options.push({
          label: `Term ${term} ${year}`,
          term_number: term,
          year: year
        });
      });
    });
    
    return options;
  }, [currentYear]);

  return { terms, isLoading: false };
}
