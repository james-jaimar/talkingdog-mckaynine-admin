
import { useState } from "react";
import { Class } from "../../types/class";

/**
 * Custom hook to manage optimistic updates for class ordering
 */
export function useOptimisticUpdate() {
  // Track items that are being moved
  const [movingItems, setMovingItems] = useState<Record<string, boolean>>({});

  // Mark an item as moving
  const markAsMoving = (classId: string) => {
    setMovingItems(prev => ({ ...prev, [classId]: true }));
  };

  // Remove moving status from an item
  const unmarkAsMoving = (classId: string) => {
    setMovingItems(prev => {
      const updated = { ...prev };
      delete updated[classId];
      return updated;
    });
  };

  // Check if an item is moving
  const isItemMoving = (classId: string) => {
    return !!movingItems[classId];
  };

  // Reorder classes optimistically
  const moveItemOptimistically = (
    classes: Class[],
    fromIndex: number,
    toIndex: number
  ): Class[] => {
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= classes.length || toIndex >= classes.length) {
      return [...classes];
    }

    const newList = [...classes];
    const [removed] = newList.splice(fromIndex, 1);
    newList.splice(toIndex, 0, removed);
    markAsMoving(removed.id);
    
    return newList;
  };

  return {
    moveItemOptimistically,
    markAsMoving,
    unmarkAsMoving,
    isItemMoving
  };
}
