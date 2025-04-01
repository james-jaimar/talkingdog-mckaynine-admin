
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Class } from "../types/class";

// Define interface for class tab order data
interface ClassTabOrder {
  id: string;
  user_id: string;
  branch_id: string | null;
  class_ids: string[];
  created_at: string;
  updated_at: string;
}

type ClassWithExtras = Class & { 
  branches: { name: string }, 
  class_schedules: { id: string }[] 
};

export function useClassTabOrder(
  activeClasses: ClassWithExtras[],
  branchId: string | undefined
) {
  const [orderedClasses, setOrderedClasses] = useState<ClassWithExtras[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    
    checkAuth();
  }, []);

  // Query to fetch saved class order from database
  const { data: savedOrder, isLoading: isLoadingOrder } = useQuery({
    queryKey: ['class-tab-order', branchId],
    queryFn: async () => {
      if (!isAuthenticated) return null;
      
      try {
        // Check if we have a logged in user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return null;
        }

        // Use type assertion to bypass TypeScript's type checking
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
    enabled: !!branchId && isAuthenticated === true
  });

  // Initialize ordered classes from database or default order
  useEffect(() => {
    if (!activeClasses || activeClasses.length === 0) return;
    
    // If still loading or checking authentication, don't update yet
    if (isLoadingOrder || isAuthenticated === null) return;
    
    if (isAuthenticated && savedOrder && savedOrder.class_ids && savedOrder.class_ids.length > 0) {
      // We have a saved order from the database
      const savedOrderIds = savedOrder.class_ids;
      
      // Map IDs to actual class objects and include any new classes at the end
      const existingClassIds = new Set(savedOrderIds);
      const orderedClassList = [
        // First, add classes in the saved order that still exist in activeClasses
        ...savedOrderIds
          .map(id => activeClasses.find(c => c.id === id))
          .filter(Boolean) as ClassWithExtras[],
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
  }, [activeClasses, savedOrder, isLoadingOrder, branchId, isAuthenticated]);

  return {
    orderedClasses,
    isLoadingOrder: isLoadingOrder || isAuthenticated === null,
    isAuthenticated
  };
}
