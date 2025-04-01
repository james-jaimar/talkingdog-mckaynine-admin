
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";

export function useClassesTableData(filter?: string) {
  const { currentBranch } = useBranch();

  const { data: classes, isLoading, refetch } = useQuery({
    queryKey: ['classes', currentBranch?.id],
    queryFn: async () => {
      let query = supabase
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
        `);
      
      // Filter by branch if one is selected
      if (currentBranch) {
        query = query.eq('branch_id', currentBranch.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as any[];
    },
    enabled: !!currentBranch // Only run query when a branch is selected
  });

  // Get user's saved order
  const { data: savedOrder } = useQuery({
    queryKey: ['class-tab-order', currentBranch?.id],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase
          .from('class_tab_order') as any)
          .select('*')
          .eq('user_id', 'current-user-id')
          .eq('branch_id', currentBranch?.id || null)
          .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching class order:", error);
          return null;
        }
        
        return data;
      } catch (error) {
        console.error("Error in fetchSavedOrder:", error);
        return null;
      }
    },
    enabled: !!currentBranch
  });

  // Order classes based on saved order or alphabetically
  const getOrderedClasses = () => {
    if (!classes) return [];
    
    if (savedOrder && savedOrder.class_ids && savedOrder.class_ids.length > 0) {
      // First include ordered classes, then any others not in the order
      const orderedIds = new Set(savedOrder.class_ids);
      const orderedClasses = [
        ...savedOrder.class_ids
          .map(id => classes.find(c => c.id === id))
          .filter(Boolean),
        ...classes.filter(c => !orderedIds.has(c.id))
      ];
      return orderedClasses;
    }
    
    // Default alphabetical order
    return [...classes].sort((a, b) => a.name.localeCompare(b.name));
  };

  let orderedClasses = getOrderedClasses();

  // Apply filter if provided
  if (filter) {
    orderedClasses = orderedClasses.filter(classItem => 
      classItem.id === filter
    );
  }

  return {
    classes,
    orderedClasses,
    isLoading,
    refetch
  };
}
