
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClassWithSchedules } from "../types/class-with-schedules";
import { useBranch } from "@/context/BranchContext";
import { useTerm } from "@/context/TermContext";

export function useClassQuery() {
  const { currentBranch } = useBranch();
  const { termData } = useTerm();
  const branchId = currentBranch?.id;

  return useQuery({
    queryKey: ['classes', branchId, termData?.id],
    queryFn: async () => {
      if (!branchId) return [];

      console.log('Fetching classes for branch:', branchId, 'and term:', termData?.id);
      
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
        
        // Fetch all classes with their schedules
        const { data: allClasses, error: classError } = await supabase
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
          .eq('branch_id', branchId)
          .order('name');

        if (classError) {
          console.error('Error fetching classes:', classError);
          throw classError;
        }
        
        let classes = allClasses as ClassWithSchedules[];
        console.log(`Fetched ${classes.length} classes before ordering`);
        
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
          
          // Then add any remaining classes
          classMap.forEach(classItem => {
            orderedClasses.push(classItem);
          });
          
          console.log(`Applied saved order: ${orderedClasses.length} classes ordered`);
          classes = orderedClasses;
        }
        
        // DEBUG: Before filtering, let's log all class schedules
        classes.forEach(classItem => {
          console.log(`Class ${classItem.name} has ${classItem.class_schedules?.length || 0} schedules:`);
          classItem.class_schedules?.forEach(schedule => {
            console.log(`  Schedule ID: ${schedule.id}, Term ID: ${schedule.term_id}`);
          });
        });
        
        // Don't filter by term at this level - we will do it at the display level
        // This ensures we have all classes available and can show them based on different criteria
        
        return classes;
      } catch (error) {
        console.error("Error fetching classes:", error);
        throw error;
      }
    },
    enabled: !!branchId,
    staleTime: 30000, // Cache for 30 seconds
  });
}
