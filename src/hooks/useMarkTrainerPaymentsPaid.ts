
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useMarkTrainerPaymentsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      trainerId, 
      scheduleIds,
      paymentMethod,
      transactionId,
      notes,
      sendEmail = false,
      documentUrl,
      documentName
    }: { 
      trainerId: string; 
      scheduleIds: string[];
      paymentMethod: 'bank_transfer' | 'cash' | 'check' | 'other';
      transactionId?: string;
      notes?: string;
      sendEmail?: boolean;
      documentUrl?: string;
      documentName?: string;
    }) => {
      if (!scheduleIds.length) {
        throw new Error("No schedules selected");
      }
      
      console.log("Marking payments as paid:", {
        trainerId,
        scheduleIds,
        paymentMethod,
        transactionId,
        documentUrl,
        documentName,
        sendEmail
      });
      
      try {
        // Use the edge function to update payments with admin privileges
        const { data, error } = await supabase.functions.invoke('update-trainer-payments', {
          body: { 
            trainerId,
            scheduleIds,
            paymentMethod,
            transactionId,
            notes,
            documentUrl,
            documentName,
            sendEmail
          }
        });

        console.log("Payment update response:", { data, error });
        
        if (error) {
          console.error("Error in edge function:", error);
          throw new Error(`Payment update failed: ${error.message || "Unknown error"}`);
        }

        if (!data?.success) {
          console.error("Payment update returned unsuccessful status:", data);
          throw new Error("Payment update failed with an unknown error");
        }
        
        // Return detailed result for better UI feedback
        return { 
          trainerId, 
          scheduleIds,
          updatedCount: data.updatedCount || 0,
          createdCount: data.createdCount || 0,
          totalCount: scheduleIds.length
        };
      } catch (error) {
        console.error("Error in markTrainerPaymentsPaid:", error);
        throw error;
      }
    },
    onSuccess: (result) => {
      // Force refresh the queries with a small delay to ensure DB has updated
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['trainer-payments'] });
        queryClient.invalidateQueries({ queryKey: ['trainer-payment-history'] });
      }, 500);

      // Show more detailed success message
      const totalUpdated = (result.updatedCount || 0) + (result.createdCount || 0);
      toast.success(
        `${totalUpdated} payment${totalUpdated !== 1 ? 's' : ''} marked as paid successfully`,
        {
          description: result.createdCount > 0 
            ? `Created ${result.createdCount} new payment record${result.createdCount !== 1 ? 's' : ''}`
            : undefined
        }
      );
    },
    onError: (error) => {
      console.error("Error marking trainer payments as paid:", error);
      
      // Show a more detailed error message
      toast.error("Failed to update payment status", {
        description: (error as Error).message || "An unknown error occurred",
        duration: 5000
      });
    }
  });
}
