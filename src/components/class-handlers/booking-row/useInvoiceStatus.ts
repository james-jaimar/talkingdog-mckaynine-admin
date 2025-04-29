import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRef, useEffect } from "react";

export function useInvoiceStatus(bookingId: string) {
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Create a new AbortController when bookingId changes
  useEffect(() => {
    // Cancel existing query if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new controller
    abortControllerRef.current = new AbortController();
    
    // Cleanup on unmount or when bookingId changes
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [bookingId]);

  return useQuery({
    queryKey: ['booking-invoice', bookingId],
    queryFn: async ({ signal }) => {
      // Use either the signal provided by React Query or our own
      const effectiveSignal = signal || abortControllerRef.current?.signal;
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
          .eq('booking_id', bookingId)
          .abortSignal(effectiveSignal); // Use the abort signal with Supabase

        if (error) {
          console.error("Error fetching invoice data:", error);
          throw error;
        }

        // Check if signal was aborted
        if (effectiveSignal?.aborted) {
          throw new DOMException("Query was cancelled", "AbortError");
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
        // Handle AbortError properly
        if (err instanceof DOMException && err.name === "AbortError") {
          console.log(`Invoice status query for booking ${bookingId} was cancelled`);
          throw err; // Re-throw for React Query to handle
        } else {
          console.error(`Error in useInvoiceStatus for booking ${bookingId}:`, err);
          // Return null instead of throwing to prevent UI lockups
          return null;
        }
      }
    },
    staleTime: 0, // Always treat as stale data
    refetchOnMount: true, // Refetch on every mount
    refetchOnWindowFocus: true, // Refetch when window focuses
    retry: 1, // Limit retries to prevent excessive requests on error
    gcTime: 5000, // Only keep in cache for 5 seconds
  });
}
