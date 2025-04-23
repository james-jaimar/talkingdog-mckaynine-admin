
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

type TermNumber = '1' | '2' | '3' | '4';

// Create a key for storing the selected term information in localStorage
const TERM_STORAGE_KEY = 'mckaynine-selected-term';

export function useTermSelection() {
  const queryClient = useQueryClient();
  const previousTermId = useRef<string | null>(null);
  
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
  const [forceUpdate, setForceUpdate] = useState<number>(0);

  // Force reactivity by incrementing this counter whenever selections change
  const triggerRefetch = useCallback(() => {
    setForceUpdate(prev => prev + 1);
  }, []);

  // Wrapper functions to update state and invalidate queries
  const setSelectedYear = useCallback((year: number) => {
    console.log('Setting selected year to:', year);
    setSelectedYearState(year);
    triggerRefetch();
    
    // Invalidate immediately to trigger updates
    setTimeout(() => {
      queryClient.invalidateQueries({ type: 'all' });
    }, 10);
  }, [queryClient, triggerRefetch]);
  
  const setSelectedTermNumber = useCallback((termNumber: TermNumber) => {
    console.log('Setting selected term number to:', termNumber);
    setSelectedTermNumberState(termNumber);
    triggerRefetch();
    
    // Invalidate immediately to trigger updates
    setTimeout(() => {
      queryClient.invalidateQueries({ type: 'all' });
    }, 10);
  }, [queryClient, triggerRefetch]);

  // Explicit function to invalidate all term-dependent queries
  const invalidateTermDependentQueries = useCallback(() => {
    console.log('FORCE INVALIDATING all term-dependent queries');
    
    queryClient.invalidateQueries({ type: 'all' });
    
    // Specific invalidations for important queries
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats-clients'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats-dogs'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats-classes'] });
    queryClient.invalidateQueries({ queryKey: ['recent-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['upcoming-classes'] });
    queryClient.invalidateQueries({ queryKey: ['classes'] });
    
    triggerRefetch();
  }, [queryClient, triggerRefetch]);

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

  const { data: termData, isLoading: isTermLoading, error, refetch: refetchTermData } = useQuery({
    queryKey: ['term', selectedYear, selectedTermNumber, forceUpdate],
    queryFn: async () => {
      console.log(`Fetching term data for year ${selectedYear} and term ${selectedTermNumber} (forceUpdate: ${forceUpdate})`);
      
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
    staleTime: 0, // Always fetch fresh data
    retry: false, // Don't retry on failure
  });

  // When term data changes, detect actual changes in term ID
  useEffect(() => {
    if (termData?.id && termData.id !== previousTermId.current) {
      console.log(`Term ID changed from ${previousTermId.current} to ${termData.id} - triggering updates`);
      previousTermId.current = termData.id;
      
      // Short delay to ensure state has propagated
      setTimeout(() => {
        invalidateTermDependentQueries();
      }, 10);
    }
  }, [termData?.id, invalidateTermDependentQueries]);

  // Generate years array (2025 to 2029)
  const years = Array.from({ length: 5 }, (_, i) => 2025 + i);
  
  // Generate terms array (1 to 4) with proper typing
  const terms: TermNumber[] = ['1', '2', '3', '4'];
  
  // Get date range for the selected term
  const getTermDateRange = useCallback(() => {
    if (!termData) return null;
    
    return {
      startDate: termData.start_date,
      endDate: termData.end_date
    };
  }, [termData]);

  const termDateRange = getTermDateRange();

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
