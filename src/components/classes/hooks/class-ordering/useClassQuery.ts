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
            description,
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
            report_month_override,
            io_inventory_code,
            branches(name),
            status,
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

        // If a term is selected, fetch classes with schedules for this term OR classes with no schedules
        if (termId) {
          // Use left join to get all classes, including those without schedules
          const { data: classesWithSchedules, error: classError } = await supabase
            .from('classes')
            .select(`
              id, 
              name, 
              description,
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
              report_month_override,
              io_inventory_code,
              branches(name),
              status,
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

          if (classError) {
            throw classError;
          }

          // Filter classes to include:
          // 1. Classes with schedules for the selected term
          // 2. Classes with no schedules at all (so users can add schedules)
          let classes = (classesWithSchedules as ClassWithSchedules[]).filter(classItem => {
            if (!classItem.class_schedules || classItem.class_schedules.length === 0) {
              // Include classes with no schedules
              return true;
            }
            
            // Include classes that have at least one schedule for the selected term
            return classItem.class_schedules.some(schedule => schedule.term_id === termId);
          });
          
          logDebug(`Found ${classes.length} classes (with schedules for term ${termId} or no schedules)`);
          
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
