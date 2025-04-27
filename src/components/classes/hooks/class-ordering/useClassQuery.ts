
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
        // First, fetch the saved order for this branch if it exists
        const { data: orderData, error: orderError } = await supabase
          .from('class_tab_order')
          .select('class_ids')
          .eq('branch_id', currentBranch.id)
          .maybeSingle();
          
        if (orderError && orderError.code !== 'PGRST116') {
          console.error('Error fetching class order:', orderError);
          // Continue without order, we'll just use default sorting
        }
        
        const savedOrder = orderData?.class_ids || [];
        console.log('Retrieved saved order:', savedOrder.length > 0 ? `${savedOrder.length} classes` : 'No saved order');
        
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

        const { data, error } = await query.order('name');

        if (error) {
          console.error('Error fetching classes:', error);
          throw error;
        }
        
        let allClasses = data as ClassWithSchedules[];
        
        // Filter the class schedules to only include those for the selected term
        if (termData?.id) {
          allClasses = allClasses.map(classItem => ({
            ...classItem,
            class_schedules: classItem.class_schedules?.filter(
              schedule => schedule.term_id === termData.id
            ) || []
          }));
        }
        
        console.log(`Fetched ${allClasses.length || 0} classes before ordering`);
        
        // Apply saved order if available
        if (savedOrder.length > 0) {
          // Create a map for faster lookups
          const classMap = new Map(allClasses.map(c => [c.id, c]));
          
          // Build ordered list from saved order, adding any classes not in the order at the end
          const orderedClasses: ClassWithSchedules[] = [];
          
          // First add all classes in the saved order (if they exist in our fetched data)
          savedOrder.forEach(id => {
            const classItem = classMap.get(id);
            if (classItem) {
              orderedClasses.push(classItem);
              classMap.delete(id);
            }
          });
          
          // Then add any remaining classes that weren't in the saved order
          classMap.forEach(classItem => {
            orderedClasses.push(classItem);
          });
          
          console.log(`Applied saved order: ${orderedClasses.length} classes ordered`);
          return orderedClasses;
        }
        
        console.log(`No saved order applied, returning ${allClasses.length} classes in default order`);
        return allClasses;
      } catch (error) {
        console.error("Error fetching classes:", error);
        throw error;
      }
    },
    enabled: !!currentBranch?.id,
    staleTime: 30000, // Cache for 30 seconds
  });
}
