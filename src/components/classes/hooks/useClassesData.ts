
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
  
  // Filter classes by term at the application level as a safety check
  // The primary filtering should happen at the database level in useClassQuery
  const activeClasses = useMemo(() => {
    if (!orderedClasses) return [];
    
    console.log(`Using ${orderedClasses.length} pre-filtered classes for term: ${termData?.id || 'none'}`);
    
    // Classes should already be filtered by term at the database level
    // Just ensure we have valid classes with schedules for rendering
    return orderedClasses.filter(c => {
      // Safety check: ensure class has schedules
      if (!c.class_schedules || c.class_schedules.length === 0) return false;
      
      // If we have a term selected, validate the class schedules match this term
      if (termData?.id) {
        // Double-check that at least one schedule belongs to the current term
        return c.class_schedules.some(schedule => schedule.term_id === termData.id);
      }
      
      return true;
    });
  }, [orderedClasses, termData?.id]);
  
  return {
    activeClasses,
    isLoading,
    hasBranch: !!currentBranch,
    isAuthenticated: !!user && !!session,
    error,
    refetch
  };
}
