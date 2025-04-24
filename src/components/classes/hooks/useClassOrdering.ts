
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";
import { useClassTabOrder } from "./useClassTabOrder";
import { useTermSelection } from "@/hooks/useTermSelection";
import { useState, useEffect, useCallback } from "react";

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
  const { termData } = useTermSelection();
  const [isMoving, setIsMoving] = useState(false);
  const [pendingMovements, setPendingMovements] = useState(0);
  const [itemMoving, setItemMoving] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Listen for term changes and update
  useEffect(() => {
    const handleTermChange = (event: CustomEvent<{termId: string}>) => {
      console.log("ClassOrdering detected term change, refreshing with term ID:", event.detail.termId);
      setRefreshTrigger(prev => prev + 1);
    };
    
    window.addEventListener('term-changed', handleTermChange as EventListener);
    return () => window.removeEventListener('term-changed', handleTermChange as EventListener);
  }, []);

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

      console.log("Fetching classes for branch:", currentBranch.id, "and term:", termData?.id);

      const { data, error } = await supabase
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
            selected_dates,
            bookings(id)
          )
        `)
        .eq('branch_id', currentBranch.id);
      
      if (error) {
        console.error("Error fetching classes:", error);
        throw error;
      }
      
      console.log("Retrieved classes:", data?.length || 0);
      
      // Filter class schedules to only include those for the selected term
      const filteredClasses = data?.map(classItem => {
        if (termData?.id) {
          console.log(`Filtering schedules for class ${classItem.name} by term ${termData.id}`);
          classItem.class_schedules = classItem.class_schedules.filter(schedule => {
            return schedule.term_id === termData.id;
          });
        }
        
        return classItem;
      });
      
      // Only include classes that have schedules for the selected term
      // if there is a term filter applied
      const classesWithSchedules = termData?.id 
        ? filteredClasses?.filter(classItem => classItem.class_schedules.length > 0)
        : filteredClasses;
      
      console.log("Filtered classes with schedules for term:", classesWithSchedules?.length);
      
      return classesWithSchedules || [];
    },
    enabled: !!currentBranch,
    staleTime: 30000, // 30 seconds cache time to prevent excessive refetching
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
