
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
  }[];
}

export function useClassOrdering() {
  const { currentBranch } = useBranch();
  const { termDateRange } = useTermSelection();
  const [isMoving, setIsMoving] = useState(false);
  const [pendingMovements, setPendingMovements] = useState(0);
  const [itemMoving, setItemMoving] = useState<string | null>(null);

  // Fetch all active classes with their schedules
  const { data: originalClasses, isLoading, error, refetch } = useQuery({
    queryKey: ['classes', currentBranch?.id, termDateRange?.startDate, termDateRange?.endDate],
    queryFn: async () => {
      if (!currentBranch) return [];

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
            selected_dates
          )
        `)
        .eq('branch_id', currentBranch.id);

      // If we have term date range, filter class schedules
      if (termDateRange?.startDate && termDateRange?.endDate) {
        query = query.or(`class_schedules.start_time.gte.${termDateRange.startDate},class_schedules.start_time.is.null`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Filter class schedules to only include those within the term date range
      const filteredClasses = data?.map(classItem => {
        if (termDateRange?.startDate && termDateRange?.endDate) {
          const startDate = new Date(termDateRange.startDate);
          const endDate = new Date(termDateRange.endDate);
          
          classItem.class_schedules = classItem.class_schedules.filter(schedule => {
            if (!schedule.start_time) return true;
            const scheduleDate = new Date(schedule.start_time);
            return scheduleDate >= startDate && scheduleDate <= endDate;
          });
        }
        
        return classItem;
      });
      
      return filteredClasses || [];
    },
    enabled: !!currentBranch,
    staleTime: 60000,
  });

  // Use hook to order classes
  const { orderedClasses } = useClassTabOrder(originalClasses || [], currentBranch?.id);

  // Mock implementations for class ordering to fix type errors
  const moveClassUp = async (classId: string) => {
    setItemMoving(classId);
    setIsMoving(true);
    setPendingMovements(prev => prev + 1);
    
    // Implement actual class reordering logic here
    
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
