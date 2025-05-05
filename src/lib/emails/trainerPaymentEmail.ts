
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PaymentDetailsFormValues } from "@/components/invoices/reports/payment-dialog/PaymentDetailsForm";

interface SendTrainerPaymentEmailParams {
  to: string;
  trainerName: string;
  pdfAttachment?: string;
  amount: number;
  paymentDetails: PaymentDetailsFormValues;
}

export async function sendTrainerPaymentEmail({
  to,
  trainerName,
  pdfAttachment,
  amount,
  paymentDetails
}: SendTrainerPaymentEmailParams): Promise<void> {
  try {
    // Show a toast notification that we're sending the email
    const toastId = toast.loading("Sending payment confirmation email...");
    
    const emailData: any = {
      to,
      trainerName,
      amount,
      paymentDetails: {
        method: paymentDetails.paymentMethod,
        transactionId: paymentDetails.transactionId,
        notes: paymentDetails.paymentNotes
      }
    };
    
    // Only include PDF data if it exists
    if (pdfAttachment) {
      const pdfData = pdfAttachment.split(',')[1]; // Remove the data:application/pdf;base64, part
      emailData.pdfData = pdfData;
    } else if (paymentDetails.documentUrl) {
      // If we have a document URL instead of a PDF attachment, send that
      emailData.documentUrl = paymentDetails.documentUrl;
      emailData.documentName = paymentDetails.documentName || 'Payment Confirmation';
    }
    
    // Call the Supabase Edge Function to send the email
    const { data, error } = await supabase.functions.invoke('send-trainer-payment', {
      body: emailData
    });

    if (error) {
      console.error("Error sending trainer payment email:", error);
      toast.error("Failed to send payment email", {
        id: toastId,
        description: error.message
      });
      throw error;
    }

    console.log("Email sending response:", data);
    toast.success("Payment confirmation email sent successfully", { 
      id: toastId,
      description: `Email sent to ${to}`
    });
    return data;
  } catch (error) {
    console.error("Error in sendTrainerPaymentEmail:", error);
    toast.error("Error sending payment notification email", {
      description: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}
