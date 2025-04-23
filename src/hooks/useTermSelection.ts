
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryClient } from '@/lib/query-client';

type TermNumber = '1' | '2' | '3' | '4';

// Create a key for storing the selected term information in localStorage
const TERM_STORAGE_KEY = 'mckaynine-selected-term';

export function useTermSelection() {
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
  const [selectedYear, setSelectedYear] = useState<number>(storedData.year);
  const [selectedTermNumber, setSelectedTermNumber] = useState<TermNumber>(storedData.termNumber as TermNumber);

  // Wrapper functions to update state and invalidate queries
  const updateSelectedYear = (year: number) => {
    setSelectedYear(year);
    // Invalidate relevant queries when term changes
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats-classes'] });
      queryClient.invalidateQueries({ queryKey: ['recent-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-classes'] });
    }, 100);
  };
  
  const updateSelectedTermNumber = (termNumber: TermNumber) => {
    setSelectedTermNumber(termNumber);
    // Invalidate relevant queries when term changes
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats-classes'] });
      queryClient.invalidateQueries({ queryKey: ['recent-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-classes'] });
    }, 100);
  };

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
    setSelectedYear: updateSelectedYear,
    selectedTermNumber,
    setSelectedTermNumber: updateSelectedTermNumber,
    termData,
    isTermLoading,
    error,
    termDateRange,
    years,
    terms,
  };
}
