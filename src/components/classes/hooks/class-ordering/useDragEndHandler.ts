
import { useCallback } from "react";
import { ClassWithSchedules } from "../types/class-with-schedules";
import { UseMutationResult } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";

/**
 * Hook to handle drag end operations
 */
export function useDragEndHandler(
  orderedClasses: ClassWithSchedules[],
  setOrderedClasses: (classes: ClassWithSchedules[]) => void,
  branchId: string | undefined,
  mutation: UseMutationResult<any, Error, string[]>,
  markAsMoving: (id: string) => void,
  unmarkAsMoving: (id: string) => void,
  beginOptimisticUpdate: () => number,
  endOptimisticUpdate: (timestamp: number) => void,
  setIsDragging: (isDragging: boolean) => void
) {
  // Process the completion of a drag operation
  return useCallback((sourceIndex: number, destinationIndex: number | null) => {
    console.log(`Drag ended: from ${sourceIndex} to ${destinationIndex ?? 'nowhere'}`);
    
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
      const timestamp = beginOptimisticUpdate();
      
      // Identify the moving class
      const movingClassId = orderedClasses[sourceIndex].id;
      console.log(`Reordering class ${movingClassId} from index ${sourceIndex} to ${destinationIndex}`);
      
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
          unmarkAsMoving(movingClassId);
          endOptimisticUpdate(timestamp);
        },
        onError: () => {
          unmarkAsMoving(movingClassId);
          endOptimisticUpdate(timestamp);
        }
      });
    } catch (error) {
      console.error("Error processing drag operation:", error);
      toast({
        title: "Error",
        description: "Failed to update class order",
        variant: "destructive"
      });
    } finally {
      setIsDragging(false);
    }
  }, [
    orderedClasses, 
    branchId, 
    markAsMoving,
    unmarkAsMoving, 
    mutation, 
    beginOptimisticUpdate,
    endOptimisticUpdate,
    setIsDragging,
    setOrderedClasses
  ]);
}
