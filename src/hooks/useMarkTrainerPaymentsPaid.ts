
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrainerClassDetail } from "./trainer-payments/types";
import { DialogTrainerClassDetail } from "@/components/invoices/reports/payment-dialog/types";
import { generateTrainerPaymentPDF } from "@/components/invoices/reports/pdf/TrainerPaymentPDF";
import { uploadPaymentPDF, generatePaymentPDFFilename } from "@/lib/storage/pdfStorage";

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

        // Generate payment PDF
        let documentUrl = params.documentUrl;
        let documentName = params.documentName;
        
        if (!documentUrl && params.trainerName && params.classDetails && params.classDetails.length > 0) {
          try {
            // Generate PDF document
            const pdfBase64 = await generateTrainerPaymentPDF({
              trainerName: params.trainerName || "Trainer",
              trainerEmail: params.trainerEmail || "",
              classes: params.classDetails as TrainerClassDetail[],
              paymentDetails: {
                paymentMethod: params.paymentMethod || 'bank_transfer',
                transactionId: params.transactionId,
                paymentNotes: params.notes
              },
              paymentDate: new Date().toISOString()
            });
            
            if (pdfBase64) {
              // Generate unique filename for the PDF
              const filename = generatePaymentPDFFilename(params.trainerName);
              
              // Upload PDF to storage
              const uploadResult = await uploadPaymentPDF(pdfBase64, filename);
              
              if (uploadResult) {
                documentUrl = uploadResult.url;
                documentName = uploadResult.name;
                console.log("Payment PDF stored:", documentUrl);
              }
            }
          } catch (pdfError) {
            console.error("Error generating payment PDF:", pdfError);
            // Continue with payment processing even if PDF generation fails
          }
        }

        const { error } = await supabase.functions.invoke('update-trainer-payments', {
          body: {
            trainerId: params.trainerId,
            scheduleIds: params.scheduleIds,
            paymentMethod: params.paymentMethod,
            transactionId: params.transactionId,
            notes: params.notes,
            documentUrl: documentUrl,
            documentName: documentName,
            sendEmail: params.sendEmail,
            trainerName: params.trainerName,
            trainerEmail: params.trainerEmail,
            amount
          }
        });

        if (error) {
          throw new Error(`Error marking payments as paid: ${error.message}`);
        }

        return { success: true, documentUrl, documentName };
      } catch (error) {
        console.error("Error in useMarkTrainerPaymentsPaid:", error);
        throw error;
      }
    },
    onSuccess: (result) => {
      toast.success("Payment processed successfully");
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['trainer-payments'] });
      queryClient.invalidateQueries({ queryKey: ['trainer-payment-history'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to process payment: ${error.message}`);
    }
  });
}
