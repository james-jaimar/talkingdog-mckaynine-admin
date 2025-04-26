
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClassWithSchedules } from "../types/class-with-schedules";
import { useBranch } from "@/context/BranchContext";
import { useTerm } from "@/context/TermContext";

export function useClassQuery() {
  const { currentBranch } = useBranch();
  const { termData } = useTerm();

  return useQuery({
    queryKey: ['classes', currentBranch?.id, termData?.id],
    queryFn: async () => {
      if (!currentBranch?.id) return [];

      console.log('Fetching classes for branch:', currentBranch.id, 'and term:', termData?.id);
      
      try {
        const query = supabase
          .from('classes')
          .select(`
            id, 
            name, 
            class_type,
            course_fee,
            enrollment_fee,
            mckaynine_commission_type,
            mckaynine_commission_value,
            admin_fee_type,
            admin_fee_value,
            trainer_fee_type,
            trainer_fee_value,
            duration,
            capacity,
            branches(name),
            class_schedules(
              id, 
              start_time, 
              end_time, 
              selected_dates,
              term_id,
              bookings(id)
            )
          `)
          .eq('branch_id', currentBranch.id);

        if (termData?.id) {
          query.contains('class_schedules', [{ term_id: termData.id }]);
        }

        const { data, error } = await query.order('name');

        if (error) {
          console.error('Error fetching classes:', error);
          throw error;
        }
        
        console.log(`Fetched ${data?.length || 0} classes for term ${termData?.id || 'none'}`);
        return data as ClassWithSchedules[];
      } catch (error) {
        console.error("Error fetching classes:", error);
        throw error;
      }
    },
    enabled: !!currentBranch?.id,
  });
}
