
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateTrainerPaymentPDF } from "@/components/invoices/reports/pdf/TrainerPaymentPDF";
import { TrainerClassDetail } from "./trainer-payments/types";

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
      documentName,
      trainerName,
      trainerEmail,
      classDetails
    }: { 
      trainerId: string; 
      scheduleIds: string[];
      paymentMethod: 'bank_transfer' | 'cash' | 'check' | 'other';
      transactionId?: string;
      notes?: string;
      sendEmail?: boolean;
      documentUrl?: string;
      documentName?: string;
      trainerName?: string;
      trainerEmail?: string;
      classDetails?: TrainerClassDetail[];
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
        sendEmail,
        classDetails: classDetails?.length || 0
      });
      
      // Generate PDF if needed and class details are provided
      let finalDocumentUrl = documentUrl;
      let finalDocumentName = documentName;
      
      if (classDetails && classDetails.length > 0 && trainerName && !documentUrl) {
        try {
          // Generate PDF document
          const paymentDate = new Date().toISOString();
          const pdfDataUri = await generateTrainerPaymentPDF({
            trainerName,
            trainerEmail: trainerEmail || "trainer@example.com", // Fallback
            classes: classDetails,
            paymentDetails: {
              paymentMethod,
              transactionId,
              paymentNotes: notes
            },
            paymentDate
          });
          
          // Convert data URI to file
          const pdfData = pdfDataUri.split(',')[1];
          const decodedData = atob(pdfData);
          const bytes = new Uint8Array(decodedData.length);
          for (let i = 0; i < decodedData.length; i++) {
            bytes[i] = decodedData.charCodeAt(i);
          }
          
          // Create file name
          const fileName = `trainer-payment-${new Date().getTime()}_${Math.random().toString(36).substring(2, 8)}.pdf`;
          
          // Upload to Supabase Storage
          const file = new File([bytes], fileName, { type: 'application/pdf' });
          
          // Ensure the bucket exists
          const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('payment-documents');
          if (bucketError && bucketError.message.includes('does not exist')) {
            await supabase.storage.createBucket('payment-documents', {
              public: false // Make it private requiring signed URLs
            });
          }
          
          // Upload PDF
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('payment-documents')
            .upload(`trainer-payments/${fileName}`, file);
            
          if (uploadError) {
            console.error("Error uploading payment PDF:", uploadError);
            // Continue without the PDF
          } else {
            console.log("Payment PDF uploaded successfully:", uploadData);
            
            // Generate signed URL for the PDF
            const { data: urlData } = await supabase.storage
              .from('payment-documents')
              .createSignedUrl(`trainer-payments/${fileName}`, 7 * 24 * 60 * 60); // 7 days
              
            if (urlData) {
              finalDocumentUrl = urlData.signedUrl;
              finalDocumentName = "Payment Confirmation.pdf";
              console.log("Generated signed URL for PDF:", finalDocumentUrl);
            }
          }
        } catch (pdfError) {
          console.error("Error generating payment PDF:", pdfError);
          // Continue without the PDF
        }
      }
      
      try {
        // Use the edge function to update payments with admin privileges
        const { data, error } = await supabase.functions.invoke('update-trainer-payments', {
          body: { 
            trainerId,
            scheduleIds,
            paymentMethod,
            transactionId,
            notes,
            documentUrl: finalDocumentUrl,
            documentName: finalDocumentName,
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
          totalCount: scheduleIds.length,
          documentUrl: finalDocumentUrl
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
        queryClient.invalidateQueries({ queryKey: ['classes-list-data'] });
      }, 500);

      // Show more detailed success message
      const totalUpdated = (result.updatedCount || 0) + (result.createdCount || 0);
      toast.success(
        `${totalUpdated} payment${totalUpdated !== 1 ? 's' : ''} marked as paid successfully`,
        {
          description: result.documentUrl 
            ? `Payment confirmation document has been generated` 
            : undefined,
          action: result.documentUrl ? {
            label: "View Document",
            onClick: () => window.open(result.documentUrl, "_blank"),
          } : undefined
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
