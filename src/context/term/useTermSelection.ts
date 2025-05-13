
import { useState, useEffect } from 'react';

export function useTermSelection() {
  const [selectedTermNumber, setSelectedTermNumber] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  
  // Initialize with current term if not set
  useEffect(() => {
    if (selectedTermNumber === null) {
      // Default to current term based on date
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      
      // Simple logic to determine current term
      // Terms 1: Jan-Mar, 2: Apr-Jun, 3: Jul-Sep, 4: Oct-Dec
      const currentTerm = Math.ceil(currentMonth / 3);
      
      setSelectedTermNumber(currentTerm);
      setSelectedYear(currentDate.getFullYear());
      
      console.log(`Term initialized to Term ${currentTerm}, ${currentDate.getFullYear()}`);
    }
  }, [selectedTermNumber]);
  
  return {
    selectedTermNumber,
    selectedYear,
    setSelectedTermNumber,
    setSelectedYear
  };
}
