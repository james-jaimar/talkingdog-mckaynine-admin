
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Utility function to cleanup duplicate trainer payments
 */
export async function cleanupTrainerPayments() {
  try {
    // Note: Using the native rpc function since the custom function was removed
    const { data, error } = await supabase.rpc('calculate_trainer_payment', {
      p_booking_id: null,
      cleanup_duplicates: true
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
