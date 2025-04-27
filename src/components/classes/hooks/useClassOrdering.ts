
import { useBranch } from "@/context/BranchContext";
import { useClassQuery } from "./class-ordering/useClassQuery";
import { useOptimisticUpdate } from "./class-ordering/useOptimisticUpdate";
import { useOrderMutations } from "./class-ordering/useOrderMutations";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "@/components/ui/use-toast";
import { useTerm } from "@/context/TermContext";
import { ClassWithSchedules } from "./types/class-with-schedules";

export function useClassOrdering() {
  const { currentBranch } = useBranch();
  const { termData } = useTerm();
  const { data: originalClasses, isLoading, error, refetch } = useClassQuery();
  const { 
    isMoving, 
    isItemMoving, 
    pendingMovements, 
    markAsMoving, 
    unmarkAsMoving, 
    resetMovingState 
  } = useOptimisticUpdate();
  const mutation = useOrderMutations(currentBranch?.id);
  
  // Reordering state
  const [isReordering, setIsReordering] = useState(false);
  const [orderedClasses, setOrderedClasses] = useState<ClassWithSchedules[]>([]);
  
  // Tracking state
  const hasInitialized = useRef(false);
  const lastTermId = useRef<string | undefined>(termData?.id);
  const isDragging = useRef(false);
  const lastReorderTimestamp = useRef(0);
  
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
      resetMovingState();
      lastTermId.current = termData?.id;
    }
  }, [termData?.id, resetMovingState]);

  // Sync orderedClasses with originalClasses when they load or change
  useEffect(() => {
    // Only update if we have original classes and either:
    // 1. We haven't initialized yet
    // 2. We're not currently in the middle of a reordering operation
    // 3. We're not currently dragging
    if (originalClasses && 
        (!hasInitialized.current || (!isReordering && !isDragging.current))) {
      console.log("Syncing ordered classes from original classes", {
        count: originalClasses.length,
        isReordering,
        isDragging: isDragging.current,
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
    
    if (sourceIndex === destinationIndex) {
      console.log("Source and destination indices are the same, ignoring");
      return;
    }
    
    if (isReordering) {
      console.log("Already reordering, ignoring request");
      return;
    }

    try {
      setIsReordering(true);
      isDragging.current = false;
      const now = Date.now();
      lastReorderTimestamp.current = now;
      
      const movingClassId = orderedClasses[sourceIndex].id;
      markAsMoving(movingClassId);
      
      console.log(`Reordering class from index ${sourceIndex} to ${destinationIndex}`, {
        movingClassId,
        totalClasses: orderedClasses.length,
        timestamp: now
      });
      
      // Create new array with reordered items for optimistic update
      const newOrder = [...orderedClasses];
      const [removed] = newOrder.splice(sourceIndex, 1);
      newOrder.splice(destinationIndex, 0, removed);
      
      // Update the UI immediately with our optimistic update
      setOrderedClasses(newOrder);
      
      // Get just the IDs for saving
      const newOrderIds = newOrder.map(c => c.id);
      console.log('New order IDs to save:', newOrderIds);
      
      // Save the new order to the database
      await mutation.mutateAsync(newOrderIds);
      
      // We won't refetch immediately as that could cause UI flicker
      console.log("Reordering successful, optimistic update applied", {timestamp: now});
      
      // Check if this is still the most recent reorder operation
      if (lastReorderTimestamp.current === now) {
        unmarkAsMoving(movingClassId);
      }
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
      resetMovingState();
    } finally {
      setIsReordering(false);
    }
  }, [orderedClasses, isReordering, markAsMoving, unmarkAsMoving, mutation, originalClasses, resetMovingState]);

  const handleDragStart = useCallback(() => {
    isDragging.current = true;
    console.log("Drag started");
  }, []);
  
  const handleDragEnd = useCallback((sourceIndex: number, destinationIndex: number | null) => {
    console.log(`Drag ended: from ${sourceIndex} to ${destinationIndex}`);
    if (destinationIndex !== null && sourceIndex !== destinationIndex) {
      handleReorder(sourceIndex, destinationIndex);
    } else {
      isDragging.current = false;
    }
  }, [handleReorder]);

  return {
    originalClasses,
    orderedClasses: orderedClasses.length > 0 ? orderedClasses : originalClasses,
    isLoading,
    isMoving: isMoving || isReordering,
    isItemMoving,
    error,
    handleReorder,
    handleDragStart,
    handleDragEnd,
    pendingMovements,
    refetch
  };
}
