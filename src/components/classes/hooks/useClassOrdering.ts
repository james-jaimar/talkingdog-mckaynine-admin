
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useBranch } from "@/context/BranchContext";
import { useTerm } from "@/context/TermContext";

export interface ClassWithSchedules {
  id: string;
  name: string;
  branches: { name: string };
  class_type?: string;
  course_fee?: number;
  enrollment_fee?: number;
  mckaynine_commission_type?: 'percentage' | 'amount';
  mckaynine_commission_value?: number;
  admin_fee_type?: 'percentage' | 'amount';
  admin_fee_value?: number;
  trainer_fee_type?: 'percentage' | 'amount';
  trainer_fee_value?: number;
  duration?: number;
  capacity?: number;
  class_schedules: {
    id: string;
    start_time?: string;
    end_time?: string;
    selected_dates?: string[];
    term_id?: string;
    bookings?: {
      id: string;
    }[];
  }[];
}

export function useClassOrdering() {
  const { currentBranch } = useBranch();
  const { termData } = useTerm();
  const [isMoving, setIsMoving] = useState(false);
  const [pendingMovements, setPendingMovements] = useState(0);
  const [movingClassIds, setMovingClassIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Fetch classes with their schedules
  const { data: originalClasses, isLoading, error, refetch } = useQuery({
    queryKey: ['classes', currentBranch?.id, termData?.id],
    queryFn: async () => {
      if (!currentBranch?.id) return [];

      console.log('Fetching classes for branch:', currentBranch.id, 'and term:', termData?.id);
      
      // Build the base query
      const query = supabase
        .from('classes')
        .select(`
          id, 
          name, 
          class_type,
          course_fee,
          enrollment_fee,
          mckaynine_commission_type,
          mckaynine_commission_value,
          admin_fee_type,
          admin_fee_value,
          trainer_fee_type,
          trainer_fee_value,
          duration,
          capacity,
          branches(name),
          class_schedules(
            id, 
            start_time, 
            end_time, 
            selected_dates,
            term_id,
            bookings(id)
          )
        `)
        .eq('branch_id', currentBranch.id);

      // If term is selected, filter class schedules by term
      if (termData?.id) {
        query.contains('class_schedules', [{ term_id: termData.id }]);
      }

      const { data, error } = await query.order('name');

      if (error) {
        console.error('Error fetching classes:', error);
        throw error;
      }
      
      console.log(`Fetched ${data?.length || 0} classes for term ${termData?.id || 'none'}`);
      return data as ClassWithSchedules[];
    },
    enabled: !!currentBranch?.id,
  });

  // Fetch saved class order
  const { data: classTabOrder } = useQuery({
    queryKey: ['class-tab-order', currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch?.id) return null;

      const { data, error } = await supabase
        .from('class_tab_order')
        .select('class_ids')
        .eq('branch_id', currentBranch.id)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not Found error code
          console.error('Error fetching class order:', error);
        }
        return null;
      }

      return data;
    },
    enabled: !!currentBranch?.id,
  });

  // Reorder classes based on saved order
  const orderedClasses = (() => {
    if (!originalClasses || originalClasses.length === 0) {
      return [];
    }

    // If we have a saved order, use it to sort
    if (classTabOrder && classTabOrder.class_ids && classTabOrder.class_ids.length > 0) {
      // Create a map for quick lookup
      const classMap = new Map(originalClasses.map(c => [c.id, c]));
      
      // Start with classes in the saved order
      const ordered: ClassWithSchedules[] = [];
      
      // Add classes in the saved order first
      classTabOrder.class_ids.forEach(id => {
        const classItem = classMap.get(id);
        if (classItem) {
          ordered.push(classItem);
          classMap.delete(id);
        }
      });
      
      // Then add any remaining classes not in the saved order
      classMap.forEach(classItem => {
        ordered.push(classItem);
      });
      
      return ordered;
    }
    
    // Otherwise, return original order
    return originalClasses;
  })();

  // Save the current class order to the database
  const saveOrder = async (classIds: string[]) => {
    if (!currentBranch?.id) return;

    try {
      const { error } = await supabase
        .from('class_tab_order')
        .upsert(
          { branch_id: currentBranch.id, class_ids: classIds },
          { onConflict: 'branch_id' }
        );

      if (error) {
        console.error('Error saving class order:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to save class order:', error);
      throw error;
    }
  };

  // Move a class up in order
  const moveClassUp = async (classId: string) => {
    if (!orderedClasses || isMoving) return;

    // Find the index of the class to move
    const index = orderedClasses.findIndex(c => c.id === classId);
    if (index <= 0) return; // Can't move up if it's the first item

    setIsMoving(true);
    setMovingClassIds(prev => new Set([...prev, classId]));
    setPendingMovements(prev => prev + 1);

    try {
      // Create a new array with the item moved up
      const newOrder = [...orderedClasses];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      
      // Get just the IDs for saving
      const newOrderIds = newOrder.map(c => c.id);
      
      // Optimistically update the cache
      queryClient.setQueryData(['class-tab-order', currentBranch?.id], { class_ids: newOrderIds });
      
      // Save the new order
      await saveOrder(newOrderIds);
      
      // Refetch to ensure data consistency
      await queryClient.invalidateQueries({ queryKey: ['class-tab-order', currentBranch?.id] });
    } catch (error) {
      console.error('Error moving class up:', error);
    } finally {
      setMovingClassIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(classId);
        return newSet;
      });
      setPendingMovements(prev => prev - 1);
      if (pendingMovements <= 1) {
        setIsMoving(false);
      }
    }
  };

  // Move a class down in order
  const moveClassDown = async (classId: string) => {
    if (!orderedClasses || isMoving) return;

    // Find the index of the class to move
    const index = orderedClasses.findIndex(c => c.id === classId);
    if (index < 0 || index >= orderedClasses.length - 1) return; // Can't move down if it's the last item

    setIsMoving(true);
    setMovingClassIds(prev => new Set([...prev, classId]));
    setPendingMovements(prev => prev + 1);

    try {
      // Create a new array with the item moved down
      const newOrder = [...orderedClasses];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      
      // Get just the IDs for saving
      const newOrderIds = newOrder.map(c => c.id);
      
      // Optimistically update the cache
      queryClient.setQueryData(['class-tab-order', currentBranch?.id], { class_ids: newOrderIds });
      
      // Save the new order
      await saveOrder(newOrderIds);
      
      // Refetch to ensure data consistency
      await queryClient.invalidateQueries({ queryKey: ['class-tab-order', currentBranch?.id] });
    } catch (error) {
      console.error('Error moving class down:', error);
    } finally {
      setMovingClassIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(classId);
        return newSet;
      });
      setPendingMovements(prev => prev - 1);
      if (pendingMovements <= 1) {
        setIsMoving(false);
      }
    }
  };

  // Check if a specific class is currently being moved
  const isItemMoving = (classId: string) => {
    return movingClassIds.has(classId);
  };

  return {
    originalClasses,
    orderedClasses,
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
