import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Class } from "../types/class";
import { useAuth } from "@/context/AuthContext";

// Define interface for class tab order data
interface ClassTabOrder {
  id: string;
  user_id: string;
  branch_id: string | null;
  class_ids: string[];
  created_at: string;
  updated_at: string;
}

// Define a narrower type specifically for the active classes query
interface ClassWithSchedules {
  id: string;
  name: string;
  branches: { name: string };
  class_schedules: { id: string }[];
}

export function useClassTabOrder(
  activeClasses: ClassWithSchedules[],
  branchId: string | undefined
) {
  const [orderedClasses, setOrderedClasses] = useState<ClassWithSchedules[]>([]);
  const { user } = useAuth();

  // Query to fetch saved class order from database
  const { data: savedOrder, isLoading: isLoadingOrder } = useQuery({
    queryKey: ['class-tab-order', branchId],
    queryFn: async () => {
      if (!user) return null;
      
      try {
        const { data, error } = await (supabase
          .from('class_tab_order') as any)
          .select('*')
          .eq('user_id', user.id)
          .eq('branch_id', branchId || null)
          .maybeSingle();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is the "no rows returned" error
          console.error("Error fetching class order:", error);
          return null;
        }
        
        return data as ClassTabOrder | null;
      } catch (error) {
        console.error("Error in fetchSavedOrder:", error);
        return null;
      }
    },
    enabled: !!branchId && !!user
  });

  // Initialize ordered classes from database or default order
  useEffect(() => {
    if (!activeClasses || activeClasses.length === 0) return;
    
    // If still loading, don't update yet
    if (isLoadingOrder) return;
    
    if (user && savedOrder && savedOrder.class_ids && savedOrder.class_ids.length > 0) {
      // We have a saved order from the database
      const savedOrderIds = savedOrder.class_ids;
      
      // Map IDs to actual class objects and include any new classes at the end
      const existingClassIds = new Set(savedOrderIds);
      const orderedClassList = [
        // First, add classes in the saved order that still exist in activeClasses
        ...savedOrderIds
          .map(id => activeClasses.find(c => c.id === id))
          .filter(Boolean) as ClassWithSchedules[],
        // Then add any classes not in the saved order
        ...activeClasses.filter(c => !existingClassIds.has(c.id))
      ];
      
      setOrderedClasses(orderedClassList);
    } else {
      // If no saved order or not authenticated, use alphabetical order
      const sortedClasses = [...activeClasses].sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      setOrderedClasses(sortedClasses);
    }
  }, [activeClasses, savedOrder, isLoadingOrder, branchId, user]);

  return {
    orderedClasses,
    isLoadingOrder
  };
}
