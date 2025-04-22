
import { useClassOrdering } from "./useClassOrdering";
import { useBranch } from "@/context/BranchContext";
import { useAuth } from "@/context/auth";
import { useTermSelection } from "@/hooks/useTermSelection";
import { useEffect, useMemo } from "react";

export function useClassesData() {
  const { currentBranch } = useBranch();
  const { user, session } = useAuth();
  const { termData, termDateRange } = useTermSelection();
  
  // Use our centralized hook for class ordering and data
  const { 
    orderedClasses, 
    isLoading, 
    error,
    refetch
  } = useClassOrdering();
  
  // Refetch when term changes
  useEffect(() => {
    console.log("Term selection changed, refetching classes data");
    refetch();
  }, [termData?.id, refetch]);
  
  // Filter to only include classes that have schedules for active classes
  const activeClasses = useMemo(() => {
    if (!orderedClasses) return [];
    
    console.log(`Filtering ${orderedClasses.length} classes to show only active ones`);
    
    return orderedClasses.filter(c => 
      c.class_schedules && c.class_schedules.length > 0
    );
  }, [orderedClasses]);
  
  return {
    activeClasses,
    isLoading,
    hasBranch: !!currentBranch,
    isAuthenticated: !!user && !!session,
    error
  };
}
