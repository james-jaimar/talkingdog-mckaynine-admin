
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

/**
 * Hook for marking an invoice as sent
 */
export function useMarkInvoiceAsSent() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async ({ 
      invoiceId, 
      clientId,
      sendEmail = false
    }: { 
      invoiceId: string; 
      clientId: string;
      sendEmail?: boolean;
    }) => {
      // Update the invoice status to 'sent'
      const { data, error } = await supabase
        .from('invoices')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .select()
        .single();
        
      if (error) {
        console.error("Error marking invoice as sent:", error);
        throw error;
      }
      
      // If email sending was requested, call the function to send it
      if (sendEmail) {
        try {
          const { error: emailError } = await supabase.functions.invoke('send-invoice', {
            body: {
              invoiceId,
              clientId
            }
          });
          
          if (emailError) {
            throw emailError;
          }
        } catch (emailError) {
          console.error("Error sending invoice email:", emailError);
          // Continue with the update even if email fails
          toast.error(`Invoice marked as sent, but email failed to send: ${(emailError as Error).message}`);
        }
      }
      
      // Run cleanup function for any duplicate trainer payments
      try {
        // Use only the parameters that are valid
        await supabase.rpc('calculate_trainer_payment', {
          p_booking_id: null
        });
      } catch (cleanupError) {
        console.error("Error cleaning up duplicate trainer payments:", cleanupError);
        // This is not critical for the invoice status update, so continue
      }
      
      return data;
    },
    
    // Handle success
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
      
      // Show success toast
      toast.success("Invoice marked as sent", {
        description: variables.sendEmail ? 
          "Email with invoice was also sent to the client" :
          "Invoice status updated but no email was sent",
        action: {
          label: "View",
          onClick: () => navigate(`/invoices/${variables.invoiceId}`),
        },
      });
      
      // Try to run the trainer payment cleanup again
      try {
        // Use only the parameters that are valid
        supabase.rpc('calculate_trainer_payment', {
          p_booking_id: null
        });
      } catch (error) {
        console.error("Error in secondary cleanup attempt:", error);
      }
    },
    
    // Handle error
    onError: (error) => {
      toast.error(`Failed to mark invoice as sent: ${(error as Error).message}`);
    }
  });
}
