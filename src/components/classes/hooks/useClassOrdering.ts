
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

  // Move a class up in order
  const moveClassUp = async (classId: string) => {
    if (!originalClasses || isMoving || isReordering) return;

    // Find the index of the class to move
    const index = originalClasses.findIndex(c => c.id === classId);
    if (index <= 0) return;

    setIsReordering(true);
    markAsMoving(classId);

    try {
      console.log(`Moving class ${classId} up from index ${index}`);
      
      // Create a new array with the item moved up
      const newOrder = [...originalClasses];
      const temp = newOrder[index];
      newOrder[index] = newOrder[index - 1];
      newOrder[index - 1] = temp;
      
      // Get just the IDs for saving
      const newOrderIds = newOrder.map(c => c.id);
      console.log('New order IDs:', newOrderIds);
      
      // Save the new order
      await mutation.mutateAsync(newOrderIds);
      
      // Force a refresh to ensure the UI reflects the new order
      await refetch();
    } catch (error) {
      console.error('Error moving class up:', error);
    } finally {
      unmarkAsMoving(classId);
      setIsReordering(false);
    }
  };

  // Move a class down in order
  const moveClassDown = async (classId: string) => {
    if (!originalClasses || isMoving || isReordering) return;

    // Find the index of the class to move
    const index = originalClasses.findIndex(c => c.id === classId);
    if (index < 0 || index >= originalClasses.length - 1) return;

    setIsReordering(true);
    markAsMoving(classId);

    try {
      console.log(`Moving class ${classId} down from index ${index}`);
      
      // Create a new array with the item moved down
      const newOrder = [...originalClasses];
      const temp = newOrder[index];
      newOrder[index] = newOrder[index + 1];
      newOrder[index + 1] = temp;
      
      // Get just the IDs for saving
      const newOrderIds = newOrder.map(c => c.id);
      console.log('New order IDs:', newOrderIds);
      
      // Save the new order
      await mutation.mutateAsync(newOrderIds);
      
      // Force a refresh to ensure the UI reflects the new order
      await refetch();
    } catch (error) {
      console.error('Error moving class down:', error);
    } finally {
      unmarkAsMoving(classId);
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
    moveClassUp,
    moveClassDown,
    pendingMovements,
    refetch
  };
}
