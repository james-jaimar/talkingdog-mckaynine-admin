import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClassWithSchedules } from "../types/class-with-schedules";
import { useBranch } from "@/context/BranchContext";
import { useTerm } from "@/context/TermContext";

// Enable this for detailed debug logs, should be false in production
const DEBUG_LOGGING = true;

/**
 * Log utility function for conditional logging
 */
const logDebug = (...args: any[]) => {
  if (DEBUG_LOGGING) {
    console.log(...args);
  }
};

export function useClassQuery() {
  const { currentBranch } = useBranch();
  const { termData, selectedYear, selectedTermNumber } = useTerm();
  const branchId = currentBranch?.id;
  const termId = termData?.id;

  return useQuery({
    queryKey: ['classes', branchId, termId, selectedYear, selectedTermNumber],
    queryFn: async () => {
      if (!branchId) return [];
      
      try {
        logDebug(`Fetching classes for branch: ${branchId}, year: ${selectedYear}, term: ${selectedTermNumber}, termId: ${termId || 'default'}`);
        
        // First, fetch the saved order for this branch if it exists
        const { data: orderData, error: orderError } = await supabase
          .from('class_tab_order')
          .select('class_ids')
          .eq('branch_id', branchId)
          .maybeSingle();
          
        if (orderError) {
          logDebug('Error fetching saved order:', orderError);
        }
        
        const savedOrder = orderData?.class_ids || [];
        
        // Build our base query with proper filtering at the database level
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
            branch_id,
            branches(name),
            class_schedules(
              id, 
              start_time, 
              end_time, 
              selected_dates,
              term_id,
              term_number,
              academic_year,
              bookings(id, client_id, dog_id)
            )
          `)
          .eq('branch_id', branchId);
        
        // If a term is selected but no termId is available, filter by term number and year
        if (termData && !termId?.startsWith('default')) {
          // If we have a real term ID, filter by it
          classesQuery = classesQuery.eq('class_schedules.term_id', termId);
        } else if (selectedTermNumber && selectedYear) {
          // Otherwise filter by term number and academic year
          classesQuery = classesQuery
            .eq('class_schedules.term_number', selectedTermNumber)
            .eq('class_schedules.academic_year', selectedYear);
        }
        
        // Execute the query
        const { data: allClasses, error: classError } = await classesQuery;

        if (classError) {
          logDebug('Error fetching classes:', classError);
          throw classError;
        }
        
        let classes = allClasses as ClassWithSchedules[];
        
        // If no classes were found, return an empty array
        if (!classes || classes.length === 0) {
          logDebug(`No classes found for branch ${branchId} ${termId ? `and term ${termId}` : ''}`);
          return [];
        }
        
        logDebug(`Found ${classes.length} classes for branch ${branchId} ${termId ? `and term ${termId}` : ''}`);
        
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
          
          classes = orderedClasses;
        }
        
        // Ensure we always return an array of properly shaped ClassWithSchedules objects
        return Array.isArray(classes) ? classes : [];
      } catch (error) {
        console.error("Error fetching classes:", error);
        throw error;
      }
    },
    enabled: !!branchId,
    staleTime: 15000, // 15 seconds - reduced for more frequent refreshes
    structuralSharing: false,
    refetchOnMount: true,
    retry: 2
  });
}
