
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";

export function useClassesTableData() {
  const { currentBranch } = useBranch();

  // Fetch all classes data
  const { data: classesData = [], isLoading: isLoadingClasses, error } = useQuery({
    queryKey: ['classes', currentBranch?.id],
    queryFn: async () => {
      try {
        if (!currentBranch) {
          return [];
        }
        
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
        
        console.log(`Fetched ${data?.length || 0} classes for branch: ${currentBranch.name}`);
        return data || [];
      } catch (error) {
        console.error("Error in classes query:", error);
        throw error;
      }
    },
    enabled: !!currentBranch,
  });

  // Fetch saved class order from database
  const { data: savedOrder, isLoading: isLoadingOrder } = useQuery({
    queryKey: ['class-tab-order', currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch) {
        return null;
      }
      
      // Get order specifically for this branch
      const { data, error } = await supabase
        .from('class_tab_order')
        .select('*')
        .eq('branch_id', currentBranch.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching class order:", error);
        return null;
      }
      
      return data;
    },
    enabled: !!currentBranch,
  });

  // Determine the ordered classes based on saved order or default to alphabetical
  const orderedClasses = (() => {
    if (!classesData || classesData.length === 0) {
      return [];
    }
    
    // If we have a saved order from database
    if (savedOrder && savedOrder.class_ids && savedOrder.class_ids.length > 0) {
      // Create a map of classes by ID for fast lookup
      const classesById = new Map(classesData.map(c => [c.id, c]));
      
      // First include ordered classes that exist in our dataset
      const orderedClasses = savedOrder.class_ids
        .map(id => classesById.get(id))
        .filter(Boolean);
      
      // Then add any classes not in the saved order
      const orderedIds = new Set(savedOrder.class_ids);
      const remainingClasses = classesData.filter(c => !orderedIds.has(c.id));
      
      return [...orderedClasses, ...remainingClasses];
    }
    
    // Default alphabetical order
    return [...classesData].sort((a, b) => a.name.localeCompare(b.name));
  })();

  // Combine loading states
  const isLoading = isLoadingClasses || isLoadingOrder;
  
  return {
    classes: classesData,
    orderedClasses,
    isLoading,
    error
  };
}
