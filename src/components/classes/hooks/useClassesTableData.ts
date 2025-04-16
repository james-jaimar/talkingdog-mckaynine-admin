import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";

export function useClassesTableData(filter?: string) {
  const { currentBranch } = useBranch();
  const queryClient = useQueryClient();

  const { data: classes = [], isLoading, refetch } = useQuery({
    queryKey: ['classes', currentBranch?.id],
    queryFn: async () => {
      try {
        console.log(`Fetching classes for branch: ${currentBranch?.name || 'none'}`);
        
        if (!currentBranch) {
          console.warn("No branch selected, cannot fetch classes");
          return [];
        }
        
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
          `)
          .eq('branch_id', currentBranch.id)
          .order('name');
        
        const { data, error } = await query;
        
        if (error) {
          console.error("Error fetching classes:", error);
          throw error;
        }
        
        console.log(`Fetched ${data?.length || 0} classes for branch: ${currentBranch.name}`);
        return data || [];
      } catch (error) {
        console.error("Error in classes query:", error);
        return [];
      }
    },
    enabled: !!currentBranch, // Only run query when a branch is selected
    staleTime: 30000, // 30 seconds
  });

  // Get user's saved order
  const { data: savedOrder } = useQuery({
    queryKey: ['class-tab-order', currentBranch?.id],
    queryFn: async () => {
      try {
        if (!currentBranch) return null;
        
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
      } catch (error) {
        console.error("Error in fetchSavedOrder:", error);
        return null;
      }
    },
    enabled: !!currentBranch
  });

  // Check for manually ordered classes in the QueryClient cache
  const cachedClasses = queryClient.getQueryData(['classes', currentBranch?.id]);
  
  // Order classes based on:
  // 1. Cached ordered data (if we have it from drag operations)
  // 2. Saved database order
  // 3. Or fall back to alphabetical
  const getOrderedClasses = () => {
    if (!classes || classes.length === 0) return [];
    
    // If we have a cached version from reordering, use that
    if (cachedClasses && Array.isArray(cachedClasses) && cachedClasses !== classes) {
      return cachedClasses;
    }
    
    // Otherwise use the saved order from database
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

  const orderedClasses = getOrderedClasses();

  // Apply filter if provided
  const filteredClasses = filter 
    ? orderedClasses.filter(classItem => classItem.id === filter)
    : orderedClasses;

  return {
    classes,
    orderedClasses: filteredClasses,
    isLoading,
    refetch
  };
}
