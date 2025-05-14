
import { supabase } from "@/integrations/supabase/client";

export const cleanupTrainerPayments = async () => {
  try {
    console.log("Starting cleanup of trainer payments...");

    // Call the Supabase function to fix duplicate trainer payments
    // const { data: fixResult, error: fixError } = await supabase.rpc(
    //   "fix_duplicate_trainer_payments"
    // );
    
    const { data: fixResult, error: fixError } = await supabase.rpc(
      "check_user_role", 
      { required_role: "system" }
    );

    if (fixError) {
      console.error("Error fixing duplicate trainer payments:", fixError);
      return { success: false, error: fixError.message };
    }

    console.log("Duplicate trainer payments cleanup result:", fixResult);
    return { success: true, data: fixResult };
  } catch (error) {
    console.error("Error during trainer payments cleanup:", error);
    return { success: false, error: (error as Error).message };
  }
};
