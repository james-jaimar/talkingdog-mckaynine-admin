import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";
import { useClassTabOrder } from "./useClassTabOrder";
import { useTermSelection } from "@/hooks/useTermSelection";
import { useState } from "react";
import { Class } from "../types/class";

export interface ClassWithSchedules {
  id: string;
  name: string;
  branches: { name: string };
  class_type?: string; 
  course_fee?: number;
  class_schedules: {
    id: string;
    start_time?: string;
    end_time?: string;
    selected_dates?: string[];
    term_id?: string;
  }[];
}

export function useClassOrdering() {
  const { currentBranch } = useBranch();
  const { termData } = useTermSelection();
  const [isMoving, setIsMoving] = useState(false);
  const [pendingMovements, setPendingMovements] = useState(0);
  const [itemMoving, setItemMoving] = useState<string | null>(null);

  // Fetch all active classes with their schedules
  const { data: originalClasses, isLoading, error, refetch } = useQuery({
    queryKey: ['classes', currentBranch?.id, termData?.id],
    queryFn: async () => {
      if (!currentBranch) return [];

      console.log("Fetching classes for branch:", currentBranch.id, "and term:", termData?.id);

      let query = supabase
        .from('classes')
        .select(`
          id,
          name,
          class_type,
          course_fee,
          branch_id,
          branches:branch_id(name),
          class_schedules(
            id,
            start_time,
            end_time,
            selected_dates,
            term_id
          )
        `)
        .eq('branch_id', currentBranch.id);

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Filter class schedules to only include those for the selected term
      const filteredClasses = data?.map(classItem => {
        classItem.class_schedules = classItem.class_schedules.filter(schedule => {
          // If no term is selected, show all schedules
          if (!termData?.id) return true;
          // Otherwise, only show schedules for the selected term
          return schedule.term_id === termData.id;
        });
        
        return classItem;
      });
      
      // Only include classes that have schedules for the selected term
      const classesWithSchedules = filteredClasses?.filter(
        classItem => classItem.class_schedules.length > 0
      );
      
      console.log("Filtered classes:", classesWithSchedules?.length);
      
      return classesWithSchedules || [];
    },
    enabled: !!currentBranch,
    staleTime: 60000,
  });

  // Use hook to order classes
  const { orderedClasses } = useClassTabOrder(originalClasses || [], currentBranch?.id);

  // Implementation for class ordering
  const moveClassUp = async (classId: string) => {
    setItemMoving(classId);
    setIsMoving(true);
    setPendingMovements(prev => prev + 1);
    
    // Implement actual class reordering logic here
    console.log(`Moving class ${classId} up`);
    
    setTimeout(() => {
      setItemMoving(null);
      setIsMoving(false);
      setPendingMovements(prev => prev - 1);
    }, 500);
  };

  const moveClassDown = async (classId: string) => {
    setItemMoving(classId);
    setIsMoving(true);
    setPendingMovements(prev => prev + 1);
    
    // Implement actual class reordering logic here
    console.log(`Moving class ${classId} down`);
    
    setTimeout(() => {
      setItemMoving(null);
      setIsMoving(false);
      setPendingMovements(prev => prev - 1);
    }, 500);
  };

  const isItemMoving = (classId: string) => {
    return itemMoving === classId;
  };

  return {
    orderedClasses,
    originalClasses,
    isLoading,
    isMoving,
    isItemMoving,
    error,
    refetch,
    moveClassUp,
    moveClassDown,
    pendingMovements
  };
}
