
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClassWithSchedules } from "../types/class-with-schedules";
import { useBranch } from "@/context/BranchContext";
import { useTerm } from "@/context/TermContext";

export function useClassQuery() {
  const { currentBranch } = useBranch();
  const { termData, selectedTermNumber, selectedYear } = useTerm();
  const branchId = currentBranch?.id;
  const termId = termData?.id;

  return useQuery({
    queryKey: ['classes', branchId, termId, selectedTermNumber, selectedYear],
    queryFn: async () => {
      if (!branchId) return [];

      console.log('Fetching classes for branch:', branchId, 'with term:', termData?.id);
      
      try {
        // First, fetch the saved order for this branch if it exists
        const { data: orderData, error: orderError } = await supabase
          .from('class_tab_order')
          .select('class_ids')
          .eq('branch_id', branchId)
          .maybeSingle();
          
        if (orderError) {
          console.error('Error fetching class order:', orderError);
        }
        
        const savedOrder = orderData?.class_ids || [];
        console.log('Retrieved saved order with', savedOrder.length, 'classes');
        
        // Modified query to filter by term at the database level when a term is selected
        let classesQuery = supabase
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
            class_schedules!inner(
              id, 
              start_time, 
              end_time, 
              selected_dates,
              term_id,
              bookings(id)
            )
          `)
          .eq('branch_id', branchId);
        
        // If a term is selected, filter classes to only those with schedules in this term
        if (termId) {
          console.log(`Filtering classes at DB level for term: ${termId}`);
          classesQuery = classesQuery.eq('class_schedules.term_id', termId);
        }
        
        // Execute the query
        const { data: allClasses, error: classError } = await classesQuery.order('name');

        if (classError) {
          console.error('Error fetching classes:', classError);
          throw classError;
        }
        
        let classes = allClasses as ClassWithSchedules[];
        console.log(`Fetched ${classes.length} classes for term: ${termData?.id || 'all terms'}`);
        
        // Apply the saved order if available
        if (savedOrder.length > 0) {
          // Create a map for efficient lookups
          const classMap = new Map(classes.map(c => [c.id, c]));
          
          // Build the ordered list based on saved order
          const orderedClasses: ClassWithSchedules[] = [];
          
          // First add all classes in the saved order (if they exist)
          savedOrder.forEach(id => {
            const classItem = classMap.get(id);
            if (classItem) {
              orderedClasses.push(classItem);
              classMap.delete(id);
            }
          });
          
          // Then add any remaining classes (including newly created ones)
          classMap.forEach(classItem => {
            orderedClasses.push(classItem);
          });
          
          console.log(`Applied saved order: ${orderedClasses.length} classes ordered`);
          classes = orderedClasses;
        }
        
        return classes;
      } catch (error) {
        console.error("Error fetching classes:", error);
        throw error;
      }
    },
    enabled: !!branchId,
    // Reduce stale time to ensure fresher data
    staleTime: 0, 
    // Force new references even if data hasn't changed
    structuralSharing: false,
  });
}
