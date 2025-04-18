
import { supabase } from "@/integrations/supabase/client";

// Fetch class details including course fee and admin fee
export const fetchClassDetails = async (classId: string): Promise<{ name: string; price: number } | null> => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('name, course_fee, admin_fee_value, admin_fee_type')
      .eq('id', classId)
      .single();
    
    if (error) throw error;
    
    if (data) {
      // Calculate total price based on course fee and admin fee
      let adminFeeAmount = data.admin_fee_type === 'percentage' 
        ? (data.course_fee * data.admin_fee_value / 100)
        : data.admin_fee_value;
      
      return {
        name: data.name,
        price: data.course_fee + adminFeeAmount
      };
    }
    
    return null;
  } catch (err) {
    console.error("Error fetching class details:", err);
    return null;
  }
};
