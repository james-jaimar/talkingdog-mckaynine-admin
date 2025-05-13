
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Utility function to cleanup duplicate trainer payments
 */
export async function cleanupTrainerPayments() {
  try {
    // Use only the valid parameters for the function
    const { data, error } = await supabase.rpc('calculate_trainer_payment', {
      p_booking_id: null
    });

    if (error) {
      console.error("Error cleaning up trainer payments:", error);
      return false;
    }

    if (data) {
      console.log("Trainer payments cleaned up:", data);
    }
    
    return true;
  } catch (err) {
    console.error("Error in cleanupTrainerPayments:", err);
    toast.error("Failed to clean up trainer payments");
    return false;
  }
}
