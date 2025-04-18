
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";

export function useClassesTableData(filter?: string) {
  const { currentBranch } = useBranch();
  const queryClient = useQueryClient();

  const { data: classes = [], isLoading, error, refetch } = useQuery({
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
          .eq('branch_id', currentBranch.id);
        
        const { data, error } = await query;
        
        if (error) {
          console.error("Error fetching classes:", error);
          throw error;
        }
        
        console.log(`Fetched ${data?.length || 0} classes for branch: ${currentBranch.name}`);
        return data || [];
      } catch (error) {
        console.error("Error in classes query:", error);
        throw error; // Ensure error is thrown to be caught by React Query
      }
    },
    enabled: !!currentBranch, // Only run query when a branch is selected
    staleTime: 30000, // 30 seconds
  });

  // Get saved order
  const { data: savedOrder, isLoading: isLoadingOrder } = useQuery({
    queryKey: ['class-tab-order', currentBranch?.id],
    queryFn: async () => {
      try {
        if (!currentBranch) {
          console.warn("No branch selected, cannot fetch class order");
          return null;
        }
        
        console.log("Fetching class order for branch:", currentBranch.id);
        
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
        
        console.log("Retrieved class order:", data);
        return data;
      } catch (error) {
        console.error("Error in fetchSavedOrder:", error);
        return null;
      }
    },
    enabled: !!currentBranch
  });

  // Get the most current data from the query cache
  const cachedClasses = queryClient.getQueryData(['classes', currentBranch?.id]) as any[] || classes;

  // Order classes based on:
  // 1. Cached ordered data (if we have it from drag operations)
  // 2. Saved database order
  // 3. Or fall back to alphabetical
  const getOrderedClasses = () => {
    // Use the most recent cached classes data
    const classesData = cachedClasses.length > 0 ? cachedClasses : classes;
    
    if (!classesData || classesData.length === 0) return [];
    
    // If we have a saved order from database
    if (savedOrder && savedOrder.class_ids && savedOrder.class_ids.length > 0) {
      console.log("Using saved order from database");
      
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
    console.log("Using alphabetical order");
    return [...classesData].sort((a, b) => a.name.localeCompare(b.name));
  };

  const orderedClasses = getOrderedClasses();
  
  console.log("Ordered classes count:", orderedClasses.length);
  
  // Apply filter if provided
  const filteredClasses = filter 
    ? orderedClasses.filter(classItem => classItem.id === filter)
    : orderedClasses;

  return {
    classes: orderedClasses, // Use ordered classes as the primary classes array
    orderedClasses: filteredClasses,
    isLoading: isLoading || isLoadingOrder,
    error,
    refetch
  };
}
