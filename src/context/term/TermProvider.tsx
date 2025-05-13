
import React, { createContext, useContext } from "react";
import { TermData, TermContextType, TermDateRange } from "./types";
import { useTermSelection } from "./useTermSelection";
import { useTermQuery } from "./useTermQuery";
import { useTermCacheInvalidation } from "./useTermCacheInvalidation";

const TermContext = createContext<TermContextType | undefined>(undefined);

export function TermProvider({ children }: { children: React.ReactNode }) {
  // Term selection state
  const { 
    selectedTermNumber, 
    selectedYear, 
    setSelectedTermNumber, 
    setSelectedYear,
    years,
    terms
  } = useTermSelection();
  
  // Term data loading with React Query
  const { 
    termData, 
    isTermLoading, 
    error, 
    refetchTerm 
  } = useTermQuery(selectedTermNumber, selectedYear);
  
  // Cache invalidation for term-related data
  useTermCacheInvalidation(termData?.id);
  
  // Derive the term date range from term data
  const termDateRange: TermDateRange | null = termData ? {
    startDate: termData.start_date,
    endDate: termData.end_date,
  } : null;
  
  // Context value
  const contextValue: TermContextType = {
    termData,
    isTermLoading,
    error,
    refetchTerm,
    selectedTermNumber,
    selectedYear,
    setSelectedTermNumber,
    setSelectedYear,
    termDateRange,
    years,
    terms
  };

  return (
    <TermContext.Provider value={contextValue}>
      {children}
    </TermContext.Provider>
  );
}

export function useTerm(): TermContextType {
  const context = useContext(TermContext);
  
  if (context === undefined) {
    throw new Error("useTerm must be used within a TermProvider");
  }
  
  return context;
}
