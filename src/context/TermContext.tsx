
import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { startOfDay, endOfDay } from 'date-fns';

// Define types
type TermNumber = '1' | '2' | '3' | '4';

interface TermData {
  id: string;
  term_number: TermNumber;
  start_date: string;
  end_date: string;
  current?: boolean;
  academic_years?: {
    year: number;
  };
}

interface TermContextType {
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

const TERM_STORAGE_KEY = 'mckaynine-selected-term';

// Create context with default values
const TermContext = createContext<TermContextType | undefined>(undefined);

// Get current term number based on month
const getCurrentTermNumber = (): TermNumber => {
  const month = new Date().getMonth() + 1; // getMonth() returns 0-11
  if (month <= 3) return '1';
  if (month <= 6) return '2';
  if (month <= 9) return '3';
  return '4';
};

// Helper to get stored term data from localStorage
const getStoredTermData = () => {
  try {
    const storedData = localStorage.getItem(TERM_STORAGE_KEY);
    if (storedData) {
      const parsed = JSON.parse(storedData);
      return {
        year: parsed.year || new Date().getFullYear(),
        termNumber: parsed.termNumber || getCurrentTermNumber()
      };
    }
  } catch (error) {
    console.error('Error reading term data from localStorage:', error);
  }
  return { 
    year: new Date().getFullYear(), 
    termNumber: getCurrentTermNumber() 
  };
};

export function TermProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  
  // Initialize from localStorage if available
  const storedData = getStoredTermData();
  const [selectedYear, setSelectedYearState] = useState<number>(storedData.year);
  const [selectedTermNumber, setSelectedTermNumberState] = useState<TermNumber>(storedData.termNumber);
  const [error, setError] = useState<Error | null>(null);

  // Add state to track sync status and prevent redundant operations
  const [termSynced, setTermSynced] = useState(false);
  const [isChangingTerm, setIsChangingTerm] = useState(false);
  
  // Track last successful term data fetch to avoid redundant updates
  const [lastFetchedTerm, setLastFetchedTerm] = useState<{
    year: number;
    termNumber: TermNumber;
    id?: string;
  }>({
    year: selectedYear,
    termNumber: selectedTermNumber
  });

  // Wrapper functions to update state and persist to localStorage
  const setSelectedYear = useCallback((year: number) => {
    console.log('Setting selected year to:', year);
    setSelectedYearState(year);
    setTermSynced(false); // Mark that we need to sync the term data
    setIsChangingTerm(true); // Flag to indicate term is changing
    localStorage.setItem(
      TERM_STORAGE_KEY, 
      JSON.stringify({ year, termNumber: selectedTermNumber })
    );
    // Reset any previous errors
    setError(null);
    
    // Preemptively clear cache for term-dependent queries
    invalidateTermDependentQueries();
  }, [selectedTermNumber]);
  
  const setSelectedTermNumber = useCallback((termNumber: TermNumber) => {
    console.log('Setting selected term number to:', termNumber);
    setSelectedTermNumberState(termNumber);
    setTermSynced(false); // Mark that we need to sync the term data
    setIsChangingTerm(true); // Flag to indicate term is changing
    localStorage.setItem(
      TERM_STORAGE_KEY, 
      JSON.stringify({ year: selectedYear, termNumber })
    );
    // Reset any previous errors
    setError(null);
    
    // Preemptively clear cache for term-dependent queries
    invalidateTermDependentQueries();
  }, [selectedYear]);

  // Centralized function to invalidate all term-dependent queries
  const invalidateTermDependentQueries = useCallback(async () => {
    console.log("Invalidating all term-dependent queries");
    
    // First, forcefully remove all relevant cache entries
    await Promise.all([
      queryClient.removeQueries({ queryKey: ['classes'], exact: false }),
      queryClient.removeQueries({ queryKey: ['class-handlers'], exact: false }),
      queryClient.removeQueries({ queryKey: ['class-schedules'], exact: false }),
      queryClient.removeQueries({ queryKey: ['dashboard-stats'], exact: false }),
      queryClient.removeQueries({ queryKey: ['financial-bookings'], exact: false }),
      queryClient.removeQueries({ queryKey: ['recent-bookings'], exact: false }),
      queryClient.removeQueries({ queryKey: ['upcoming-classes'], exact: false })
    ]);
    
    console.log("Cache cleared for term-dependent queries");
  }, [queryClient]);

