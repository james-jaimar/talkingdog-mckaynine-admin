import { useBranch } from "@/context/BranchContext";
import { useClassQuery } from "./class-ordering/useClassQuery";
import { useOptimisticUpdate } from "./class-ordering/useOptimisticUpdate";
import { useOrderMutations } from "./class-ordering/useOrderMutations";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "@/components/ui/use-toast";
import { useTerm } from "@/context/TermContext";

export function useClassOrdering() {
  const { currentBranch } = useBranch();
  const { termData } = useTerm();
  const { data: originalClasses, isLoading, error, refetch } = useClassQuery();
  const { isMoving, isItemMoving, pendingMovements, markAsMoving, unmarkAsMoving } = useOptimisticUpdate();
  const mutation = useOrderMutations(currentBranch?.id);
  const [isReordering, setIsReordering] = useState(false);
  
  // Keep a local copy of ordered classes that we can modify optimistically
  const [orderedClasses, setOrderedClasses] = useState<any[]>([]);
  
  // Use refs to track state changes and prevent unnecessary resets
  const hasInitialized = useRef(false);
  const lastTermId = useRef<string | undefined>(termData?.id);
  
  console.log("useClassOrdering: Current state", { 
    hasInitialized: hasInitialized.current,
    originalClassesCount: originalClasses?.length || 0,
    orderedClassesCount: orderedClasses.length,
    isReordering,
    isMoving,
    pendingMovements,
    termId: termData?.id,
    lastTermId: lastTermId.current
  });
  
  // Reset ordering when term changes
  useEffect(() => {
    if (termData?.id !== lastTermId.current) {
      console.log("Term changed, resetting ordered classes", { 
        from: lastTermId.current, 
        to: termData?.id 
      });
      hasInitialized.current = false;
      lastTermId.current = termData?.id;
    }
  }, [termData?.id]);

  // Sync orderedClasses with originalClasses when they load or change
  useEffect(() => {
    // Only update if we have original classes and either:
    // 1. We haven't initialized yet
    // 2. We're not currently in the middle of a reordering operation
    if (originalClasses && (!hasInitialized.current || !isReordering)) {
      console.log("Syncing ordered classes from original classes", {
        count: originalClasses.length,
        isReordering,
        hasInitialized: hasInitialized.current
      });
      
      setOrderedClasses([...originalClasses]);
      hasInitialized.current = true;
    }
  }, [originalClasses, isReordering]);

  const handleReorder = useCallback(async (sourceIndex: number, destinationIndex: number) => {
    if (!orderedClasses || orderedClasses.length === 0) {
      console.log("Cannot reorder: No ordered classes available");
      return;
    }
    
    if (isMoving || isReordering) {
      console.log("Already reordering, ignoring request");
      return;
    }
    
    if (sourceIndex === destinationIndex) {
      console.log("Source and destination indices are the same, ignoring");
      return;
    }

    try {
      setIsReordering(true);
      const movingClassId = orderedClasses[sourceIndex].id;
      markAsMoving(movingClassId);
      
      console.log(`Reordering class from index ${sourceIndex} to ${destinationIndex}`, {
        movingClassId,
        totalClasses: orderedClasses.length
      });
      
      // Create new array with reordered items for optimistic update
      const newOrder = [...orderedClasses];
      const [removed] = newOrder.splice(sourceIndex, 1);
      newOrder.splice(destinationIndex, 0, removed);
      
      // Update the UI immediately with our optimistic update
      setOrderedClasses(newOrder);
      
      // Get just the IDs for saving
      const newOrderIds = newOrder.map(c => c.id);
      console.log('New order IDs:', newOrderIds);
      
      // Save the new order to the database
      await mutation.mutateAsync(newOrderIds);
      
      // We won't refetch immediately as that could cause UI flicker
      console.log("Reordering successful, optimistic update applied");
    } catch (error) {
      console.error('Error reordering class:', error);
      // Revert to original order on error
      if (originalClasses) {
        console.log("Error occurred, reverting to original order");
        setOrderedClasses([...originalClasses]);
      }
      toast({
        title: "Reordering failed",
        description: "Could not save the new class order",
        variant: "destructive"
      });
    } finally {
      if (orderedClasses.length > sourceIndex) {
        unmarkAsMoving(orderedClasses[sourceIndex].id);
      }
      setIsReordering(false);
    }
  }, [orderedClasses, isMoving, isReordering, markAsMoving, unmarkAsMoving, mutation, originalClasses]);

  return {
    originalClasses,
    orderedClasses: orderedClasses.length > 0 ? orderedClasses : originalClasses,
    isLoading,
    isMoving: isMoving || isReordering,
    isItemMoving,
    error,
    handleReorder,
    pendingMovements,
    refetch
  };
}
