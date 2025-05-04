
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TermContextType, TermData, TermNumber, TERM_STORAGE_KEY, TERM_CHANGE_DEBOUNCE_MS } from "./types";

// Create context with default values
const TermContext = createContext<TermContextType>({
  selectedYear: new Date().getFullYear(),
  setSelectedYear: () => {},
  selectedTermNumber: "1",
  setSelectedTermNumber: () => {},
  termData: null,
  isTermLoading: false,
  error: null,
  termDateRange: null,
  years: [],
  terms: ["1", "2", "3", "4"],
  refetchTerm: async () => null
});

export const TermProvider = ({ children }: { children: React.ReactNode }) => {
  // Set current year as default
  const currentYear = new Date().getFullYear();
  
  // Initialize from saved selection if available
  const savedSelection = localStorage.getItem(TERM_STORAGE_KEY);
  const parsedSelection = savedSelection ? JSON.parse(savedSelection) : null;
  
  // State for term selection
  const [selectedYear, setSelectedYearState] = useState<number>(parsedSelection?.year || currentYear);
  const [selectedTermNumber, setSelectedTermNumberState] = useState<TermNumber>(parsedSelection?.term || "1");
  
  // State for term data
  const [termData, setTermData] = useState<TermData | null>(null);
  const [isTermLoading, setIsTermLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [years, setYears] = useState<number[]>([currentYear, currentYear - 1, currentYear - 2]);
  
  // Add termDateRange state for convenience
  const [termDateRange, setTermDateRange] = useState<{ startDate: string; endDate: string } | null>(null);
  
  // Debounced setters to avoid excessive refetches
  const setSelectedYear = useCallback((year: number) => {
    setSelectedYearState(year);
    localStorage.setItem(TERM_STORAGE_KEY, JSON.stringify({ year, term: selectedTermNumber }));
  }, [selectedTermNumber]);
  
  const setSelectedTermNumber = useCallback((termNumber: TermNumber) => {
    setSelectedTermNumberState(termNumber);
    localStorage.setItem(TERM_STORAGE_KEY, JSON.stringify({ year: selectedYear, term: termNumber }));
  }, [selectedYear]);
  
  // Function to fetch term data
  const fetchTermData = useCallback(async () => {
    setIsTermLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching term data for Term ${selectedTermNumber}, ${selectedYear}`);
      
      // First, check if we have a specific term matching our criteria
      const { data: termData, error: termError } = await supabase
        .from('terms')
        .select(`
          id, 
          term_number,
          start_date,
          end_date,
          current,
          academic_years(year)
        `)
        .eq('term_number', selectedTermNumber)
        .eq('academic_years.year', selectedYear)
        .order('start_date', { ascending: true })
        .single();
      
      if (termError) {
        if (termError.code === 'PGRST116') {
          console.log('No term found, will check for current term');
          
          // Try to get the current term
          const { data: currentTermData, error: currentTermError } = await supabase
            .from('terms')
            .select(`
              id,
              term_number,
              start_date,
              end_date,
              current,
              academic_years(year)
            `)
            .eq('current', true)
            .single();
          
          if (currentTermError) {
            if (currentTermError.code === 'PGRST116') {
              console.log('No current term found either, will create a default date range');
              
              // If no current term, create a default date range for the selected term/year
              const defaultTermDateRange = getDefaultTermDateRange(selectedTermNumber, selectedYear);
              
              setTermData({
                id: 'default',
                term_number: selectedTermNumber,
                start_date: defaultTermDateRange.startDate,
                end_date: defaultTermDateRange.endDate,
                current: false,
                academic_years: { year: selectedYear }
              });
              
              setTermDateRange(defaultTermDateRange);
            } else {
              throw currentTermError;
            }
          } else {
            // We found the current term, use that and update the selection
            console.log('Found current term:', currentTermData);
            setTermData(currentTermData);
            
            // Update the selection to match what we found
            if (currentTermData.academic_years?.year) {
              setSelectedYearState(currentTermData.academic_years.year);
            }
            if (currentTermData.term_number) {
              setSelectedTermNumberState(currentTermData.term_number as TermNumber);
            }
            
            // Set date range
            setTermDateRange({
              startDate: currentTermData.start_date,
              endDate: currentTermData.end_date
            });
          }
        } else {
          throw termError;
        }
      } else {
        // We found the requested term
        console.log('Found requested term:', termData);
        setTermData(termData);
        
        // Set date range
        setTermDateRange({
          startDate: termData.start_date,
          endDate: termData.end_date
        });
      }
      
      // Fetch available years for the dropdown
      const { data: yearsData, error: yearsError } = await supabase
        .from('academic_years')
        .select('year')
        .order('year', { ascending: false });
      
      if (yearsError) {
        console.error('Error fetching years:', yearsError);
      } else {
        // Process years data to ensure uniqueness
        const fetchedYears = yearsData.map(y => y.year);
        
        // Always ensure current year is included
        if (!fetchedYears.includes(currentYear)) {
          fetchedYears.unshift(currentYear);
        }
        
        // Ensure uniqueness by using Set
        setYears(Array.from(new Set(fetchedYears)));
      }
    } catch (err) {
      console.error('Error in fetchTermData:', err);
      setError(err instanceof Error ? err : new Error('Unknown error fetching term data'));
    } finally {
      setIsTermLoading(false);
    }
  }, [selectedYear, selectedTermNumber]);
  
  // Helper function to get default term date range
  const getDefaultTermDateRange = (termNumber: TermNumber, year: number) => {
    // Define each term's start and end dates
    switch (termNumber) {
      case "1":
        return {
          startDate: `${year}-01-01`,
          endDate: `${year}-03-31`
        };
      case "2":
        return {
          startDate: `${year}-04-01`,
          endDate: `${year}-06-30`
        };
      case "3":
        return {
          startDate: `${year}-07-01`,
          endDate: `${year}-09-30`
        };
      case "4":
        return {
          startDate: `${year}-10-01`,
          endDate: `${year}-12-31`
        };
      default:
        return {
          startDate: `${year}-01-01`,
          endDate: `${year}-12-31`
        };
    }
  };
  
  // Fetch term data when selection changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTermData();
    }, TERM_CHANGE_DEBOUNCE_MS);
    
    return () => {
      clearTimeout(timer);
    };
  }, [selectedYear, selectedTermNumber, fetchTermData]);
  
  // Context value
  const value: TermContextType = {
    selectedYear,
    setSelectedYear,
    selectedTermNumber,
    setSelectedTermNumber,
    termData,
    isTermLoading,
    error,
    termDateRange,
    years,
    terms: ["1", "2", "3", "4"],
    refetchTerm: fetchTermData
  };
  
  return <TermContext.Provider value={value}>{children}</TermContext.Provider>;
};

// Hook for using the context
export const useTerm = () => useContext(TermContext);
