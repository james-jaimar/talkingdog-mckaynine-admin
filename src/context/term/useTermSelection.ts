
import { useState, useCallback, useRef } from 'react';
import { 
  TermNumber, 
  TERM_STORAGE_KEY, 
  TERM_CHANGE_DEBOUNCE_MS 
} from './types';
import { getStoredTermData } from './utils';

export function useTermSelection() {
  // Initialize from localStorage if available
  const storedData = getStoredTermData();
  
  const [selectedYear, setSelectedYearState] = useState<number>(storedData.year);
  const [selectedTermNumber, setSelectedTermNumberState] = useState<TermNumber>(storedData.termNumber);
  const [error, setError] = useState<Error | null>(null);
  const [isChangingTerm, setIsChangingTerm] = useState(false);
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const changeCounter = useRef(0);
  
  // Wrapper functions to update state and persist to localStorage with debouncing
  const setSelectedYear = useCallback((year: number) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    const currentChangeId = ++changeCounter.current;
    setIsChangingTerm(true);
    setSelectedYearState(year);
    
    localStorage.setItem(
      TERM_STORAGE_KEY, 
      JSON.stringify({ year, termNumber: selectedTermNumber })
    );
    setError(null);
    
    // Use debouncing to prevent rapid consecutive changes
    debounceTimer.current = setTimeout(() => {
      // Only proceed if this is still the most recent change
      if (currentChangeId === changeCounter.current) {
        setIsChangingTerm(false);
      }
    }, TERM_CHANGE_DEBOUNCE_MS);
  }, [selectedTermNumber]);
  
  const setSelectedTermNumber = useCallback((termNumber: TermNumber) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    const currentChangeId = ++changeCounter.current;
    setIsChangingTerm(true);
    setSelectedTermNumberState(termNumber);
    
    localStorage.setItem(
      TERM_STORAGE_KEY, 
      JSON.stringify({ year: selectedYear, termNumber })
    );
    setError(null);
    
    // Use debouncing to prevent rapid consecutive changes
    debounceTimer.current = setTimeout(() => {
      // Only proceed if this is still the most recent change
      if (currentChangeId === changeCounter.current) {
        setIsChangingTerm(false);
      }
    }, TERM_CHANGE_DEBOUNCE_MS);
  }, [selectedYear]);

  return {
    selectedYear,
    setSelectedYear,
    selectedTermNumber,
    setSelectedTermNumber,
    error,
    setError,
    isChangingTerm,
    changeCounter,
  };
}
