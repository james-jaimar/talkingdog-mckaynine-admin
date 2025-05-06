
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateTrainerPaymentPDF } from "@/components/invoices/reports/pdf/TrainerPaymentPDF";
import { TrainerClassDetail } from "./trainer-payments/types";
import { sendTrainerPaymentEmail } from "@/lib/emails/trainerPaymentEmail";
import { ensurePaymentDocumentsBucketExists } from "./trainer-payments/queries/fetchTrainerData";

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
      
      // Calculate total payment amount from class details
      let amount = 0;
      if (classDetails && classDetails.length > 0) {
        amount = classDetails.reduce((total, cls) => {
          if (scheduleIds.includes(cls.scheduleId)) {
            return total + cls.potentialRevenue;
          }
          return total;
        }, 0);
      }
      
      console.log("Marking payments as paid:", {
        trainerId,
        scheduleIds,
        paymentMethod,
        transactionId,
        documentUrl,
        documentName,
        sendEmail,
        amount,
        classDetails: classDetails?.length || 0
      });
      
      // Ensure the storage bucket exists
      await ensurePaymentDocumentsBucketExists();
      
      // Always generate a PDF for the payment record
      let finalDocumentUrl = documentUrl;
      let finalDocumentName = documentName || `Payment_${trainerName}_${new Date().toISOString().substring(0, 10)}.pdf`;
      let pdfDataUri: string | undefined = undefined;
      
      if (classDetails && classDetails.length > 0 && trainerName) {
        try {
          // Generate PDF document
          const paymentDate = new Date().toISOString();
          pdfDataUri = await generateTrainerPaymentPDF({
            trainerName,
            trainerEmail: trainerEmail || "trainer@example.com", // Fallback
            classes: classDetails.filter(cls => scheduleIds.includes(cls.scheduleId)),
            paymentDetails: {
              paymentMethod,
              transactionId,
              paymentNotes: notes,
              totalAmount: amount
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
          
          // Create file name with trainer's name and date
          const timestamp = new Date().getTime();
          const uniqueId = Math.random().toString(36).substring(2, 8);
          const fileName = `payment_${trainerName.replace(/\s+/g, '_').toLowerCase()}_${timestamp}_${uniqueId}.pdf`;
          
          // Upload to Supabase Storage
          const file = new File([bytes], fileName, { type: 'application/pdf' });
          
          // Upload PDF to payment-documents bucket
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('payment-documents')
            .upload(`trainer-payments/${fileName}`, file);
            
          if (uploadError) {
            console.error("Error uploading payment PDF:", uploadError);
            // Continue without the PDF
          } else {
            console.log("Payment PDF uploaded successfully:", uploadData);
            
            // Generate signed URL for the PDF (valid for 7 days)
            const { data: urlData } = await supabase.storage
              .from('payment-documents')
              .createSignedUrl(`trainer-payments/${fileName}`, 7 * 24 * 60 * 60);
              
            if (urlData) {
              finalDocumentUrl = urlData.signedUrl;
              finalDocumentName = `Payment_Confirmation_${trainerName.replace(/\s+/g, '_')}.pdf`;
              console.log("Generated signed URL for PDF:", finalDocumentUrl);
            }
          }
        } catch (pdfError) {
          console.error("Error generating payment PDF:", pdfError);
          // Continue without the PDF
        }
      }
      
      // Variable to track if email was sent
      let emailSent = false;
      let emailError: string | null = null;
      
      // If email should be sent, do it before updating the database
      if (sendEmail && trainerEmail && trainerName && finalDocumentUrl) {
        try {
          const emailResult = await sendTrainerPaymentEmail({
            to: trainerEmail,
            trainerName,
            amount,
            paymentDetails: {
              paymentMethod,
              transactionId,
              paymentNotes: notes,
              documentUrl: finalDocumentUrl,
              documentName: finalDocumentName,
              sendEmail
            },
            pdfAttachment: pdfDataUri
          });
          
          emailSent = emailResult.success;
          if (!emailResult.success) {
            emailError = emailResult.message;
            console.error("Email sending failed:", emailResult.message);
          } else {
            console.log("Email sent successfully to", trainerEmail);
          }
        } catch (err) {
          console.error("Exception sending email:", err);
          emailError = err instanceof Error ? err.message : String(err);
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
            sendEmail: false, // We've already sent the email if needed
            amount, // Include the calculated amount
            trainerName,
            trainerEmail
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
          documentUrl: finalDocumentUrl,
          documentName: finalDocumentName,
          amount,
          emailSent,
          emailError
        };
      } catch (error) {
        console.error("Error in markTrainerPaymentsPaid:", error);
        throw error;
      }
    },
    onSuccess: (result) => {
      // Force refresh the queries
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['trainer-payments'] });
        queryClient.invalidateQueries({ queryKey: ['trainer-payment-history'] });
        queryClient.invalidateQueries({ queryKey: ['classes-list-data'] });
      }, 500);

      // Show more detailed success message
      const totalUpdated = (result.updatedCount || 0) + (result.createdCount || 0);
      
      // First show payment success toast
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
      
      // Then show email status toast if email was attempted
      if (result.emailSent === true) {
        toast.success("Payment confirmation email sent successfully", {
          description: "The trainer has been notified via email"
        });
      } else if (result.emailError) {
        toast.error("Could not send confirmation email", {
          description: result.emailError
        });
      }
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
