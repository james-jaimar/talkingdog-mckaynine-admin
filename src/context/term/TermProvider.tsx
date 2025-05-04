
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TermContextType, TermData, TermNumber, TERM_STORAGE_KEY, TERM_CHANGE_DEBOUNCE_MS } from "./types";
import { calculateTermDateRange, getStoredTermData } from "./utils";

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
  // Initialize from saved selection if available
  const storedData = getStoredTermData();
  
  // State for term selection
  const [selectedYear, setSelectedYearState] = useState<number>(storedData.year);
  const [selectedTermNumber, setSelectedTermNumberState] = useState<TermNumber>(storedData.termNumber);
  
  // State for term data
  const [termData, setTermData] = useState<TermData | null>(null);
  const [isTermLoading, setIsTermLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [years, setYears] = useState<number[]>([new Date().getFullYear()]);
  
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
      
      // If no exact term data found, use default date ranges
      if (termError || !termData) {
        console.log('No specific term found, using default date ranges');
        
        // Create a default term data based on the selected term/year
        const defaultTermDateRange = calculateTermDateRange(selectedYear, selectedTermNumber);
        
        setTermData({
          id: `default-${selectedYear}-${selectedTermNumber}`,
          term_number: selectedTermNumber,
          start_date: defaultTermDateRange.startDate,
          end_date: defaultTermDateRange.endDate,
          current: false,
          academic_years: { year: selectedYear }
        });
        
        setTermDateRange(defaultTermDateRange);
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
        // Process years data
        let availableYears = yearsData.map(y => y.year);
        const currentYear = new Date().getFullYear();
        
        // Always ensure current year is included
        if (!availableYears.includes(currentYear)) {
          availableYears.push(currentYear);
        }
        
        // Sort years in descending order
        availableYears.sort((a, b) => b - a);
        
        // Ensure uniqueness by using Set
        setYears(Array.from(new Set(availableYears)));
      }
    } catch (err) {
      console.error('Error in fetchTermData:', err);
      setError(err instanceof Error ? err : new Error('Unknown error fetching term data'));
    } finally {
      setIsTermLoading(false);
    }
  }, [selectedYear, selectedTermNumber]);
  
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
