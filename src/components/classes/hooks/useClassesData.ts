
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";
import { useAuth } from "@/context/auth"; 

// Define the type for activeClasses to match what we get from the query
interface ActiveClass {
  id: string;
  name: string;
  branches: { name: string };
  class_schedules: { id: string }[];
}

export function useClassesData() {
  const { currentBranch } = useBranch();
  const { user, session } = useAuth();
  
  // Fetch active classes (those that have schedules)
  const { data: activeClasses = [], isLoading, error } = useQuery({
    queryKey: ['active-classes', currentBranch?.id, user?.id],
    queryFn: async () => {
      if (!currentBranch) {
        console.warn("No branch selected, cannot fetch active classes");
        return [];
      }
      
      console.log("Fetching active classes with branch ID:", currentBranch.id);
      
      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          branches:branch_id (name),
          class_schedules:class_schedules (id)
        `)
        .eq('branch_id', currentBranch.id)
        // Only get classes that have schedules
        .not('class_schedules', 'is', null);
      
      if (error) {
        console.error("Error fetching active classes:", error);
        throw error;
      }
      
      console.log(`Fetched ${data?.length || 0} active classes for branch: ${currentBranch.name}`);
      return (data || []) as ActiveClass[];
    },
    enabled: !!currentBranch && !!user && !!session,
    staleTime: 30000, // 30 seconds
  });

  return {
    activeClasses,
    isLoading,
    hasBranch: !!currentBranch,
    isAuthenticated: !!user && !!session,
    error
  };
}
