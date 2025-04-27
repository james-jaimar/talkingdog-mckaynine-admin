
import { useBranch } from "@/context/BranchContext";
import { useClassQuery } from "./class-ordering/useClassQuery";
import { useOptimisticUpdate } from "./class-ordering/useOptimisticUpdate";
import { useOrderMutations } from "./class-ordering/useOrderMutations";
import { useState } from "react";

export function useClassOrdering() {
  const { currentBranch } = useBranch();
  const { data: originalClasses, isLoading, error, refetch } = useClassQuery();
  const { isMoving, isItemMoving, pendingMovements, markAsMoving, unmarkAsMoving } = useOptimisticUpdate();
  const mutation = useOrderMutations(currentBranch?.id);
  const [isReordering, setIsReordering] = useState(false);

  const handleReorder = async (sourceIndex: number, destinationIndex: number) => {
    if (!originalClasses || isMoving || isReordering) return;

    setIsReordering(true);
    const movingClassId = originalClasses[sourceIndex].id;
    markAsMoving(movingClassId);

    try {
      console.log(`Reordering class from index ${sourceIndex} to ${destinationIndex}`);
      
      // Create new array with reordered items
      const newOrder = [...originalClasses];
      const [removed] = newOrder.splice(sourceIndex, 1);
      newOrder.splice(destinationIndex, 0, removed);
      
      // Get just the IDs for saving
      const newOrderIds = newOrder.map(c => c.id);
      console.log('New order IDs:', newOrderIds);
      
      // Save the new order
      await mutation.mutateAsync(newOrderIds);
      
      // Force a refresh to ensure the UI reflects the new order
      await refetch();
    } catch (error) {
      console.error('Error reordering class:', error);
    } finally {
      unmarkAsMoving(movingClassId);
      setIsReordering(false);
    }
  };

  return {
    originalClasses,
    orderedClasses: originalClasses,
    isLoading,
    isMoving: isMoving || isReordering,
    isItemMoving,
    error,
    handleReorder,
    pendingMovements,
    refetch
  };
}
