
import { supabase } from "@/integrations/supabase/client";

// Fetch complete class details including all fee information
export const fetchClassDetails = async (classId: string): Promise<{ 
  name: string; 
  price: number;
  courseFee: number;
  enrollmentFee: number;
  adminFeeType: 'percentage' | 'amount';
  adminFeeValue: number;
  trainerFeeType: 'percentage' | 'amount';
  trainerFeeValue: number;
  franchiseFeeType: 'percentage' | 'amount';
  franchiseFeeValue: number;
  branchId: string;
  reportMonthOverride: string | null;
  ioInventoryCode: string | null;
  classType: string;
} | null> => {
  try {
    console.log(`Fetching class details for class ID: ${classId}`);
    
    const { data, error } = await supabase
      .from('classes')
      .select(`
        name, 
        class_type,
        course_fee, 
        enrollment_fee,
        admin_fee_value, 
        admin_fee_type,
        trainer_fee_value, 
        trainer_fee_type,
        mckaynine_commission_value, 
        mckaynine_commission_type,
        branch_id,
        report_month_override,
        io_inventory_code
      `)
      .eq('id', classId)
      .single();
    
    if (error) {
      console.error("Error fetching class details:", error);
      throw error;
    }
    
    if (!data) {
      console.error("No class data found for ID:", classId);
      return null;
    }
    
    console.log("Fetched class details:", data);
    
    // Validate fee types
    const adminFeeType = data.admin_fee_type === 'percentage' ? 'percentage' : 'amount';
    const trainerFeeType = data.trainer_fee_type === 'percentage' ? 'percentage' : 'amount';
    const franchiseFeeType = data.mckaynine_commission_type === 'percentage' ? 'percentage' : 'amount';
    
    return {
      name: data.name,
      price: data.course_fee, // Base price - now just the course fee
      courseFee: data.course_fee,
      enrollmentFee: data.enrollment_fee || 0,
      adminFeeType,
      adminFeeValue: data.admin_fee_value,
      trainerFeeType,
      trainerFeeValue: data.trainer_fee_value,
      franchiseFeeType,
      franchiseFeeValue: data.mckaynine_commission_value,
      branchId: data.branch_id,
      reportMonthOverride: data.report_month_override || null,
      ioInventoryCode: data.io_inventory_code || null,
      classType: data.class_type,
    };
  } catch (err) {
    console.error("Error fetching class details:", err);
    return null;
  }
};
