
import { useBranch } from "@/context/BranchContext";
import { useClassQuery } from "./class-ordering/useClassQuery";
import { useOptimisticUpdate } from "./class-ordering/useOptimisticUpdate";
import { useOrderMutations } from "./class-ordering/useOrderMutations";
import { useTerm } from "@/context/TermContext";
import { useQueryClient } from "@tanstack/react-query";
import { useClassOrderStore } from "./class-ordering/useClassOrderStore";
import { useDragStateManager } from "./class-ordering/useDragStateManager";
import { useTermChangeHandler } from "./class-ordering/useTermChangeHandler";
import { useDragEndHandler } from "./class-ordering/useDragEndHandler";
import { useClassOrderingLogger, logDebug } from "./class-ordering/useClassOrderingLogger";

/**
 * Main hook for class ordering functionality
 * Composes smaller, focused hooks to provide the complete functionality
 */
export function useClassOrdering() {
  const queryClient = useQueryClient();
  const { currentBranch } = useBranch();
  const { termData } = useTerm();
  const branchId = currentBranch?.id;
  
  // Fetch classes with the saved order - includes term in the query key
  const { 
    data: fetchedClasses, 
    isLoading, 
    error, 
    refetch 
  } = useClassQuery();
  
  // Optimistic update state handling
  const { 
    isMoving, 
    isItemMoving, 
    pendingMovements, 
    markAsMoving, 
    unmarkAsMoving, 
    resetMovingState 
  } = useOptimisticUpdate();
  
  // Order mutation hook
  const mutation = useOrderMutations(branchId);
  
  // State management for ordered classes
  const {
    orderedClasses,
    setOrderedClasses,
    hasInitialized,
    lastTermId,
    optimisticUpdateInProgress,
    syncClassesFromFetched,
    resetOrderStore,
    beginOptimisticUpdate,
    endOptimisticUpdate
  } = useClassOrderStore();
  
  // Drag state management
  const { isDragging, setIsDragging, handleDragStart } = useDragStateManager();
  
  // Handle term changes
  useTermChangeHandler(
    branchId,
    lastTermId,
    () => {
      resetMovingState();
      resetOrderStore();
    }
  );

  // Logging for debugging
  useClassOrderingLogger({
    branchId,
    termId: termData?.id,
    fetchedClassesCount: fetchedClasses?.length || 0,
    orderedClassesCount: orderedClasses.length,
    hasInitialized: hasInitialized.current,
    selectedTerm: termData?.termNumber,
    selectedYear: termData?.year
  });

  // Handler for drag end events
  const handleDragEnd = useDragEndHandler(
    orderedClasses,
    setOrderedClasses,
    branchId,
    mutation,
    markAsMoving,
    unmarkAsMoving,
    beginOptimisticUpdate,
    endOptimisticUpdate,
    setIsDragging
  );

  // Sync orderedClasses with fetchedClasses
  syncClassesFromFetched(fetchedClasses, isDragging);

  return {
    // Data
    originalClasses: fetchedClasses,
    orderedClasses,
    
    // Loading and error states
    isLoading,
    error,
    
    // Movement tracking
    isMoving: isMoving || mutation.isPending,
    isItemMoving,
    pendingMovements,
    
    // Actions
    handleDragStart,
    handleDragEnd,
    refetch
  };
}
