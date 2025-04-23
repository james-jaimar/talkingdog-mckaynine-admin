
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type TermNumber = '1' | '2' | '3' | '4';

// Create a key for storing the selected term information in localStorage
const TERM_STORAGE_KEY = 'mckaynine-selected-term';

export function useTermSelection() {
  const queryClient = useQueryClient();
  const termChangeEventRef = useRef<CustomEvent | null>(null);
  
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
    
    try {
      localStorage.setItem(
        TERM_STORAGE_KEY, 
        JSON.stringify({ year: year, termNumber: selectedTermNumber })
      );
    } catch (error) {
      console.error('Error saving year to localStorage:', error);
    }
  }, [selectedTermNumber]);
  
  const setSelectedTermNumber = useCallback((termNumber: TermNumber) => {
    console.log('Setting selected term number to:', termNumber);
    setSelectedTermNumberState(termNumber);
    
    try {
      localStorage.setItem(
        TERM_STORAGE_KEY, 
        JSON.stringify({ year: selectedYear, termNumber: termNumber })
      );
    } catch (error) {
      console.error('Error saving term number to localStorage:', error);
    }
  }, [selectedYear]);

  // Fetch term data based on selected year and term number
  const { 
    data: termData, 
    isLoading: isTermLoading, 
    error, 
    refetch: refetchTermData 
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
        .single();

      if (error) {
        console.error('Error fetching term data:', error);
        return null;
      }
      
      if (!data) {
        console.log(`No term found for year ${selectedYear} and term ${selectedTermNumber}`);
        return null;
      }
      
      console.log('Term data fetched successfully:', data);
      return data;
    },
    staleTime: 60 * 1000, // Cache term data for 60 seconds
  });
  
  // When term data changes, invalidate specific dependent queries
  useEffect(() => {
    if (termData?.id) {
      console.log('Term data updated, invalidating specific dependent queries');
      
      // Create a custom event to signal term change
      if (!termChangeEventRef.current) {
        termChangeEventRef.current = new CustomEvent('term-changed', { 
          detail: { termId: termData.id } 
        });
        window.dispatchEvent(termChangeEventRef.current);
      }
      
      // Only invalidate specific queries that depend on term
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats-classes'] });
      queryClient.invalidateQueries({ queryKey: ['recent-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-classes'] });
    }
  }, [termData, queryClient]);

  // Generate years array (2025 to 2029)
  const years = Array.from({ length: 5 }, (_, i) => 2025 + i);
  
  // Generate terms array (1 to 4) with proper typing
  const terms: TermNumber[] = ['1', '2', '3', '4'];
  
  // Get date range for the selected term
  const termDateRange = termData ? {
    startDate: termData.start_date,
    endDate: termData.end_date
  } : null;

  // Function to invalidate term-dependent queries in a controlled way
  const invalidateTermDependentQueries = useCallback(() => {
    console.log('Invalidating term-dependent queries in a controlled manner');
    
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats-classes'] });
    queryClient.invalidateQueries({ queryKey: ['recent-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['upcoming-classes'] });
  }, [queryClient]);

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
    terms,
    invalidateTermDependentQueries,
    refetchTermData
  };
}
