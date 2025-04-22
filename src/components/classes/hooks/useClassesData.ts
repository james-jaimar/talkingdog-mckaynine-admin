
import { useClassOrdering } from "./useClassOrdering";
import { useBranch } from "@/context/BranchContext";
import { useAuth } from "@/context/auth";
import { useTermSelection } from "@/hooks/useTermSelection";
import { useEffect, useMemo } from "react";

export function useClassesData() {
  const { currentBranch } = useBranch();
  const { user, session } = useAuth();
  const { termDateRange } = useTermSelection();
  
  // Use our centralized hook for class ordering and data
  const { 
    orderedClasses, 
    isLoading, 
    error,
    refetch
  } = useClassOrdering();
  
  // Refetch when term changes
  useEffect(() => {
    if (termDateRange) {
      refetch();
    }
  }, [termDateRange?.startDate, termDateRange?.endDate, refetch]);
  
  // Filter classes by term date range if available
  const filteredClasses = useMemo(() => {
    if (!termDateRange) return orderedClasses;
    
    return orderedClasses.filter(classItem => {
      // If class has no schedules, include it
      if (!classItem.class_schedules || classItem.class_schedules.length === 0) {
        return true;
      }
      
      // Check if any class schedule falls within the term date range
      return classItem.class_schedules.some(schedule => {
        const scheduleDate = new Date(schedule.start_time);
        const startDate = new Date(termDateRange.startDate);
        const endDate = new Date(termDateRange.endDate);
        
        return scheduleDate >= startDate && scheduleDate <= endDate;
      });
    });
  }, [orderedClasses, termDateRange]);
  
  // Filter to only include classes that have schedules for active classes
  const activeClasses = filteredClasses.filter(c => 
    c.class_schedules && c.class_schedules.length > 0
  );
  
  return {
    activeClasses,
    isLoading,
    hasBranch: !!currentBranch,
    isAuthenticated: !!user && !!session,
    error
  };
}
