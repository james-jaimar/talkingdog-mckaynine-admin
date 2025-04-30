
import { useBranch } from "@/context/BranchContext";
import { useClassQuery } from "./class-ordering/useClassQuery";
import { useOptimisticUpdate } from "./class-ordering/useOptimisticUpdate";
import { useOrderMutations } from "./class-ordering/useOrderMutations";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "@/components/ui/use-toast";
import { useTerm } from "@/context/TermContext";
import { ClassWithSchedules } from "./types/class-with-schedules";
import { useQueryClient } from "@tanstack/react-query";

// Enable this for detailed debug logs, should be false in production
const DEBUG_LOGGING = false;

/**
 * Log utility function for conditional logging
 */
const logDebug = (...args: any[]) => {
  if (DEBUG_LOGGING) {
    console.log(...args);
  }
};

export function useClassOrdering() {
  const queryClient = useQueryClient();
  const { currentBranch } = useBranch();
  const { termData, selectedTermNumber, selectedYear } = useTerm();
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
  
  // Local state for ordered classes
  const [orderedClasses, setOrderedClasses] = useState<ClassWithSchedules[]>([]);
  
  // State tracking
  const [isDragging, setIsDragging] = useState(false);
  const hasInitialized = useRef(false);
  const lastTermId = useRef<string | undefined>(termData?.id);
  const lastReorderTimestamp = useRef(0);
  const optimisticUpdateInProgress = useRef(false);
  
  // Debug logging for state changes - only if needed
  useEffect(() => {
    logDebug("useClassOrdering state:", { 
      branchId,
      termId: termData?.id,
      fetchedClassesCount: fetchedClasses?.length || 0,
      orderedClassesCount: orderedClasses.length,
      hasInitialized: hasInitialized.current,
      selectedTerm: selectedTermNumber,
      selectedYear
    });
  }, [branchId, termData?.id, fetchedClasses, orderedClasses, selectedTermNumber, selectedYear]);
  
  // Reset when term changes to get fresh data
  useEffect(() => {
    if (termData?.id !== lastTermId.current) {
      logDebug("Term changed in useClassOrdering, resetting state", { 
        from: lastTermId.current, 
        to: termData?.id,
        selectedTerm: selectedTermNumber,
        selectedYear
      });
      
      // Clear all local state
      hasInitialized.current = false;
      optimisticUpdateInProgress.current = false;
      resetMovingState();
      lastTermId.current = termData?.id;
      
      // Reset the ordered classes array
      setOrderedClasses([]);
      
      // Reset the query cache for classes, more selective reset
      queryClient.invalidateQueries({
        queryKey: ['classes', branchId, lastTermId.current],
        exact: true
      });
    }
  }, [
    termData?.id, 
    resetMovingState, 
    queryClient,
    selectedTermNumber,
    selectedYear,
    branchId
  ]);

  // Sync orderedClasses with fetchedClasses - improved efficiency
  useEffect(() => {
    // Only update if:
    // 1. We have fetched classes
    // 2. Either we haven't initialized yet or we're not in the middle of a drag/optimistic update
    if (fetchedClasses && (!hasInitialized.current || (!isDragging && !optimisticUpdateInProgress.current))) {
      logDebug("Syncing ordered classes from fetched data", {
        count: fetchedClasses.length,
        isDragging,
        optimisticUpdate: optimisticUpdateInProgress.current,
        hasInitialized: hasInitialized.current,
        termId: termData?.id
      });
      
      // Compare if arrays are different before setting state
      const areArraysDifferent = 
        orderedClasses.length !== fetchedClasses.length || 
        JSON.stringify(orderedClasses.map(c => c.id)) !== JSON.stringify(fetchedClasses.map(c => c.id));
        
      if (areArraysDifferent) {
        // Create a new array reference to ensure React detects the change
        setOrderedClasses([...fetchedClasses]);
        hasInitialized.current = true;
      }
    }
  }, [fetchedClasses, isDragging, termData?.id, orderedClasses]);
  
  // Handle the start of drag operations
  const handleDragStart = useCallback(() => {
    logDebug("Drag started");
    setIsDragging(true);
  }, []);
  
  // Process the completion of a drag operation
  const handleDragEnd = useCallback((sourceIndex: number, destinationIndex: number | null) => {
    logDebug(`Drag ended: from ${sourceIndex} to ${destinationIndex ?? 'nowhere'}`);
    
    // If no valid destination, just cancel the drag
    if (destinationIndex === null || sourceIndex === destinationIndex) {
      setIsDragging(false);
      return;
    }
    
    if (!orderedClasses || !branchId) {
      console.error("Cannot reorder: missing classes or branch ID");
      setIsDragging(false);
      return;
    }
    
    try {
      // Track this operation
      const now = Date.now();
      lastReorderTimestamp.current = now;
      optimisticUpdateInProgress.current = true;
      
      // Identify the moving class
      const movingClassId = orderedClasses[sourceIndex].id;
      logDebug(`Reordering class ${movingClassId} from index ${sourceIndex} to ${destinationIndex}`);
      
      markAsMoving(movingClassId);
      
      // Create new array with reordered items
      const newOrder = Array.from(orderedClasses);
      const [removed] = newOrder.splice(sourceIndex, 1);
      newOrder.splice(destinationIndex, 0, removed);
      
      // Apply optimistic update immediately
      setOrderedClasses(newOrder);
      
      // Get the IDs for saving to database
      const newOrderIds = newOrder.map(c => c.id);
      
      // Save the new order
      mutation.mutate(newOrderIds, {
        onSuccess: () => {
          // Only unmark if this is still the most recent reorder
          if (lastReorderTimestamp.current === now) {
            unmarkAsMoving(movingClassId);
            // Wait before allowing fetchedClasses to overwrite our optimistic update
            setTimeout(() => {
              if (lastReorderTimestamp.current === now) {
                optimisticUpdateInProgress.current = false;
              }
            }, 1000);
          }
        },
        onError: () => {
          if (lastReorderTimestamp.current === now) {
            unmarkAsMoving(movingClassId);
            optimisticUpdateInProgress.current = false;
          }
        }
      });
    } catch (error) {
      console.error("Error processing drag operation:", error);
      toast({
        title: "Error",
        description: "Failed to update class order",
        variant: "destructive"
      });
      resetMovingState();
      optimisticUpdateInProgress.current = false;
    } finally {
      setIsDragging(false);
    }
  }, [
    orderedClasses, 
    branchId, 
    markAsMoving,
    unmarkAsMoving, 
    mutation, 
    resetMovingState
  ]);

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
