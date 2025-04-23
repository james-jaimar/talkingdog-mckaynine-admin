
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type TermNumber = '1' | '2' | '3' | '4';
const TERM_STORAGE_KEY = 'mckaynine-selected-term';

export function useTermSelection() {
  const queryClient = useQueryClient();
  
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

  // Wrapper functions to update state and persist to localStorage
  const setSelectedYear = useCallback((year: number) => {
    console.log('Setting selected year to:', year);
    setSelectedYearState(year);
    localStorage.setItem(
      TERM_STORAGE_KEY, 
      JSON.stringify({ year, termNumber: selectedTermNumber })
    );
  }, [selectedTermNumber]);
  
  const setSelectedTermNumber = useCallback((termNumber: TermNumber) => {
    console.log('Setting selected term number to:', termNumber);
    setSelectedTermNumberState(termNumber);
    localStorage.setItem(
      TERM_STORAGE_KEY, 
      JSON.stringify({ year: selectedYear, termNumber })
    );
  }, [selectedYear]);

  // Fetch term data based on selected year and term number
  const { 
    data: termData, 
    isLoading: isTermLoading,
    error
  } = useQuery({
    queryKey: ['term', selectedYear, selectedTermNumber],
    queryFn: async () => {
      console.log(`Fetching term data for year ${selectedYear} and term ${selectedTermNumber}`);
      
      const { data, error } = await supabase
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
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching term data:', error);
        return null;
      }
      
      if (!data) {
        console.log(`No term found for year ${selectedYear} and term ${selectedTermNumber}`);
        return null;
      }
      
      return data;
    },
    staleTime: 60 * 1000, // Cache term data for 60 seconds
  });

  // When term data changes, dispatch a custom event
  useEffect(() => {
    if (termData?.id) {
      console.log('Term data updated, dispatching term-changed event');
      const event = new CustomEvent('term-changed', { 
        detail: { termId: termData.id } 
      });
      window.dispatchEvent(event);
    }
  }, [termData]);

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
    termDateRange,
    years,
    terms
  };
}
