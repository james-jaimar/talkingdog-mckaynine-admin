
import { useState } from "react";

export function useOptimisticUpdate() {
  const [movingClassIds, setMovingClassIds] = useState<Set<string>>(new Set());
  const [pendingMovements, setPendingMovements] = useState(0);
  const [isMoving, setIsMoving] = useState(false);

  const markAsMoving = (classId: string) => {
    setMovingClassIds(prev => new Set([...prev, classId]));
    setPendingMovements(prev => prev + 1);
    setIsMoving(true);
  };

  const unmarkAsMoving = (classId: string) => {
    setMovingClassIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(classId);
      return newSet;
    });
    setPendingMovements(prev => {
      const newCount = prev - 1;
      if (newCount <= 0) {
        setIsMoving(false);
      }
      return newCount;
    });
  };

  const isItemMoving = (classId: string) => movingClassIds.has(classId);

  return {
    isMoving,
    isItemMoving,
    pendingMovements,
    markAsMoving,
    unmarkAsMoving
  };
}
