
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useInvoiceStatus(bookingId: string) {
  return useQuery({
    queryKey: ['booking-invoice', bookingId],
    queryFn: async () => {
      console.log(`Fetching invoice status for booking ${bookingId}`);
      
      try {
        // First check for invoice items linked to this booking
        const { data, error } = await supabase
          .from('invoice_items')
          .select(`
            invoice_id,
            invoices:invoice_id (
              id,
              status,
              payment_received,
              invoice_number
            )
          `)
          .eq('booking_id', bookingId);

        if (error) {
          console.error("Error fetching invoice data:", error);
          throw error;
        }

        // Filter out any null invoice data and log what we found
        const validInvoices = data?.filter(item => item.invoices) || [];
        
        if (validInvoices.length > 0) {
          console.log(`Found ${validInvoices.length} invoices for booking ${bookingId}:`, validInvoices);
          
          // Check if any invoice is paid
          const paidInvoice = validInvoices.find(item => 
            item.invoices && 
            (item.invoices.payment_received === true || item.invoices.status === 'paid')
          );
          
          if (paidInvoice) {
            console.log(`Booking ${bookingId} has a paid invoice:`, paidInvoice);
            return {
              invoices: paidInvoice.invoices,
              isPaid: true
            };
          }
          
          // Return the first invoice if no paid invoice was found
          return {
            invoices: validInvoices[0].invoices,
            isPaid: false
          };
        }
        
        console.log(`No invoices found for booking ${bookingId}`);
        return null;
      } catch (err) {
        console.error(`Error in useInvoiceStatus for booking ${bookingId}:`, err);
        // Return null instead of throwing to prevent UI lockups
        return null;
      }
    },
    staleTime: 10000, // 10 seconds
    refetchOnWindowFocus: true,
    retry: 1, // Limit retries to prevent excessive requests on error
    meta: {
      // Add onSettled to ensure UI is always released, even on error
      onSettled: () => {
        // Ensure any UI locks are released
        setTimeout(() => {
          document.body.style.pointerEvents = '';
        }, 100);
      }
    }
  });
}
