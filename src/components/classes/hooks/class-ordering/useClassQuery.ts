
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
        
        // Build our base query
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
            class_schedules(
              id, 
              start_time, 
              end_time, 
              selected_dates,
              term_id,
              bookings(id)
            )
          `)
          .eq('branch_id', branchId);
        
        // If a term is selected, modify the query to filter by term at the database level
        if (termId) {
          console.log(`Filtering classes at DB level for term: ${termId}`);
          
          // Use a nested exists query to filter classes that have schedules for the selected term
          classesQuery = supabase
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
            .eq('branch_id', branchId)
            .eq('class_schedules.term_id', termId);
        }
        
        // Execute the query
        const { data: allClasses, error: classError } = await classesQuery;

        if (classError) {
          console.error('Error fetching classes:', classError);
          throw classError;
        }
        
        let classes = allClasses as ClassWithSchedules[];
        console.log(`Fetched ${classes?.length || 0} classes for term: ${termData?.id || 'all terms'}`);
        
        // If no classes were found, return an empty array - don't return null or undefined
        if (!classes || classes.length === 0) {
          return [];
        }
        
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
        
        // Ensure we always return an array
        return Array.isArray(classes) ? classes : [];
      } catch (error) {
        console.error("Error fetching classes:", error);
        throw error;
      }
    },
    enabled: !!branchId,
    // Reduce stale time to ensure fresher data
    staleTime: 0, 
    // Create new references to ensure React detects changes
    structuralSharing: false,
  });
}
