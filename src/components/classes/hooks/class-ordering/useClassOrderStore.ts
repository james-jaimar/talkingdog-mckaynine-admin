
import { useState, useRef, useCallback } from "react";
import { ClassWithSchedules } from "../types/class-with-schedules";

/**
 * Hook for managing the ordered classes state
 */
export function useClassOrderStore() {
  // Local state for ordered classes
  const [orderedClasses, setOrderedClasses] = useState<ClassWithSchedules[]>([]);
  const hasInitialized = useRef(false);
  const lastTermId = useRef<string | undefined>(undefined);
  const lastReorderTimestamp = useRef(0);
  const optimisticUpdateInProgress = useRef(false);
  
  // Sync orderedClasses with fetchedClasses
  const syncClassesFromFetched = useCallback((
    fetchedClasses: ClassWithSchedules[] | undefined,
    isDragging: boolean
  ) => {
    if (fetchedClasses && (!hasInitialized.current || (!isDragging && !optimisticUpdateInProgress.current))) {
      // Compare if arrays are different before setting state
      const areArraysDifferent = 
        orderedClasses.length !== fetchedClasses.length || 
        JSON.stringify(orderedClasses.map(c => c.id)) !== JSON.stringify(fetchedClasses.map(c => c.id));
        
      if (areArraysDifferent) {
        // Create a new array reference to ensure React detects the change
        setOrderedClasses([...fetchedClasses]);
        hasInitialized.current = true;
      }
    }
  }, [orderedClasses]);

  // Reset ordered classes state
  const resetOrderStore = useCallback(() => {
    hasInitialized.current = false;
    optimisticUpdateInProgress.current = false;
    setOrderedClasses([]);
  }, []);

  const beginOptimisticUpdate = useCallback(() => {
    const timestamp = Date.now();
    lastReorderTimestamp.current = timestamp;
    optimisticUpdateInProgress.current = true;
    return timestamp;
  }, []);
  
  const endOptimisticUpdate = useCallback((timestamp: number) => {
    if (lastReorderTimestamp.current === timestamp) {
      setTimeout(() => {
        if (lastReorderTimestamp.current === timestamp) {
          optimisticUpdateInProgress.current = false;
        }
      }, 1000);
    }
  }, []);
  
  return {
    orderedClasses,
    setOrderedClasses,
    hasInitialized,
    lastTermId,
    optimisticUpdateInProgress,
    syncClassesFromFetched,
    resetOrderStore,
    beginOptimisticUpdate,
    endOptimisticUpdate
  };
}
