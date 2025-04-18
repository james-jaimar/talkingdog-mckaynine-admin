
import { useClassOrdering } from "./useClassOrdering";
import { useBranch } from "@/context/BranchContext";
import { useAuth } from "@/context/auth";

export function useClassesData() {
  const { currentBranch } = useBranch();
  const { user, session } = useAuth();
  
  // Use our centralized hook for class ordering and data
  const { 
    orderedClasses, 
    isLoading, 
    error 
  } = useClassOrdering();
  
  // Filter to only include classes that have schedules for active classes
  const activeClasses = orderedClasses.filter(c => 
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
