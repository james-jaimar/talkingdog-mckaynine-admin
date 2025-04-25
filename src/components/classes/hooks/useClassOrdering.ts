
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";
import { useClassTabOrder } from "./useClassTabOrder";
import { useTerm } from "@/context/TermContext";
import { useState, useCallback } from "react";

export interface ClassWithSchedules {
  id: string;
  name: string;
  branches: { name: string };
  class_type?: string; 
  course_fee?: number;
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
  const [itemMoving, setItemMoving] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Force a refresh function
  const forceRefresh = useCallback(() => {
    console.log("Forcing class ordering refresh");
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Fetch all active classes with their schedules
  const { data: originalClasses, isLoading, error, refetch } = useQuery({
    queryKey: ['classes', currentBranch?.id, termData?.id, refreshTrigger],
    queryFn: async () => {
      if (!currentBranch) return [];

      console.log(`Fetching classes for branch: ${currentBranch.id}, term: ${termData?.id || 'none'}`);

      let query = supabase
        .from('classes')
        .select(`
          id,
          name,
          class_type,
          course_fee,
          duration,
          capacity,
          branch_id,
          branches:branch_id(name),
          class_schedules(
            id,
            start_time,
            end_time,
            term_id,
            academic_year,
            term_number,
            selected_dates,
            bookings(id, client_id, dog_id)
          )
        `)
        .eq('branch_id', currentBranch.id);
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching classes:", error);
        throw error;
      }
      
      console.log(`Retrieved ${data?.length || 0} classes before term filtering`);
      
      // Filter class schedules based on selected term
      const filteredClasses = data?.map(classItem => {
        // Make a copy of the class item
        const filteredClass = {...classItem};
        
        if (termData?.id) {
          console.log(`Filtering schedules for class ${classItem.name} by term ID ${termData.id}`);
          
          // Filter by term_id
          filteredClass.class_schedules = classItem.class_schedules.filter(schedule => 
            schedule.term_id === termData.id
          );
          
          console.log(`Class ${classItem.name} has ${filteredClass.class_schedules.length} schedules after filtering`);
        }
        
        return filteredClass;
      });
      
      // Only include classes that have schedules for the selected term
      const classesWithSchedules = termData
        ? filteredClasses?.filter(classItem => classItem.class_schedules.length > 0)
        : filteredClasses;
      
      console.log(`Filtered to ${classesWithSchedules?.length || 0} classes with schedules for term`);
      
      return classesWithSchedules || [];
    },
    enabled: !!currentBranch,
    staleTime: 30000, // 30 seconds cache time
  });

  // Use hook to order classes
  const { orderedClasses } = useClassTabOrder(originalClasses || [], currentBranch?.id);

  // Implementation for class reordering
  const moveClassUp = async (classId: string) => {
    setItemMoving(classId);
    setIsMoving(true);
    setPendingMovements(prev => prev + 1);
    
    console.log(`Moving class ${classId} up`);
    
    // In a real implementation, this would save the new order to the database
    // For now, we're just simulating the operation with a delay
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
    
    console.log(`Moving class ${classId} down`);
    
    // In a real implementation, this would save the new order to the database
    // For now, we're just simulating the operation with a delay
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
    pendingMovements,
    forceRefresh
  };
}
