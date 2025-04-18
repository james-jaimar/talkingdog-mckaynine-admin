
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBranch } from "@/context/BranchContext";
import { Class } from "../types/class";
import { useOrderMutations } from "./class-ordering/useOrderMutations";
import { fetchClassOrder } from "./class-ordering/fetchClassOrder";
import { fetchSavedOrder } from "./class-ordering/fetchSavedOrder";
import debounce from "lodash/debounce";

interface UseClassOrderingOptions {
  onOrderSaved?: () => void;
}

export function useClassOrdering(options?: UseClassOrderingOptions) {
  const { currentBranch } = useBranch();
  const [isMoving, setIsMoving] = useState(false);
  const [isOrderDirty, setIsOrderDirty] = useState(false);
  const [orderedClasses, setOrderedClasses] = useState<Class[]>([]);
  
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

  // Set up mutations
  const saveOrderToDatabase = useOrderMutations(currentBranch?.id, options?.onOrderSaved);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce((classIds: string[]) => {
      saveOrderToDatabase.mutate(classIds);
    }, 2000),
    [currentBranch?.id, saveOrderToDatabase]
  );

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
    setIsOrderDirty(false);
  }, [classesData, savedOrder, isLoadingOrder]);

  // Save order
  const saveOrder = useCallback(() => {
    if (isOrderDirty && orderedClasses.length > 0) {
      const classIds = orderedClasses.map(c => c.id);
      saveOrderToDatabase.mutate(classIds);
    }
  }, [orderedClasses, isOrderDirty, saveOrderToDatabase]);

  // Move class up
  const moveClassUp = useCallback((index: number) => {
    if (index <= 0) return;
    
    setIsMoving(true);
    setIsOrderDirty(true);
    
    setOrderedClasses(prevClasses => {
      const newOrder = [...prevClasses];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      
      const classIds = newOrder.map(c => c.id);
      debouncedSave(classIds);
      
      return newOrder;
    });
  }, [debouncedSave]);

  // Move class down
  const moveClassDown = useCallback((index: number) => {
    setOrderedClasses(prevClasses => {
      if (index >= prevClasses.length - 1) return prevClasses;
      
      setIsMoving(true);
      setIsOrderDirty(true);
      
      const newOrder = [...prevClasses];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      
      const classIds = newOrder.map(c => c.id);
      debouncedSave(classIds);
      
      return newOrder;
    });
  }, [debouncedSave]);

  const error = classesError || orderError;

  return {
    orderedClasses,
    originalClasses: classesData,
    isLoading: isLoadingClasses || isLoadingOrder,
    isMoving: isMoving || saveOrderToDatabase.isPending,
    isOrderDirty,
    error,
    moveClassUp,
    moveClassDown,
    saveOrder,
    refetch: refetchOrder
  };
}
