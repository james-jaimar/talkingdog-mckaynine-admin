
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBranch } from "@/context/BranchContext";
import { Class } from "../types/class";
import { fetchClassOrder } from "./class-ordering/fetchClassOrder";
import { fetchSavedOrder } from "./class-ordering/fetchSavedOrder";
import { useOptimisticUpdate } from "./class-ordering/useOptimisticUpdate";
import { useSaveClassOrder } from "./class-ordering/useSaveClassOrder";

interface UseClassOrderingOptions {
  onOrderSaved?: () => void;
}

export function useClassOrdering(options?: UseClassOrderingOptions) {
  const { currentBranch } = useBranch();
  const [orderedClasses, setOrderedClasses] = useState<Class[]>([]);
  const [pendingMovements, setPendingMovements] = useState<{from: number, to: number}[]>([]);
  
  // Optimistic update helpers
  const { isItemMoving, moveItemOptimistically, markAsMoving, unmarkAsMoving } = useOptimisticUpdate();
  
  // Save order mutation
  const { saveClassOrder, isSaving } = useSaveClassOrder(currentBranch?.id);
  
  // Fetch classes
  const {
    data: classesData = [],
    isLoading: isLoadingClasses,
    error: classesError
  } = useQuery({
    queryKey: ['classes', currentBranch?.id],
    queryFn: () => fetchClassOrder(currentBranch?.id),
    enabled: !!currentBranch,
  });

  // Fetch saved order
  const {
    data: savedOrder,
    isLoading: isLoadingOrder,
    error: orderError,
    refetch: refetchOrder
  } = useQuery({
    queryKey: ['class-tab-order', currentBranch?.id],
    queryFn: () => fetchSavedOrder(currentBranch?.id),
    enabled: !!currentBranch,
  });

  // Initialize ordered classes
  useEffect(() => {
    if (!classesData || classesData.length === 0 || isLoadingOrder) return;
    
    let sortedClasses: Class[];
    
    if (savedOrder && savedOrder.class_ids && savedOrder.class_ids.length > 0) {
      // Create a map of classes by ID for fast lookup
      const classesById = new Map(classesData.map(c => [c.id, c]));
      
      // First include ordered classes that exist
      const orderedExists = savedOrder.class_ids
        .map(id => classesById.get(id))
        .filter(Boolean) as Class[];
      
      // Then add any classes not in the saved order
      const orderedIds = new Set(savedOrder.class_ids);
      const remainingClasses = classesData
        .filter(c => !orderedIds.has(c.id))
        .sort((a, b) => a.name.localeCompare(b.name));
      
      sortedClasses = [...orderedExists, ...remainingClasses];
    } else {
      // Default alphabetical order
      sortedClasses = [...classesData].sort((a, b) => a.name.localeCompare(b.name));
    }
    
    setOrderedClasses(sortedClasses);
  }, [classesData, savedOrder, isLoadingOrder]);

  // Process pending movements
  const processPendingMovements = useCallback(() => {
    if (pendingMovements.length === 0 || !orderedClasses.length) return;
    
    // Take the first pending movement
    const movement = pendingMovements[0];
    
    // Create new array with classes
    const newOrdered = [...orderedClasses];
    
    // Perform the move
    const [removedClass] = newOrdered.splice(movement.from, 1);
    newOrdered.splice(movement.to, 0, removedClass);
    
    // Update state
    setOrderedClasses(newOrdered);
    
    // Remove this movement from pending
    setPendingMovements(current => current.slice(1));
    
    // Save the new order
    const classIds = newOrdered.map(c => c.id);
    saveClassOrder(classIds);
  }, [orderedClasses, pendingMovements, saveClassOrder]);

  // Process pending movements when not saving
  useEffect(() => {
    if (!isSaving && pendingMovements.length > 0) {
      processPendingMovements();
    }
  }, [isSaving, pendingMovements, processPendingMovements]);

  // Move class up
  const moveClassUp = useCallback((index: number) => {
    if (index <= 0 || isSaving) return;
    
    // Mark class as moving for UI feedback
    if (index < orderedClasses.length) {
      markAsMoving(orderedClasses[index].id);
      
      // Optimistically update UI immediately
      setOrderedClasses(currentClasses => 
        moveItemOptimistically(currentClasses, index, index - 1)
      );
      
      // Add to pending movements queue
      setPendingMovements(current => [...current, { from: index, to: index - 1 }]);
      
      // Process immediately if no pending saves
      if (!isSaving && pendingMovements.length === 0) {
        const newOrder = [...orderedClasses];
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
        const classIds = newOrder.map(c => c.id);
        saveClassOrder(classIds);
      }
    }
  }, [orderedClasses, isSaving, markAsMoving, moveItemOptimistically, pendingMovements, saveClassOrder]);

  // Move class down
  const moveClassDown = useCallback((index: number) => {
    if (index >= orderedClasses.length - 1 || isSaving) return;
    
    // Mark class as moving for UI feedback
    if (index < orderedClasses.length) {
      markAsMoving(orderedClasses[index].id);
      
      // Optimistically update UI immediately
      setOrderedClasses(currentClasses => 
        moveItemOptimistically(currentClasses, index, index + 1)
      );
      
      // Add to pending movements queue
      setPendingMovements(current => [...current, { from: index, to: index + 1 }]);
      
      // Process immediately if no pending saves
      if (!isSaving && pendingMovements.length === 0) {
        const newOrder = [...orderedClasses];
        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        const classIds = newOrder.map(c => c.id);
        saveClassOrder(classIds);
      }
    }
  }, [orderedClasses, isSaving, markAsMoving, moveItemOptimistically, pendingMovements, saveClassOrder]);

  // Immediately save current order (for manual saves)
  const saveOrder = useCallback(() => {
    if (orderedClasses.length > 0) {
      const classIds = orderedClasses.map(c => c.id);
      saveClassOrder(classIds);
    }
  }, [orderedClasses, saveClassOrder]);

  const error = classesError || orderError;

  return {
    orderedClasses,
    originalClasses: classesData,
    isLoading: isLoadingClasses || isLoadingOrder,
    isMoving: isSaving,
    isItemMoving,
    error,
    moveClassUp,
    moveClassDown,
    saveOrder,
    refetch: refetchOrder,
    pendingMovements: pendingMovements.length
  };
}
