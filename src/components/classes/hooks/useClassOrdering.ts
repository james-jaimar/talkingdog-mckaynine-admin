import { useBranch } from "@/context/BranchContext";
import { useClassQuery } from "./class-ordering/useClassQuery";
import { useOptimisticUpdate } from "./class-ordering/useOptimisticUpdate";
import { useOrderMutations } from "./class-ordering/useOrderMutations";
import { useState, useEffect } from "react";

export function useClassOrdering() {
  const { currentBranch } = useBranch();
  const { data: originalClasses, isLoading, error, refetch } = useClassQuery();
  const { isMoving, isItemMoving, pendingMovements, markAsMoving, unmarkAsMoving } = useOptimisticUpdate();
  const mutation = useOrderMutations(currentBranch?.id);
  const [isReordering, setIsReordering] = useState(false);
  // Keep a local copy of ordered classes that we can modify optimistically
  const [orderedClasses, setOrderedClasses] = useState<any[]>([]);

  // Sync orderedClasses with originalClasses when they load or change
  useEffect(() => {
    if (originalClasses) {
      setOrderedClasses([...originalClasses]);
    }
  }, [originalClasses]);

  const handleReorder = async (sourceIndex: number, destinationIndex: number) => {
    if (!orderedClasses || isMoving || isReordering || sourceIndex === destinationIndex) return;

    setIsReordering(true);
    const movingClassId = orderedClasses[sourceIndex].id;
    markAsMoving(movingClassId);

    try {
      console.log(`Reordering class from index ${sourceIndex} to ${destinationIndex}`);
      
      // Create new array with reordered items for optimistic update
      const newOrder = [...orderedClasses];
      const [removed] = newOrder.splice(sourceIndex, 1);
      newOrder.splice(destinationIndex, 0, removed);
      
      // Update the UI immediately 
      setOrderedClasses(newOrder);
      
      // Get just the IDs for saving
      const newOrderIds = newOrder.map(c => c.id);
      console.log('New order IDs:', newOrderIds);
      
      // Save the new order to the database
      await mutation.mutateAsync(newOrderIds);
      
      // Force a refresh to ensure the server data is up to date
      await refetch();
    } catch (error) {
      console.error('Error reordering class:', error);
      // Revert to original order on error
      if (originalClasses) {
        setOrderedClasses([...originalClasses]);
      }
    } finally {
      unmarkAsMoving(movingClassId);
      setIsReordering(false);
    }
  };

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
