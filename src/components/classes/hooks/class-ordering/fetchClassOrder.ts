
import { supabase } from "@/integrations/supabase/client";
import { Class, ClassFromDB } from "../../types/class";

export async function fetchClassOrder(branchId: string | undefined) {
  if (!branchId) return [];
  
  try {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        branches:branch_id (
          name
        ),
        class_schedules:class_schedules (
          id,
          bookings:bookings (
            id
          )
        )
      `)
      .eq('branch_id', branchId);
    
    if (error) {
      console.error("Error fetching classes:", error);
      throw error;
    }
    
    // Convert the data from DB to properly typed Class objects
    const typedData: Class[] = (data || []).map((item: any) => ({
      ...item,
      mckaynine_commission_type: item.mckaynine_commission_type as 'percentage' | 'amount',
      admin_fee_type: item.admin_fee_type as 'percentage' | 'amount',
      trainer_fee_type: item.trainer_fee_type as 'percentage' | 'amount'
    }));
    
    return typedData;
  } catch (error) {
    console.error("Error in classes query:", error);
    throw error;
  }
}
