
import { useClassOrdering } from "./useClassOrdering";
import { useBranch } from "@/context/BranchContext";
import { useAuth } from "@/context/auth";
import { useTerm } from "@/context/TermContext";
import { useMemo } from "react";

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
  
  // Now this is simpler - we're already filtering at the database level
  // This is just for additional filtering or transformations as needed
  const activeClasses = useMemo(() => {
    if (!orderedClasses) return [];
    
    console.log(`Using ${orderedClasses.length} pre-filtered classes for term: ${termData?.id || 'none'}`);
    
    // The classes are already filtered by term at the database level
    // Just ensure we have valid classes with schedules
    return orderedClasses.filter(c => c.class_schedules && c.class_schedules.length > 0);
  }, [orderedClasses, termData?.id]);
  
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