  // Fetch term data based on selected year and term number
  const { 
    data: termData, 
    isLoading: isTermLoading,
    refetch: refetchTerm
  } = useQuery({
    queryKey: ['term', selectedYear, selectedTermNumber, termSynced],
    queryFn: async () => {
      console.log(`Fetching term data for year ${selectedYear} and term ${selectedTermNumber}`);
      
      try {
        const { data, error: dbError } = await supabase
          .from('terms')
          .select(`
            id,
            term_number,
            start_date,
            end_date,
            academic_years!inner (
              year
            )
          `)
          .eq('academic_years.year', selectedYear)
          .eq('term_number', selectedTermNumber)
          .limit(1);

        if (dbError) {
          console.error('Error fetching term data:', dbError);
          setError(new Error(`Error fetching term: ${dbError.message}`));
          return null;
        }
        
        if (!data || data.length === 0) {
          console.log(`No term found for year ${selectedYear} and term ${selectedTermNumber}`);
          setError(new Error(`No term found for ${selectedYear}, Term ${selectedTermNumber}`));
          return null;
        }

        // Adjust the dates to start of first day and end of last day of the term
        const termData = data[0];
        termData.start_date = startOfDay(new Date(selectedYear, getTermMonths(selectedTermNumber as TermNumber)[0], 1)).toISOString();
        termData.end_date = endOfDay(new Date(selectedYear, getTermMonths(selectedTermNumber as TermNumber)[1] + 1, 0)).toISOString();
        
        // Track successful fetch
        setLastFetchedTerm({
          year: selectedYear,
          termNumber: selectedTermNumber,
          id: termData.id
        });
        
        setTermSynced(true);
        setIsChangingTerm(false); // Term change complete
        return termData as TermData;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error('Exception fetching term data:', err);
        setError(new Error(errorMsg));
        setIsChangingTerm(false); // Term change failed
        return null;
      }
    },
    staleTime: 30 * 1000, // Cache term data for 30 seconds
  });

  // When term data changes, invalidate and refetch relevant queries
  useEffect(() => {
    const shouldInvalidate = termData?.id && (
      termData.id !== lastFetchedTerm.id || 
      selectedYear !== lastFetchedTerm.year || 
      selectedTermNumber !== lastFetchedTerm.termNumber
    );
    
    if (shouldInvalidate) {
      console.log('Term data updated, triggering data refresh', { 
        term: termData.term_number, 
        year: selectedYear,
        id: termData.id,
        previousId: lastFetchedTerm.id || 'none'
      });
      
      // Invalidate all cached queries
      invalidateTermDependentQueries().then(() => {
        // After cache is cleared, trigger refetch of key queries
        queryClient.refetchQueries({ 
          queryKey: ['classes'],
          exact: false
        });
        
        queryClient.refetchQueries({ 
          queryKey: ['class-handlers'],
          exact: false
        });
        
        queryClient.refetchQueries({ 
          queryKey: ['dashboard-stats'],
          exact: false
        });
        
        queryClient.refetchQueries({ 
          queryKey: ['upcoming-classes'],
          exact: false
        });
        
        queryClient.refetchQueries({ 
          queryKey: ['recent-bookings'],
          exact: false
        });
        
        // Queue toast notification at end of current execution cycle
        setTimeout(() => {
          toast({
            title: `Term Changed`,
            description: `Now viewing Term ${termData.term_number}, ${selectedYear}`,
          });
        }, 0);
      });
    }
  }, [termData?.id, selectedYear, selectedTermNumber, queryClient, lastFetchedTerm, invalidateTermDependentQueries]);
  
  // Force refresh term data when selection changes
  useEffect(() => {
    if (!termSynced) {
      console.log('Forcing refetch of term data due to selection change');
      refetchTerm();
    }
  }, [selectedYear, selectedTermNumber, termSynced, refetchTerm]);

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
    isTermLoading: isTermLoading || isChangingTerm, // Include term change state in loading indicator
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

// Add a utility function to get start and end months for each term
function getTermMonths(termNumber: TermNumber): [number, number] {
  switch(termNumber) {
    case '1': return [0, 2];   // Jan, Feb, Mar
    case '2': return [3, 5];   // Apr, May, Jun
    case '3': return [6, 8];   // Jul, Aug, Sep
    case '4': return [9, 11];  // Oct, Nov, Dec
  }
}

export const useTerm = () => {
  const context = useContext(TermContext);
  if (context === undefined) {
    throw new Error('useTerm must be used within a TermProvider');
  }
  return context;
};
