
import { useState, useEffect } from 'react';

export function useTermSelection() {
  const [selectedTermNumber, setSelectedTermNumber] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  
  // Initialize with current term if not set
  useEffect(() => {
    if (selectedTermNumber === null) {
      // Default to current term based on date
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      
      // Simple logic to determine current term
      // Terms 1: Jan-Mar, 2: Apr-Jun, 3: Jul-Sep, 4: Oct-Dec
      const currentTerm = Math.ceil(currentMonth / 3).toString(); // Convert to string
      
      setSelectedTermNumber(currentTerm);
      setSelectedYear(currentDate.getFullYear());
      
      console.log(`Term initialized to Term ${currentTerm}, ${currentDate.getFullYear()}`);
    }
  }, [selectedTermNumber]);
  
  // Generate available years (current year and 2 years before/after)
  const currentYear = new Date().getFullYear();
  const years = [currentYear-2, currentYear-1, currentYear, currentYear+1, currentYear+2];
  
  // Available terms
  const terms = ['1', '2', '3', '4'];
  
  return {
    selectedTermNumber,
    selectedYear,
    setSelectedTermNumber,
    setSelectedYear,
    years,
    terms
  };
}
