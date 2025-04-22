
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";
import { useClassTabOrder } from "./useClassTabOrder";
import { useTermSelection } from "@/hooks/useTermSelection";

export function useClassOrdering() {
  const { currentBranch } = useBranch();
  const { termDateRange } = useTermSelection();

  // Fetch all active classes with their schedules
  const { data: classes, isLoading, error, refetch } = useQuery({
    queryKey: ['classes', currentBranch?.id, termDateRange?.startDate, termDateRange?.endDate],
    queryFn: async () => {
      if (!currentBranch) return [];

      let query = supabase
        .from('classes')
        .select(`
          id,
          name,
          class_type,
          course_fee,
          branch_id,
          branches:branch_id(name),
          class_schedules(
            id,
            start_time,
            end_time,
            selected_dates
          )
        `)
        .eq('branch_id', currentBranch.id);

      // If we have term date range, filter class schedules
      if (termDateRange?.startDate && termDateRange?.endDate) {
        query = query.or(`class_schedules.start_time.gte.${termDateRange.startDate},class_schedules.start_time.is.null`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: !!currentBranch,
    staleTime: 60000,
  });

  // Use hook to order classes
  const { orderedClasses } = useClassTabOrder(classes || [], currentBranch?.id);

  return {
    orderedClasses,
    isLoading,
    error,
    refetch
  };
}
