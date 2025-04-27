
import { useState, useCallback } from "react";

export function useOptimisticUpdate() {
  const [movingClassIds, setMovingClassIds] = useState<Set<string>>(new Set());
  const [pendingMovements, setPendingMovements] = useState(0);
  const [isMoving, setIsMoving] = useState(false);

  const markAsMoving = useCallback((classId: string) => {
    console.log(`Marking class ${classId} as moving`);
    setMovingClassIds(prev => new Set([...prev, classId]));
    setPendingMovements(prev => prev + 1);
    setIsMoving(true);
  }, []);

  const unmarkAsMoving = useCallback((classId: string) => {
    console.log(`Unmarking class ${classId} as moving`);
    setMovingClassIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(classId);
      return newSet;
    });
    setPendingMovements(prev => {
      const newCount = Math.max(0, prev - 1); 
      if (newCount === 0) {
        setIsMoving(false);
      }
      return newCount;
    });
  }, []);

  const resetMovingState = useCallback(() => {
    console.log("Resetting all moving state");
    setMovingClassIds(new Set());
    setPendingMovements(0);
    setIsMoving(false);
  }, []);

  const isItemMoving = useCallback((classId: string) => 
    movingClassIds.has(classId), [movingClassIds]);

  return {
    isMoving,
    isItemMoving,
    pendingMovements,
    markAsMoving,
    unmarkAsMoving,
    resetMovingState
  };
}
