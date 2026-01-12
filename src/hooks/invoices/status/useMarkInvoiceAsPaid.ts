
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateClassConfirmationEmail } from "@/lib/email/generateClassConfirmation";

/**
 * Hook to mark an invoice as paid
 * Also queues a class confirmation email automatically
 */
export function useMarkInvoiceAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      console.log(`Marking invoice ${invoiceId} as paid`);
      
      // Get current timestamp for payment date
      const paymentDate = new Date().toISOString();
      
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          payment_received: true,
          payment_date: paymentDate
        })
        .eq('id', invoiceId);

      if (error) {
        console.error("Error marking invoice as paid:", error);
        throw error;
      }

      console.log(`Successfully marked invoice ${invoiceId} as paid with payment date ${paymentDate}`);
      return { id: invoiceId };
    },
    onSuccess: async (_, invoiceId) => {
      // Invalidate all relevant queries to ensure data is refreshed
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['financial-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['classes-list-data'] });
      
      // Generate and queue class confirmation email
      try {
        const emailData = await generateClassConfirmationEmail(invoiceId);
        
        if (emailData) {
          const { error: queueError } = await supabase
            .from("email_queue")
            .insert({
              branch_id: emailData.branch_id,
              to_email: emailData.to_email,
              subject: emailData.subject,
              html_content: emailData.html_content,
              handler_id: emailData.handler_id,
              status: "pending",
            });

          if (queueError) {
            console.warn("Could not queue confirmation email:", queueError);
            toast.success("Invoice marked as paid");
          } else {
            console.log("Class confirmation email queued for:", emailData.to_email);
            toast.success("Invoice marked as paid - confirmation email queued");
          }
        } else {
          toast.success("Invoice marked as paid");
        }
      } catch (emailError) {
        console.warn("Error queueing confirmation email:", emailError);
        toast.success("Invoice marked as paid");
      }
    },
    onError: (error: Error) => {
      console.error("Error marking invoice as paid:", error);
      toast.error("Failed to update invoice status");
    },
  });
}
