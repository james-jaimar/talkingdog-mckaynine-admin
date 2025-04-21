
import { supabase } from "@/integrations/supabase/client";

// Fetch complete class details including all fee information
export const fetchClassDetails = async (classId: string): Promise<{ 
  name: string; 
  price: number;
  courseFee: number;
  enrollmentFee: number;
  adminFeeType: string;
  adminFeeValue: number;
  trainerFeeType: string;
  trainerFeeValue: number;
  franchiseFeeType: string;
  franchiseFeeValue: number;
} | null> => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        name, 
        course_fee, 
        enrollment_fee,
        admin_fee_value, 
        admin_fee_type,
        trainer_fee_value, 
        trainer_fee_type,
        mckaynine_commission_value, 
        mckaynine_commission_type
      `)
      .eq('id', classId)
      .single();
    
    if (error) throw error;
    
    if (data) {
      return {
        name: data.name,
        price: data.course_fee, // Base price - now just the course fee
        courseFee: data.course_fee,
        enrollmentFee: data.enrollment_fee || 0,
        adminFeeType: data.admin_fee_type,
        adminFeeValue: data.admin_fee_value,
        trainerFeeType: data.trainer_fee_type,
        trainerFeeValue: data.trainer_fee_value,
        franchiseFeeType: data.mckaynine_commission_type,
        franchiseFeeValue: data.mckaynine_commission_value
      };
    }
    
    return null;
  } catch (err) {
    console.error("Error fetching class details:", err);
    return null;
  }
};
