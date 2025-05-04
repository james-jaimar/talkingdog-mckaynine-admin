
import { useClassOrdering } from "./useClassOrdering";
import { useBranch } from "@/context/BranchContext";
import { useAuth } from "@/context/auth";
import { useMemo, useEffect } from "react";
import { ClassWithSchedules } from "./types/class-with-schedules";

export function useClassesData() {
  const { currentBranch } = useBranch();
  const { user, session } = useAuth();
  
  // Use our centralized hook for class ordering and data
  const { 
    orderedClasses, 
    isLoading, 
    error,
    isMoving,
    isItemMoving,
    pendingMovements,
    handleDragStart,
    handleDragEnd,
    refetch
  } = useClassOrdering();
  
  // Check for authentication and branch selection
  const isAuthenticated = !!user && !!session;
  const hasBranch = !!currentBranch;
  
  // Log status on mount and when dependencies change
  useEffect(() => {
    console.log("useClassesData status:", {
      isAuthenticated,
      hasBranch,
      branchId: currentBranch?.id,
      branchName: currentBranch?.name,
      userId: user?.id,
      classesCount: orderedClasses?.length
    });
  }, [isAuthenticated, hasBranch, currentBranch?.id, currentBranch?.name, user?.id, orderedClasses?.length]);
  
  // Simply pass through the data without additional filtering
  // The classes are already properly filtered at the database level
  const activeClasses = useMemo<ClassWithSchedules[]>(() => {
    if (!orderedClasses || !Array.isArray(orderedClasses)) {
      return [];
    }
    
    // Extra check to ensure we have valid data
    return orderedClasses.filter(cls => !!cls && typeof cls === 'object' && 'id' in cls);
  }, [orderedClasses]);
  
  return {
    activeClasses,
    isLoading,
    hasBranch,
    isAuthenticated,
    isMoving,
    isItemMoving,
    pendingMovements,
    error,
    refetch,
    handleDragStart,
    handleDragEnd
  };
}
