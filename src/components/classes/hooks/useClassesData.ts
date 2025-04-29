
import { useClassOrdering } from "./useClassOrdering";
import { useBranch } from "@/context/BranchContext";
import { useAuth } from "@/context/auth";
import { useTerm } from "@/context/TermContext";
import { useEffect, useMemo, useState } from "react";

export function useClassesData() {
  const { currentBranch } = useBranch();
  const { user, session } = useAuth();
  const { termData, selectedTermNumber, selectedYear } = useTerm();
  const [forceRefresh, setForceRefresh] = useState(0);
  
  // Use our centralized hook for class ordering and data
  const { 
    orderedClasses, 
    isLoading, 
    error,
    refetch
  } = useClassOrdering();
  
  // Refetch classes when the term changes
  useEffect(() => {
    console.log("Term selection changed in useClassesData, refetching", {
      termId: termData?.id,
      termNumber: selectedTermNumber,
      year: selectedYear,
      forceRefresh
    });
    
    // Force a refetch when term data changes
    refetch().then(() => {
      console.log("Classes refetched after term change");
      // Increment force refresh counter to trigger derived state updates
      setForceRefresh(prev => prev + 1);
    });
  }, [
    termData?.id, 
    selectedTermNumber, 
    selectedYear, 
    refetch
  ]);
  
  // For active classes, filter to show only those with schedules for the current term
  const activeClasses = useMemo(() => {
    if (!orderedClasses) return [];
    
    console.log(`Filtering ${orderedClasses.length} classes for active classes with term: ${termData?.id || 'none'}`);
    
    if (!termData?.id) {
      // If no term is selected, show all classes that have any schedules
      return orderedClasses.filter(c => c.class_schedules && c.class_schedules.length > 0);
    }
    
    // With term: show classes that have schedules for this term
    return orderedClasses.filter(c => 
      c.class_schedules && c.class_schedules.some(s => s.term_id === termData.id)
    );
  }, [orderedClasses, termData?.id, forceRefresh]);
  
  return {
    activeClasses,
    allClasses: orderedClasses, // Provide access to all classes (even without schedules)
    isLoading,
    hasBranch: !!currentBranch,
    isAuthenticated: !!user && !!session,
    error,
    refetch
  };
}
