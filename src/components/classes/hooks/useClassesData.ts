
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";

// Define the type for activeClasses to match what we get from the query
interface ActiveClass {
  id: string;
  name: string;
  branches: { name: string };
  class_schedules: { id: string }[];
}

export function useClassesData() {
  const { currentBranch } = useBranch();
  
  // Fetch active classes (those that have schedules)
  const { data: activeClasses = [], isLoading } = useQuery({
    queryKey: ['active-classes', currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch) return [];
      
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
        .not('class_schedules', 'is', null)
        .order('name');
      
      if (error) {
        console.error("Error fetching active classes:", error);
        throw error;
      }
      
      return data as ActiveClass[];
    },
    enabled: !!currentBranch,
  });

  return {
    activeClasses,
    isLoading,
    hasBranch: !!currentBranch
  };
}
