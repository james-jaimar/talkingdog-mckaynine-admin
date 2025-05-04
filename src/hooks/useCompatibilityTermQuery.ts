
import { useState, useEffect } from "react";
import { useTerm } from "@/context/TermContext";

// A compatibility hook that transforms term data into a format used by legacy components
export function useCompatibilityTermQuery() {
  const { termData, termDateRange, isLoading } = useTerm();
  const [compatTermData, setCompatTermData] = useState<{
    id: string | null;
    term_number: string | null;
    startDate: string | null;
    endDate: string | null;
  }>({
    id: null,
    term_number: null,
    startDate: null,
    endDate: null
  });
  
  // Transform data whenever termData or termDateRange changes
  useEffect(() => {
    if (termData && termDateRange) {
      setCompatTermData({
        id: termData.id,
        term_number: termData.term_number,
        startDate: termDateRange.startDate,
        endDate: termDateRange.endDate
      });
    }
  }, [termData, termDateRange]);
  
  return {
    termData: compatTermData,
    isLoading
  };
}
