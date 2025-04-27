
import { useBranch } from "@/context/BranchContext";
import { useClassQuery } from "./class-ordering/useClassQuery";
import { useOptimisticUpdate } from "./class-ordering/useOptimisticUpdate";
import { useOrderMutations } from "./class-ordering/useOrderMutations";

export function useClassOrdering() {
  const { currentBranch } = useBranch();
  const { data: originalClasses, isLoading, error, refetch } = useClassQuery();
  const { isMoving, isItemMoving, pendingMovements, markAsMoving, unmarkAsMoving } = useOptimisticUpdate();
  const mutation = useOrderMutations(currentBranch?.id);

  // Move a class up in order
  const moveClassUp = async (classId: string) => {
    if (!originalClasses || isMoving) return;

    // Find the index of the class to move
    const index = originalClasses.findIndex(c => c.id === classId);
    if (index <= 0) return;

    markAsMoving(classId);

    try {
      console.log(`Moving class ${classId} up from index ${index}`);
      
      // Create a new array with the item moved up
      const newOrder = [...originalClasses];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      
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
    }
  };

  // Move a class down in order
  const moveClassDown = async (classId: string) => {
    if (!originalClasses || isMoving) return;

    // Find the index of the class to move
    const index = originalClasses.findIndex(c => c.id === classId);
    if (index < 0 || index >= originalClasses.length - 1) return;

    markAsMoving(classId);

    try {
      console.log(`Moving class ${classId} down from index ${index}`);
      
      // Create a new array with the item moved down
      const newOrder = [...originalClasses];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      
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
    }
  };

  return {
    originalClasses,
    orderedClasses: originalClasses,
    isLoading,
    isMoving,
    isItemMoving,
    error,
    moveClassUp,
    moveClassDown,
    pendingMovements,
    refetch
  };
}
