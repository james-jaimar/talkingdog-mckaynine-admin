
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type TermNumber = '1' | '2' | '3' | '4';

// Create a key for storing the selected term information in localStorage
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

  // Wrapper functions to update state and invalidate queries - completely rewritten for better reactivity
  const setSelectedYear = useCallback((year: number) => {
    console.log('Setting selected year to:', year);
    setSelectedYearState(year);
    
    // Invalidate immediately to trigger updates
    queryClient.invalidateQueries({ type: 'all' });
  }, [queryClient]);
  
  const setSelectedTermNumber = useCallback((termNumber: TermNumber) => {
    console.log('Setting selected term number to:', termNumber);
    setSelectedTermNumberState(termNumber);
    
    // Invalidate immediately to trigger updates
    queryClient.invalidateQueries({ type: 'all' });
  }, [queryClient]);

  // Explicit function to invalidate all term-dependent queries
  const invalidateTermDependentQueries = useCallback(() => {
    console.log('Invalidating all term-dependent queries');
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats-clients'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats-dogs'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats-classes'] });
    queryClient.invalidateQueries({ queryKey: ['recent-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['upcoming-classes'] });
  }, [queryClient]);

  // Save to localStorage when selections change
  useEffect(() => {
    try {
      localStorage.setItem(
        TERM_STORAGE_KEY, 
        JSON.stringify({ year: selectedYear, termNumber: selectedTermNumber })
      );
    } catch (error) {
      console.error('Error saving term data to localStorage:', error);
    }
  }, [selectedYear, selectedTermNumber]);

  const { data: termData, isLoading: isTermLoading, error } = useQuery({
    queryKey: ['term', selectedYear, selectedTermNumber],
    queryFn: async () => {
      console.log(`Fetching term data for year ${selectedYear} and term ${selectedTermNumber}`);
      
      // Use proper filter syntax for Supabase
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
        .eq('term_number', selectedTermNumber);

      if (error) {
        console.error('Error fetching term data:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log(`No term found for year ${selectedYear} and term ${selectedTermNumber}`);
        return null;
      }
      
      console.log('Term data fetched successfully:', data[0]);
      return data[0];
    },
    staleTime: 60000, // 1 minute cache
  });

  // When term data changes, invalidate all dependent queries
  useEffect(() => {
    if (termData) {
      console.log('Term data changed, invalidating all dependent queries');
      invalidateTermDependentQueries();
    }
  }, [termData, invalidateTermDependentQueries]);

  // Generate years array (2025 to 2029)
  const years = Array.from({ length: 5 }, (_, i) => 2025 + i);
  
  // Generate terms array (1 to 4) with proper typing
  const terms: TermNumber[] = ['1', '2', '3', '4'];
  
  // Get date range for the selected term
  const getTermDateRange = () => {
    if (!termData) return null;
    
    return {
      startDate: termData.start_date,
      endDate: termData.end_date
    };
  };

  const termDateRange = getTermDateRange();
  
  console.log('Current term selection:', { 
    selectedYear, 
    selectedTermNumber, 
    termData, 
    dateRange: termDateRange 
  });

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
    invalidateTermDependentQueries
  };
}
