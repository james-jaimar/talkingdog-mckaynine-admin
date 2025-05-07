
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrainerClassDetail } from "./trainer-payments/types";
import { DialogTrainerClassDetail } from "@/components/invoices/reports/payment-dialog/types";

interface MarkPaidParams {
  trainerId: string;
  scheduleIds: string[];
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
  documentUrl?: string;
  documentName?: string;
  sendEmail?: boolean;
  trainerName?: string;
  trainerEmail?: string;
  classDetails?: (TrainerClassDetail | DialogTrainerClassDetail)[];
  amount?: number;
}

export function useMarkTrainerPaymentsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: MarkPaidParams) => {
      try {
        // Calculate total amount if not provided
        let amount = params.amount;
        if (!amount && params.classDetails && params.classDetails.length > 0) {
          amount = params.classDetails.reduce((sum, cls) => sum + cls.potentialRevenue, 0);
        }

        const { error } = await supabase.functions.invoke('update-trainer-payments', {
          body: {
            trainerId: params.trainerId,
            scheduleIds: params.scheduleIds,
            paymentMethod: params.paymentMethod,
            transactionId: params.transactionId,
            notes: params.notes,
            documentUrl: params.documentUrl,
            documentName: params.documentName,
            sendEmail: params.sendEmail,
            trainerName: params.trainerName,
            trainerEmail: params.trainerEmail,
            amount
          }
        });

        if (error) {
          throw new Error(`Error marking payments as paid: ${error.message}`);
        }

        return { success: true };
      } catch (error) {
        console.error("Error in useMarkTrainerPaymentsPaid:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Payment processed successfully");
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['trainer-payments'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to process payment: ${error.message}`);
    }
  });
}
