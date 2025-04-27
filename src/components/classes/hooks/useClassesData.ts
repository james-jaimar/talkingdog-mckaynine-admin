
import { useClassOrdering } from "./useClassOrdering";
import { useBranch } from "@/context/BranchContext";
import { useAuth } from "@/context/auth";
import { useTerm } from "@/context/TermContext";
import { useEffect, useMemo } from "react";
import { ClassWithSchedules } from "./types/class-with-schedules";

export function useClassesData() {
  const { currentBranch } = useBranch();
  const { user, session } = useAuth();
  const { termData } = useTerm();
  
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
    
    console.log(`Filtering ${orderedClasses.length} classes to show only active ones with term: ${termData?.id}`);
    
    // Since we've already filtered schedules by term in useClassQuery,
    // we just need to filter out classes with no schedules
    return orderedClasses.filter((c: ClassWithSchedules) => 
      c.class_schedules && c.class_schedules.length > 0
    );
  }, [orderedClasses, termData?.id]);
  
  return {
    activeClasses,
    isLoading,
    hasBranch: !!currentBranch,
    isAuthenticated: !!user && !!session,
    error
  };
}
