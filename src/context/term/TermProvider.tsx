
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import { TermContextType, TermData, TermNumber } from './types';
import { useTermQuery } from './useTermQuery';
import { useTermSelection } from './useTermSelection';
import { useTermCacheInvalidation } from './useTermCacheInvalidation';

// Create context with default values
const TermContext = createContext<TermContextType | undefined>(undefined);

export function TermProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  
  // Use our custom hooks for term selection and cache invalidation
  const {
    selectedYear,
    setSelectedYear,
    selectedTermNumber,
    setSelectedTermNumber,
    error,
    setError,
    isChangingTerm,
  } = useTermSelection();
  
  const { lastTermId, invalidateTermDependentQueries } = useTermCacheInvalidation();

  // Fetch term data based on selected year and term number
  const { 
    data: termData, 
    isLoading: isFetchingTerm,
    refetch: refetchTerm
  } = useTermQuery(selectedYear, selectedTermNumber, setError);

  // Calculate the real loading state (either fetching or changing term)
  const isTermLoading = isFetchingTerm || isChangingTerm;

  // When term data changes, invalidate and refetch relevant queries
  useEffect(() => {
    if (!termData?.id) return;
    
    // Only invalidate queries when a term is actually changed
    if (termData?.id !== lastTermId.current && !isChangingTerm) {
      // Invalidate queries for the new term and trigger refetch
      invalidateTermDependentQueries(termData.id).then(() => {
        // Refetch just the classes query (the rest will load when their components mount)
        queryClient.refetchQueries({ 
          queryKey: ['classes'],
          exact: false
        });
        
        // Show a notification, but ensure we only do this once
        toast({
          title: `Term Changed`,
          description: `Now viewing Term ${termData.term_number}, ${selectedYear}`,
        });
      });
    }
  }, [termData?.id, invalidateTermDependentQueries, queryClient, selectedYear, isChangingTerm]);

  // Generate years array (current year to current year + 4)
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i);
  
  // Generate terms array (1 to 4)
  const terms: TermNumber[] = ['1', '2', '3', '4'];
  
  // Get date range for the selected term
  const termDateRange = termData ? {
    startDate: termData.start_date,
    endDate: termData.end_date
  } : null;

  const contextValue: TermContextType = {
    selectedYear,
    setSelectedYear,
    selectedTermNumber,
    setSelectedTermNumber,
    termData,
    isTermLoading,
    error,
    termDateRange,
    years,
    terms,
    refetchTerm
  };

  return (
    <TermContext.Provider value={contextValue}>
      {children}
    </TermContext.Provider>
  );
}

export const useTerm = () => {
  const context = useContext(TermContext);
  if (context === undefined) {
    throw new Error('useTerm must be used within a TermProvider');
  }
  return context;
};
