
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

  const { data: termData, isLoading: isTermLoading } = useQuery({
    queryKey: ['term', selectedYear, selectedTermNumber],
    queryFn: async () => {
      // Instead of using .single(), we'll use .eq() and handle the results manually
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
      
      // Return the first matching term
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

  return {
    selectedYear,
    setSelectedYear,
    selectedTermNumber,
    setSelectedTermNumber,
    termData,
    isTermLoading,
    termDateRange: getTermDateRange(),
    years,
    terms,
  };
}
