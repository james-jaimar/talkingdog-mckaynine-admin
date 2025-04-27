
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
        // Build the base query to select classes with their schedules
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

        // If a term is selected, filter for schedules with that term
        if (termData?.id) {
          // Instead of the problematic contains filter, we'll fetch all classes
          // and filter them in memory after we get the results
        }

        const { data, error } = await query.order('name');

        if (error) {
          console.error('Error fetching classes:', error);
          throw error;
        }
        
        let filteredData = data as ClassWithSchedules[];
        
        // If a term is selected, filter the results to include only classes with schedules for that term
        if (termData?.id) {
          filteredData = filteredData.map(classItem => ({
            ...classItem,
            class_schedules: classItem.class_schedules?.filter(
              schedule => schedule.term_id === termData.id
            ) || []
          }));
        }
        
        console.log(`Fetched ${filteredData.length || 0} classes for term ${termData?.id || 'none'}`);
        return filteredData;
      } catch (error) {
        console.error("Error fetching classes:", error);
        throw error;
      }
    },
    enabled: !!currentBranch?.id,
  });
}
