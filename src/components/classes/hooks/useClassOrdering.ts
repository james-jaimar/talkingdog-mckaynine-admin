
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBranch } from "@/context/BranchContext";
import { Class } from "../types/class";
import { fetchClassOrder } from "./class-ordering/fetchClassOrder";
import { fetchSavedOrder } from "./class-ordering/fetchSavedOrder";
import { useOptimisticUpdate } from "./class-ordering/useOptimisticUpdate";
import { useSaveClassOrder } from "./class-ordering/useSaveClassOrder";

export function useClassOrdering() {
  const { currentBranch } = useBranch();
  const [orderedClasses, setOrderedClasses] = useState<Class[]>([]);
  const [pendingMovements, setPendingMovements] = useState<number>(0);
  
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

  // Move class up with debounced saving
  const moveClassUp = useCallback((index: number) => {
    if (index <= 0 || isSaving) return;
    
    // Apply optimistic update immediately
    setOrderedClasses(currentClasses => {
      const updatedClasses = moveItemOptimistically(currentClasses, index, index - 1);
      
      // Mark the moved item
      if (index < currentClasses.length) {
        markAsMoving(currentClasses[index].id);
      }
      
      return updatedClasses;
    });
    
    // Track that we have a pending save
    setPendingMovements(prev => prev + 1);
    
    // Save the changes if we're not already saving
    if (!isSaving) {
      // Use timeout to debounce rapid changes
      setTimeout(() => {
        setOrderedClasses(current => {
          const classIds = current.map(c => c.id);
          saveClassOrder(classIds);
          return current;
        });
        
        // Reset pending movements count after initiating save
        setPendingMovements(0);
      }, 300);
    }
  }, [isSaving, markAsMoving, moveItemOptimistically, saveClassOrder]);

  // Move class down with debounced saving
  const moveClassDown = useCallback((index: number) => {
    if (orderedClasses.length <= 1 || index >= orderedClasses.length - 1 || isSaving) return;
    
    // Apply optimistic update immediately
    setOrderedClasses(currentClasses => {
      const updatedClasses = moveItemOptimistically(currentClasses, index, index + 1);
      
      // Mark the moved item
      if (index < currentClasses.length) {
        markAsMoving(currentClasses[index].id);
      }
      
      return updatedClasses;
    });
    
    // Track that we have a pending save
    setPendingMovements(prev => prev + 1);
    
    // Save the changes if we're not already saving
    if (!isSaving) {
      // Use timeout to debounce rapid changes
      setTimeout(() => {
        setOrderedClasses(current => {
          const classIds = current.map(c => c.id);
          saveClassOrder(classIds);
          return current;
        });
        
        // Reset pending movements count after initiating save
        setPendingMovements(0);
      }, 300);
    }
  }, [orderedClasses.length, isSaving, markAsMoving, moveItemOptimistically, saveClassOrder]);

  // Reset moving states when saving completes
  useEffect(() => {
    if (!isSaving && orderedClasses.length > 0) {
      // Remove "moving" status from all items after a short delay
      // This gives the UI time to show the success state
      const timer = setTimeout(() => {
        orderedClasses.forEach(classItem => {
          unmarkAsMoving(classItem.id);
        });
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isSaving, orderedClasses, unmarkAsMoving]);

  // Manual order saving function
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
    pendingMovements: pendingMovements
  };
}
