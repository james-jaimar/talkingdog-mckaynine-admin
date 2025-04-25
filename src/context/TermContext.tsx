
import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

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

  // Wrapper functions to update state and persist to localStorage
  const setSelectedYear = useCallback((year: number) => {
    console.log('Setting selected year to:', year);
    setSelectedYearState(year);
    localStorage.setItem(
      TERM_STORAGE_KEY, 
      JSON.stringify({ year, termNumber: selectedTermNumber })
    );
    // Reset any previous errors
    setError(null);
  }, [selectedTermNumber]);
  
  const setSelectedTermNumber = useCallback((termNumber: TermNumber) => {
    console.log('Setting selected term number to:', termNumber);
    setSelectedTermNumberState(termNumber);
    localStorage.setItem(
      TERM_STORAGE_KEY, 
      JSON.stringify({ year: selectedYear, termNumber })
    );
    // Reset any previous errors
    setError(null);
  }, [selectedYear]);

  // Fetch term data based on selected year and term number
  const { 
    data: termData, 
    isLoading: isTermLoading,
    refetch: refetchTerm
  } = useQuery({
    queryKey: ['term', selectedYear, selectedTermNumber],
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

        return data[0] as TermData;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error('Exception fetching term data:', err);
        setError(new Error(errorMsg));
        return null;
      }
    },
    staleTime: 60 * 1000, // Cache term data for 60 seconds
  });

  // When term data changes, invalidate relevant queries
  useEffect(() => {
    if (termData?.id) {
      console.log('Term data updated, invalidating queries');
      
      // Invalidate specific queries that depend on term data
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: ['classes'],
          exact: false
        });
        queryClient.invalidateQueries({ 
          queryKey: ['class-handlers'],
          exact: false
        });
        queryClient.invalidateQueries({ 
          queryKey: ['dashboard-stats'], 
          exact: false
        });
        
        toast({
          title: `Term Changed`,
          description: `Now viewing Term ${termData.term_number}, ${selectedYear}`,
        });
      }, 0);
    }
  }, [termData?.id, selectedYear, queryClient]);

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
