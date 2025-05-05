
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PaymentDetailsFormValues } from "@/components/invoices/reports/payment-dialog/PaymentDetailsForm";

interface SendTrainerPaymentEmailParams {
  to: string;
  trainerName: string;
  pdfAttachment: string;
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
    toast.info("Sending payment confirmation email...");
    
    const pdfData = pdfAttachment.split(',')[1]; // Remove the data:application/pdf;base64, part
    
    // Call the Supabase Edge Function to send the email
    const { data, error } = await supabase.functions.invoke('send-trainer-payment', {
      body: {
        to,
        trainerName,
        pdfData,
        amount,
        paymentDetails: {
          method: paymentDetails.paymentMethod,
          transactionId: paymentDetails.transactionId,
          notes: paymentDetails.paymentNotes
        }
      }
    });

    if (error) {
      console.error("Error sending trainer payment email:", error);
      toast.error("Failed to send payment email");
      throw error;
    }

    console.log("Email sending response:", data);
    toast.success("Payment confirmation email sent successfully");
    return data;
  } catch (error) {
    console.error("Error in sendTrainerPaymentEmail:", error);
    toast.error("Error sending payment notification email");
    throw error;
  }
}
