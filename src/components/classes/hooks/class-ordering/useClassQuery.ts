
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClassWithSchedules } from "../types/class-with-schedules";
import { useBranch } from "@/context/BranchContext";
import { useTerm } from "@/context/TermContext";

// Enable this for detailed debug logs, should be false in production
const DEBUG_LOGGING = false;

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
  const { termData } = useTerm();
  const branchId = currentBranch?.id;
  const termId = termData?.id;

  return useQuery({
    queryKey: ['classes', branchId, termId],
    queryFn: async () => {
      if (!branchId) return [];
      
      try {
        logDebug(`Fetching classes for branch: ${branchId} and term: ${termId || 'all terms'}`);
        
        // First, fetch the saved order for this branch if it exists
        const { data: orderData, error: orderError } = await supabase
          .from('class_tab_order')
          .select('class_ids')
          .eq('branch_id', branchId)
          .maybeSingle();
          
        if (orderError) {
          throw orderError;
        }
        
        const savedOrder = orderData?.class_ids || [];
        
        let query = supabase
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
              bookings(id, client_id, dog_id)
            )
          `)
          .eq('branch_id', branchId);

        // If a term is selected, only fetch classes that have schedules for this term
        if (termId) {
          // Use EXISTS to only get classes that have schedules for the selected term
          const { data: classesWithSchedules, error: classError } = await supabase
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
                bookings(id, client_id, dog_id)
              )
            `)
            .eq('branch_id', branchId)
            .eq('class_schedules.term_id', termId);

          if (classError) {
            throw classError;
          }

          let classes = classesWithSchedules as ClassWithSchedules[];
          
          logDebug(`Found ${classes.length} classes with schedules for term ${termId}`);
          
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
          
          return Array.isArray(classes) ? classes : [];
        } else {
          // No term selected - fetch all classes for management purposes
          const { data: allClasses, error: classError } = await query;

          if (classError) {
            throw classError;
          }
          
          let classes = allClasses as ClassWithSchedules[];
          
          // If no classes were found, return an empty array
          if (!classes || classes.length === 0) {
            logDebug(`No classes found for branch ${branchId}`);
            return [];
          }
          
          logDebug(`Found ${classes.length} classes for branch ${branchId} (no term filter)`);
          
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
          
          // Ensure we always return an array
          return Array.isArray(classes) ? classes : [];
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
        throw error;
      }
    },
    enabled: !!branchId,
    staleTime: 30000, // 30 seconds
    structuralSharing: false,
  });
}
