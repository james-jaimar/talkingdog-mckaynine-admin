
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
      
      // Current timestamp for all updates
      const now = new Date().toISOString();
      
      console.log("Marking payments as paid:", {
        trainerId,
        scheduleIds,
        paymentMethod,
        transactionId,
        documentUrl,
        documentName,
        now
      });
      
      try {
        // First check if document_url column exists to avoid error
        const { data: columnCheck, error: columnError } = await supabase
          .from('trainer_payments')
          .select('id')
          .limit(1);
          
        if (columnError) {
          console.error("Error checking trainer_payments table:", columnError);
        }
        
        let updateData: any = {
          status: 'paid',
          payment_date: now,
          payment_method: paymentMethod,
          transaction_id: transactionId || null,
          notes: notes || null,
          updated_at: now
        };
        
        // Only add document fields if they exist in the database
        // This check helps with backward compatibility
        try {
          // Use edge function to check columns
          const response = await supabase.functions.invoke('check-column-exists', {
            body: { 
              table: 'trainer_payments',
              column: 'document_url'
            }
          });
          
          const documentColumnExists = response.data?.exists === true;
          
          if (documentColumnExists && documentUrl) {
            updateData.document_url = documentUrl;
            updateData.document_name = documentName || null;
          }
        } catch (columnCheckError) {
          // If the edge function fails, assume columns don't exist
          console.log("Could not check for document columns:", columnCheckError);
        }
      
        // Update trainer payment records for these schedules
        const { data, error } = await supabase
          .from('trainer_payments')
          .update(updateData)
          .eq('trainer_id', trainerId)
          .in('class_schedule_id', scheduleIds);

        console.log("Update response:", { data, error });
        
        if (error) {
          // If error mentions column doesn't exist, try again without document fields
          if (error.message && (
              error.message.includes("column 'document_url' does not exist") || 
              error.message.includes("column 'document_name' does not exist")
            )) {
            console.log("Retrying without document fields");
            delete updateData.document_url;
            delete updateData.document_name;
            
            const { data: retryData, error: retryError } = await supabase
              .from('trainer_payments')
              .update(updateData)
              .eq('trainer_id', trainerId)
              .in('class_schedule_id', scheduleIds);
              
            console.log("Retry update response:", { data: retryData, error: retryError });
            
            if (retryError) {
              throw retryError;
            }
          } else {
            throw error;
          }
        }
        
        // If email notification is requested, send it via edge function
        if (sendEmail) {
          try {
            const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke('send-trainer-payment', {
              body: {
                trainerId,
                scheduleIds,
                paymentMethod,
                transactionId: transactionId || null,
                paymentDate: now,
                documentUrl: documentUrl || null
              }
            });
            
            if (edgeFunctionError) {
              console.error("Error sending payment email:", edgeFunctionError);
              // Don't throw error, just log it - we still want the payment to be recorded
            }
            
            if (edgeFunctionData?.success) {
              toast.success("Payment notification email sent");
            }
          } catch (emailError) {
            console.error("Failed to send payment email:", emailError);
            // Don't throw error, just log it - we still want the payment to be recorded
          }
        }
        
        return { trainerId, scheduleIds };
      } catch (error) {
        console.error("Error in markTrainerPaymentsPaid:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Force refresh the queries with a small delay to ensure DB has updated
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['trainer-payments'] });
        queryClient.invalidateQueries({ queryKey: ['trainer-payment-history'] });
      }, 500);
      toast.success("Payments marked as paid successfully");
    },
    onError: (error) => {
      console.error("Error marking trainer payments as paid:", error);
      toast.error("Failed to update payment status: " + (error as Error).message);
    }
  });
}
