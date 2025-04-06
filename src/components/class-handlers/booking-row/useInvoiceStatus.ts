
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useInvoiceStatus(bookingId: string) {
  return useQuery({
    queryKey: ['booking-invoice', bookingId],
    queryFn: async () => {
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
        .eq('booking_id', bookingId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}
