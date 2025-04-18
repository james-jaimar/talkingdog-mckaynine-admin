
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useBranch } from "@/context/BranchContext";
import { Class } from "../types/class";
import debounce from "lodash/debounce";

interface UseClassOrderingOptions {
  onOrderSaved?: () => void;
}

/**
 * Hook for managing class ordering
 * This is the single source of truth for class order in the application
 */
export function useClassOrdering(options?: UseClassOrderingOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentBranch } = useBranch();
  const [isMoving, setIsMoving] = useState(false);
  const [isOrderDirty, setIsOrderDirty] = useState(false);
  const [orderedClasses, setOrderedClasses] = useState<Class[]>([]);
  
  // Fetch all classes from the database
  const {
    data: classesData = [],
    isLoading: isLoadingClasses,
    error: classesError
  } = useQuery({
    queryKey: ['classes', currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch) return [];
      
      try {
        const { data, error } = await supabase
          .from('classes')
          .select(`
            *,
            branches:branch_id (
              name
            ),
            class_schedules:class_schedules (
              id,
              bookings:bookings (
                id
              )
            )
          `)
          .eq('branch_id', currentBranch.id);
        
        if (error) {
          console.error("Error fetching classes:", error);
          throw error;
        }
        
        return data || [];
      } catch (error) {
        console.error("Error in classes query:", error);
        throw error;
      }
    },
    enabled: !!currentBranch,
  });

  // Fetch saved class order from database
  const {
    data: savedOrder,
    isLoading: isLoadingOrder,
    error: orderError,
    refetch: refetchOrder
  } = useQuery({
    queryKey: ['class-tab-order', currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch) return null;
      
      try {
        const { data, error } = await supabase
          .from('class_tab_order')
          .select('*')
          .eq('branch_id', currentBranch.id)
          .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching class order:", error);
          throw error;
        }
        
        return data;
      } catch (error) {
        console.error("Error fetching order:", error);
        throw error;
      }
    },
    enabled: !!currentBranch,
  });

  // Save class order to database (debounced to prevent too many requests)
  const saveOrderToDatabase = useMutation({
    mutationFn: async (classIds: string[]) => {
      if (!currentBranch) {
        throw new Error("No branch selected");
      }

      console.log("Saving class order to database:", classIds);

      try {
        // First check if an order already exists
        const { data: existingOrder, error: checkError } = await supabase
          .from('class_tab_order')
          .select('id')
          .eq('branch_id', currentBranch.id)
          .maybeSingle();
          
        if (checkError && checkError.code !== 'PGRST116') {
          console.error("Error checking order existence:", checkError);
          throw checkError;
        }

        if (existingOrder) {
          // Update existing order
          const { error: updateError } = await supabase
            .from('class_tab_order')
            .update({ class_ids: classIds })
            .eq('id', existingOrder.id);
            
          if (updateError) {
            console.error("Error updating class order:", updateError);
            throw updateError;
          }
        } else {
          // Create new order
          const { error: insertError } = await supabase
            .from('class_tab_order')
            .insert({
              branch_id: currentBranch.id,
              class_ids: classIds
            });
            
          if (insertError) {
            console.error("Error creating class order:", insertError);
            throw insertError;
          }
        }
        
        return classIds;
      } catch (error) {
        console.error("Database operation failed:", error);
        throw error;
      }
    },
    onSuccess: () => {
      setIsOrderDirty(false);
      toast({
        title: "Order saved",
        description: "Class order has been saved successfully.",
      });
      
      // Refresh data
      refetchOrder();
      queryClient.invalidateQueries({ queryKey: ['class-tab-order', currentBranch?.id] });
      
      if (options?.onOrderSaved) {
        options.onOrderSaved();
      }
    },
    onError: (error) => {
      console.error("Failed to save class order:", error);
      toast({
        title: "Save failed",
        description: "Failed to save class order. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsMoving(false);
    }
  });

  // Debounced save function to prevent multiple rapid saves
  const debouncedSave = useCallback(
    debounce((classIds: string[]) => {
      saveOrderToDatabase.mutate(classIds);
    }, 2000),
    [currentBranch?.id, saveOrderToDatabase]
  );

  // Initialize ordered classes based on saved order or default order
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
      
      // Then add any classes not in the saved order (alphabetically)
      const orderedIds = new Set(savedOrder.class_ids);
      const remainingClasses = classesData
        .filter(c => !orderedIds.has(c.id))
        .sort((a, b) => a.name.localeCompare(b.name));
      
      sortedClasses = [...orderedExists, ...remainingClasses];
    } else {
      // Default alphabetical order if no saved order exists
      sortedClasses = [...classesData].sort((a, b) => a.name.localeCompare(b.name));
    }
    
    setOrderedClasses(sortedClasses);
    setIsOrderDirty(false);
  }, [classesData, savedOrder, isLoadingOrder]);

  // Save function that can be called directly (not debounced)
  const saveOrder = useCallback(() => {
    if (isOrderDirty && orderedClasses.length > 0) {
      const classIds = orderedClasses.map(c => c.id);
      saveOrderToDatabase.mutate(classIds);
    }
  }, [orderedClasses, isOrderDirty, saveOrderToDatabase]);

  // Move class up in the order
  const moveClassUp = useCallback((index: number) => {
    if (index <= 0) return; // Already at the top
    
    setIsMoving(true);
    setIsOrderDirty(true);
    
    // Create a new array with the swapped items
    setOrderedClasses(prevClasses => {
      const newOrder = [...prevClasses];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      
      // Trigger a debounced save
      const classIds = newOrder.map(c => c.id);
      debouncedSave(classIds);
      
      return newOrder;
    });
  }, [debouncedSave]);

  // Move class down in the order
  const moveClassDown = useCallback((index: number) => {
    setOrderedClasses(prevClasses => {
      if (index >= prevClasses.length - 1) return prevClasses; // Already at the bottom
      
      setIsMoving(true);
      setIsOrderDirty(true);
      
      // Create a new array with the swapped items
      const newOrder = [...prevClasses];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      
      // Trigger a debounced save
      const classIds = newOrder.map(c => c.id);
      debouncedSave(classIds);
      
      return newOrder;
    });
  }, [debouncedSave]);

  // Check for any error 
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
    saveOrder, // Force an immediate save
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['classes', currentBranch?.id] });
      queryClient.invalidateQueries({ queryKey: ['class-tab-order', currentBranch?.id] });
    }
  };
}
