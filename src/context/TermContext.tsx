
import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode, useRef } from 'react';
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
const TERM_CHANGE_DEBOUNCE_MS = 500; // Debounce time in ms

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
    // Silent failure, don't log here
  }
  return { 
    year: new Date().getFullYear(), 
    termNumber: getCurrentTermNumber() 
  };
};

// Helper to get start and end months for each term
function getTermMonths(termNumber: TermNumber): [number, number] {
  switch(termNumber) {
    case '1': return [0, 2];   // Jan, Feb, Mar
    case '2': return [3, 5];   // Apr, May, Jun
    case '3': return [6, 8];   // Jul, Aug, Sep
    case '4': return [9, 11];  // Oct, Nov, Dec
  }
}

export function TermProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  
  // Initialize from localStorage if available
  const storedData = getStoredTermData();
  const [selectedYear, setSelectedYearState] = useState<number>(storedData.year);
  const [selectedTermNumber, setSelectedTermNumberState] = useState<TermNumber>(storedData.termNumber);
  const [error, setError] = useState<Error | null>(null);

  // Track last successful term data fetch to avoid redundant updates
  const lastTermId = useRef<string | undefined>(undefined);
  const [isChangingTerm, setIsChangingTerm] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const changeCounter = useRef(0);
  
  // Wrapper functions to update state and persist to localStorage with debouncing
  const setSelectedYear = useCallback((year: number) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    const currentChangeId = ++changeCounter.current;
    setIsChangingTerm(true);
    setSelectedYearState(year);
    
    localStorage.setItem(
      TERM_STORAGE_KEY, 
      JSON.stringify({ year, termNumber: selectedTermNumber })
    );
    setError(null);
    
    // Use debouncing to prevent rapid consecutive changes
    debounceTimer.current = setTimeout(() => {
      // Only proceed if this is still the most recent change
      if (currentChangeId === changeCounter.current) {
        setIsChangingTerm(false);
      }
    }, TERM_CHANGE_DEBOUNCE_MS);
  }, [selectedTermNumber]);
  
  const setSelectedTermNumber = useCallback((termNumber: TermNumber) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    const currentChangeId = ++changeCounter.current;
    setIsChangingTerm(true);
    setSelectedTermNumberState(termNumber);
    
    localStorage.setItem(
      TERM_STORAGE_KEY, 
      JSON.stringify({ year: selectedYear, termNumber })
    );
    setError(null);
    
    // Use debouncing to prevent rapid consecutive changes
    debounceTimer.current = setTimeout(() => {
      // Only proceed if this is still the most recent change
      if (currentChangeId === changeCounter.current) {
        setIsChangingTerm(false);
      }
    }, TERM_CHANGE_DEBOUNCE_MS);
  }, [selectedYear]);

  // Centralized function to invalidate all term-dependent queries with debounce control
  const invalidateTermDependentQueries = useCallback(async () => {
    // Just remove the relevant queries from cache - MORE SELECTIVE
    await Promise.all([
      queryClient.removeQueries({ queryKey: ['classes', undefined, lastTermId.current], exact: false }),
      queryClient.removeQueries({ queryKey: ['class-schedules', lastTermId.current], exact: false }),
      queryClient.removeQueries({ queryKey: ['dashboard-stats', undefined, lastTermId.current], exact: false })
    ]);
  }, [queryClient, lastTermId]);

  // Fetch term data based on selected year and term number
  const { 
    data: termData, 
    isLoading: isFetchingTerm,
    refetch: refetchTerm
  } = useQuery({
    queryKey: ['term', selectedYear, selectedTermNumber],
    queryFn: async () => {
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
          setError(new Error(`Error fetching term: ${dbError.message}`));
          return null;
        }
        
        if (!data || data.length === 0) {
          setError(new Error(`No term found for ${selectedYear}, Term ${selectedTermNumber}`));
          return null;
        }

        // Adjust the dates to start of first day and end of last day of the term
        const termData = data[0];
        termData.start_date = startOfDay(new Date(selectedYear, getTermMonths(selectedTermNumber)[0], 1)).toISOString();
        termData.end_date = endOfDay(new Date(selectedYear, getTermMonths(selectedTermNumber)[1] + 1, 0)).toISOString();
        
        // Track the term ID to detect changes
        lastTermId.current = termData.id;
        
        return termData as TermData;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(new Error(errorMsg));
        return null;
      }
    },
    staleTime: 30 * 1000, // Cache term data for 30 seconds
  });

  // Calculate the real loading state (either fetching or changing term)
  const isTermLoading = isFetchingTerm || isChangingTerm;

  // When term data changes, invalidate and refetch relevant queries
  useEffect(() => {
    if (!termData?.id) return;
    
    // Only invalidate queries when a term is actually changed
    if (termData?.id !== lastTermId.current && !isChangingTerm) {
      // Update lastTermId to prevent repeated invalidations
      lastTermId.current = termData.id;
      
      // Invalidate queries for the new term and trigger refetch
      invalidateTermDependentQueries().then(() => {
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
