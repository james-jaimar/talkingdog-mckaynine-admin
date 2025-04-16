
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";
import { useAuth } from "@/context/auth";
import { Class } from "@/components/classes/types/class";

interface UseClassDataProps {
  classId?: string;
}

export function useClassData({ classId }: UseClassDataProps) {
  const { currentBranch } = useBranch();
  const { user, session } = useAuth();
  
  const {
    data: classData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['class-detail', classId],
    queryFn: async () => {
      if (!classId) return null;
      
      console.log(`Fetching class details for ID: ${classId}`);
      
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          branches:branch_id (name)
        `)
        .eq('id', classId)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching class details:", error);
        throw error;
      }
      
      if (!data) {
        console.log("No class found with ID:", classId);
        return null;
      }
      
      console.log("Found class data:", data);
      return data as Class;
    },
    enabled: !!classId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    classData,
    isLoading,
    error,
    isAuthenticated: !!user && !!session,
    hasBranch: !!currentBranch
  };
}
