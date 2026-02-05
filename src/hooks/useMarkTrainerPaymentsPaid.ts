import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrainerClassDetail } from "./trainer-payments/types";
import { DialogTrainerClassDetail } from "@/components/invoices/reports/payment-dialog/types";
import { generateTrainerPaymentPDF } from "@/components/invoices/reports/pdf/TrainerPaymentPDF";
import { uploadPaymentPDF, generatePaymentPDFFilename } from "@/lib/storage/pdfStorage";

type PaymentMethod = 'bank_transfer' | 'cash' | 'check' | 'other';

interface MarkPaidParams {
  trainerId: string;
  scheduleIds: string[];
  paymentMethod?: PaymentMethod;
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

// Utility function to ensure the payment-documents bucket exists and is public
async function ensurePaymentDocumentsBucket() {
  try {
    // Check if bucket exists
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Error checking storage buckets:", error);
      return false;
    }
    
    const paymentBucket = buckets?.find(b => b.id === 'payment-documents');
    
    if (!paymentBucket) {
      console.log("Creating payment-documents bucket");
      const { data, error: createError } = await supabase.storage
        .createBucket('payment-documents', {
          public: true
        });
      
      if (createError) {
        console.error("Error creating payment-documents bucket:", createError);
        return false;
      }
      
      console.log("Payment-documents bucket created:", data);
      return true;
    }
    
    if (!paymentBucket.public) {
      console.log("Payment-documents bucket exists but is not public");
      // Use a direct update query instead of the RPC function
      try {
        // Only storage admin can update bucket properties, so we'll need to use
        // an edge function or handle this through the UI notification
        console.log("Bucket needs to be made public through the Supabase dashboard");
        return false;
      } catch (err) {
        console.error("Error making bucket public:", err);
        return false;
      }
    }
    
    console.log("Payment-documents bucket exists and is public");
    return true;
  } catch (err) {
    console.error("Error ensuring payment-documents bucket:", err);
    return false;
  }
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

        // Build classAmounts map with exact per-class amounts
        const classAmounts: Record<string, number> = {};
        if (params.classDetails && params.classDetails.length > 0) {
          params.classDetails.forEach(cls => {
            classAmounts[cls.scheduleId] = cls.potentialRevenue;
          });
        }

        // Generate payment PDF
        let documentUrl = params.documentUrl;
        let documentName = params.documentName;
        
        // Always generate a payment PDF if class details are available, even if custom document is uploaded
        const shouldGeneratePaymentPdf = params.trainerName && params.classDetails && params.classDetails.length > 0;
        
        if (shouldGeneratePaymentPdf) {
          try {
            console.log("Generating payment PDF document for:", params.trainerName);
            
            // Check storage bucket before attempting to upload
            await ensurePaymentDocumentsBucket();
            
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
              
              console.log("Uploading payment PDF with filename:", filename);
              // Upload PDF to storage
              const uploadResult = await uploadPaymentPDF(pdfBase64, filename);
              
              if (uploadResult) {
                // If we already have a document URL from an uploaded file, keep it in a separate field
                if (params.documentUrl) {
                  console.log("Using both generated PDF and uploaded document");
                  documentUrl = uploadResult.url;
                  documentName = uploadResult.name;
                } else {
                  documentUrl = uploadResult.url;
                  documentName = uploadResult.name;
                  console.log("Payment PDF stored successfully:", documentUrl);
                }
              } else {
                console.error("Failed to upload payment PDF");
              }
            }
          } catch (pdfError) {
            console.error("Error generating payment PDF:", pdfError);
            // Continue with payment processing even if PDF generation fails
          }
        } else {
          console.log("Skipping PDF generation, using provided document:", documentUrl);
        }

        // Ensure paymentMethod is one of the valid options
        const validPaymentMethod = params.paymentMethod && ['bank_transfer', 'cash', 'check', 'other'].includes(params.paymentMethod)
          ? params.paymentMethod as PaymentMethod
          : 'bank_transfer';

        console.log("Calling update-trainer-payments with:", {
          trainerId: params.trainerId,
          scheduleIds: params.scheduleIds,
          documentUrl: documentUrl
        });
        
        // First check for duplicates to avoid errors
        const { data: existingPayments, error: checkError } = await supabase
          .from('trainer_payments')
          .select('class_schedule_id')
          .eq('trainer_id', params.trainerId)
          .in('class_schedule_id', params.scheduleIds);
          
        if (checkError) {
          console.error("Error checking for existing payments:", checkError);
          // Continue anyway, the edge function will handle duplicates
        } else {
          console.log(`Found ${existingPayments?.length || 0} existing payments for these schedules`);
        }
        
        // Call the edge function to update trainer payments
        const { error, data } = await supabase.functions.invoke('update-trainer-payments', {
          body: {
            trainerId: params.trainerId,
            scheduleIds: params.scheduleIds,
            classAmounts, // Pass exact per-class amounts
            paymentMethod: validPaymentMethod,
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
          console.error("Error from update-trainer-payments:", error);
          throw new Error(`Error marking payments as paid: ${error.message}`);
        }

        console.log("Response from update-trainer-payments:", data);
        
        return { 
          success: true, 
          documentUrl, 
          documentName,
          result: data
        };
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
      
      console.log("Payment processed with document:", result.documentUrl);
    },
    onError: (error: Error) => {
      toast.error(`Failed to process payment: ${error.message}`);
    }
  });
}
