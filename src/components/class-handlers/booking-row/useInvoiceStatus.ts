
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRef, useEffect } from "react";

export function useInvoiceStatus(bookingId: string) {
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Create a new AbortController when bookingId changes
  useEffect(() => {
    // Cancel existing query if any
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (err) {
        console.log("Ignoring abort error during controller reset");
      }
    }
    
    // Create new controller
    abortControllerRef.current = new AbortController();
    
    // Cleanup on unmount or when bookingId changes
    return () => {
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch (err) {
          console.log("Ignoring abort error during cleanup");
        }
        abortControllerRef.current = null;
      }
    };
  }, [bookingId]);

  return useQuery({
    queryKey: ['booking-invoice', bookingId],
    queryFn: async ({ signal }) => {
      // Use either the signal provided by React Query or our own
      const effectiveSignal = signal || abortControllerRef.current?.signal;
      
      if (!bookingId) {
        return null;
      }
      
      try {
        // Check if request was cancelled before we even start
        if (effectiveSignal?.aborted) {
          throw new DOMException("Query was cancelled", "AbortError");
        }
        
        // First check for invoice items linked to this booking
        let query = supabase
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
          
        // Apply abort signal if available
        if (effectiveSignal) {
          query = query.abortSignal(effectiveSignal);
        }
        
        const { data, error } = await query;

        if (error) {
          if (error.message?.includes?.('The operation was aborted')) {
            throw new DOMException("Query was cancelled", "AbortError");
          }
          throw error;
        }

        // Check if signal was aborted
        if (effectiveSignal?.aborted) {
          throw new DOMException("Query was cancelled", "AbortError");
        }

        // Filter out any null invoice data
        const validInvoices = data?.filter(item => item.invoices) || [];
        
        if (validInvoices.length > 0) {
          // Check if any invoice is paid
          const paidInvoice = validInvoices.find(item => 
            item.invoices && 
            (item.invoices.payment_received === true || item.invoices.status === 'paid')
          );
          
          if (paidInvoice) {
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
        
        return null;
      } catch (err) {
        // Handle AbortError properly
        if (
          err instanceof DOMException && err.name === "AbortError" ||
          err?.name === 'CancelledError' ||
          err?.message?.includes?.('cancelled') ||
          err?.message?.includes?.('aborted')
        ) {
          throw err; // Re-throw for React Query to handle
        } else {
          console.error(`Error in useInvoiceStatus for booking ${bookingId}:`, err);
          return null;
        }
      }
    },
    staleTime: 0, // Always treat as stale data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 1,
    gcTime: 5000
  });
}
