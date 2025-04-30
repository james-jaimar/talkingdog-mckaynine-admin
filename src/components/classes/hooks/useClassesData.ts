
import { useClassOrdering } from "./useClassOrdering";
import { useBranch } from "@/context/BranchContext";
import { useAuth } from "@/context/auth";
import { useMemo } from "react";
import { ClassWithSchedules } from "./types/class-with-schedules";

export function useClassesData() {
  const { currentBranch } = useBranch();
  const { user, session } = useAuth();
  
  // Use our centralized hook for class ordering and data
  const { 
    orderedClasses, 
    isLoading, 
    error,
    refetch
  } = useClassOrdering();
  
  // Simply pass through the data without additional filtering
  // The classes are already properly filtered at the database level
  const activeClasses = useMemo<ClassWithSchedules[]>(() => {
    if (!orderedClasses || !Array.isArray(orderedClasses)) {
      return [];
    }
    
    return orderedClasses;
  }, [orderedClasses]);
  
  return {
    activeClasses,
    isLoading,
    hasBranch: !!currentBranch,
    isAuthenticated: !!user && !!session,
    error,
    refetch
  };
}
