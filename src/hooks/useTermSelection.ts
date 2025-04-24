
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

type TermNumber = '1' | '2' | '3' | '4';
const TERM_STORAGE_KEY = 'mckaynine-selected-term';

interface TermData {
  id: string;
  term_number: TermNumber;
  start_date: string;
  end_date: string;
  academic_years?: {
    year: number;
  };
}

export function useTermSelection() {
  const queryClient = useQueryClient();
  const eventFiredRef = useRef(false);
  
  // Initialize from localStorage if available
  const getStoredTermData = () => {
    try {
      const storedData = localStorage.getItem(TERM_STORAGE_KEY);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        return {
          year: parsed.year || 2025,
          termNumber: parsed.termNumber || '2'
        };
      }
    } catch (error) {
      console.error('Error reading term data from localStorage:', error);
    }
    return { year: 2025, termNumber: '2' as TermNumber };
  };

  const storedData = getStoredTermData();
  const [selectedYear, setSelectedYearState] = useState<number>(storedData.year);
  const [selectedTermNumber, setSelectedTermNumberState] = useState<TermNumber>(storedData.termNumber as TermNumber);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Wrapper functions to update state and persist to localStorage
  const setSelectedYear = useCallback((year: number) => {
    console.log('Setting selected year to:', year);
    setSelectedYearState(year);
    localStorage.setItem(
      TERM_STORAGE_KEY, 
      JSON.stringify({ year, termNumber: selectedTermNumber })
    );
    // Reset any previous errors
    setErrorMessage(null);
    // Invalidate queries that depend on term data
    queryClient.invalidateQueries({ queryKey: ['term'] });
  }, [selectedTermNumber, queryClient]);
  
  const setSelectedTermNumber = useCallback((termNumber: TermNumber) => {
    console.log('Setting selected term number to:', termNumber);
    setSelectedTermNumberState(termNumber);
    localStorage.setItem(
      TERM_STORAGE_KEY, 
      JSON.stringify({ year: selectedYear, termNumber })
    );
    // Reset any previous errors
    setErrorMessage(null);
    // Invalidate queries that depend on term data
    queryClient.invalidateQueries({ queryKey: ['term'] });
  }, [selectedYear, queryClient]);

  // Fetch term data based on selected year and term number
  const { 
    data: termData, 
    isLoading: isTermLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['term', selectedYear, selectedTermNumber],
    queryFn: async () => {
      console.log(`Fetching term data for year ${selectedYear} and term ${selectedTermNumber}`);
      
      try {
        const { data, error, count } = await supabase
          .from('terms')
          .select(`
            id,
            term_number,
            start_date,
            end_date,
            academic_years!inner (
              year
            )
          `, { count: 'exact' })
          .eq('academic_years.year', selectedYear)
          .eq('term_number', selectedTermNumber)
          .limit(10);

        if (error) {
          console.error('Error fetching term data:', error);
          setErrorMessage(`Error fetching term: ${error.message}`);
          return null;
        }
        
        if (!data || data.length === 0) {
          console.log(`No term found for year ${selectedYear} and term ${selectedTermNumber}`);
          setErrorMessage(`No term found for ${selectedYear}, Term ${selectedTermNumber}`);
          return null;
        }

        // Log if we got multiple results (which would be unexpected)
        if (data.length > 1) {
          console.warn(`Multiple terms (${data.length}) found for year ${selectedYear} and term ${selectedTermNumber}, using the first one`);
        }
        
        // Always use the first result if we have multiple
        return data[0] as TermData;
      } catch (err) {
        console.error('Exception fetching term data:', err);
        setErrorMessage(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        return null;
      }
    },
    staleTime: 60 * 1000, // Cache term data for 60 seconds
  });

  // When term data changes, dispatch a custom event
  useEffect(() => {
    if (termData?.id && !eventFiredRef.current) {
      console.log('Term data updated, dispatching term-changed event');
      
      // Set timeout to ensure this happens after the component has rendered
      setTimeout(() => {
        const event = new CustomEvent('term-changed', { 
          detail: { termId: termData.id, termNumber: termData.term_number, year: selectedYear } 
        });
        window.dispatchEvent(event);
        
        // Invalidate all queries that might depend on term data
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            const key = query.queryKey[0];
            return typeof key === 'string' && 
              (key.includes('class') || 
               key.includes('booking') || 
               key.includes('schedule') ||
               key.includes('dashboard'));
          }
        });
        
        // Show a toast when term changes
        toast({
          title: `Term Changed`,
          description: `Now viewing Term ${termData.term_number}, ${selectedYear}`,
        });

        eventFiredRef.current = true;
      }, 0);
    }
    
    // Reset the event fired ref when term changes
    return () => {
      if (termData?.id) {
        eventFiredRef.current = false;
      }
    };
  }, [termData, selectedYear, queryClient]);

  // Generate years array (2025 to 2029)
  const years = Array.from({ length: 5 }, (_, i) => 2025 + i);
  
  // Generate terms array (1 to 4)
  const terms: TermNumber[] = ['1', '2', '3', '4'];
  
  // Get date range for the selected term
  const termDateRange = termData ? {
    startDate: termData.start_date,
    endDate: termData.end_date
  } : null;

  return {
    selectedYear,
    setSelectedYear,
    selectedTermNumber,
    setSelectedTermNumber,
    termData,
    isTermLoading,
    error,
    errorMessage,
    termDateRange,
    years,
    terms,
    refetch
  };
}
