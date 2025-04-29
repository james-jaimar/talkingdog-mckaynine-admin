
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FinancialData } from "./types";
import { useRef, useEffect } from "react";

/**
 * Custom hook to fetch financial data with optimized queries and better error handling
 * Always fetches fresh data on every component mount
 */
export function useFinancialQuery(
  branchId?: string, 
  fromDate?: string, 
  toDate?: string, 
  externalSignal?: AbortSignal
) {
  const queryKey = ['financial-bookings', branchId, fromDate, toDate];
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Create a new AbortController when dependencies change
  useEffect(() => {
    // Cancel existing query if any
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (err) {
        // Ignore abort errors
        console.log("Ignoring abort error during controller reset");
      }
    }
    
    // Create new controller
    abortControllerRef.current = new AbortController();
    
    // Cleanup on unmount or when dependencies change
    return () => {
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch (err) {
          // Ignore abort errors
          console.log("Ignoring abort error during cleanup");
        }
        abortControllerRef.current = null;
      }
    };
  }, [branchId, fromDate, toDate]);

  return useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      // Use either the signal provided by React Query or our own
      const effectiveSignal = signal || externalSignal || abortControllerRef.current?.signal;
      
      if (!branchId) return {
        bookingsWithInvoices: [],
        allInvoicesCount: 0,
        invalidInvoicesCount: 0,
        totalRevenue: 0,
        totalDiscounts: 0,
        invoiceItems: [],
        classInvoiceMap: []
      } as FinancialData;

      try {
        // Log the fetch attempt for debugging
        console.log(`Fetching fresh financial data for branch ${branchId} from ${fromDate} to ${toDate}`);
        
        // Check if request was cancelled before we even start
        if (effectiveSignal?.aborted) {
          console.log("Signal was already aborted, cancelling financial data fetch");
          throw new DOMException("Query was cancelled", "AbortError");
        }
        
        // Build a single combined query for revenue data
        let totalRevenueQuery = supabase
          .from('invoices')
          .select('id, total, status, subtotal, monetary_discount, client:clients(branch_id)')
          .eq('clients.branch_id', branchId)
          .in('status', ['sent', 'paid', 'overdue']);

        if (fromDate && toDate) {
          totalRevenueQuery = totalRevenueQuery.gte('issued_date', fromDate).lte('issued_date', toDate);
        }

        // Enable abortSignal for this supabase query
        if (effectiveSignal) {
          totalRevenueQuery = totalRevenueQuery.abortSignal(effectiveSignal);
        }

        // Check again if request was cancelled
        if (effectiveSignal?.aborted) {
          console.log("Signal aborted during revenue query setup, cancelling");
          throw new DOMException("Query was cancelled", "AbortError");
        }
        
        const { data: invoicesTotal, error: invoiceTotalError } = await totalRevenueQuery;

        if (invoiceTotalError) {
          // Check if it's an abort error from Supabase
          if (invoiceTotalError.message?.includes?.('The operation was aborted')) {
            console.log("Invoice totals query was aborted");
            throw new DOMException("Query was cancelled", "AbortError");
          }
          console.error("Error fetching invoice totals:", invoiceTotalError);
          throw invoiceTotalError;
        }

        const totalRevenueFromInvoices = invoicesTotal?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
        const totalDiscounts = invoicesTotal?.reduce((sum, inv) => sum + (inv.monetary_discount || 0), 0) || 0;

        // Check again if request was cancelled
        if (effectiveSignal?.aborted) {
          console.log("Signal aborted after revenue calculation, cancelling");
          throw new DOMException("Query was cancelled", "AbortError");
        }
        
        // Efficient query for confirmed bookings with class information
        let bookingsQuery = supabase
          .from('bookings')
          .select(`
            id,
            payment_status,
            class_schedules:class_schedule_id (
              classes:class_id (
                id,
                name,
                course_fee,
                mckaynine_commission_value,
                mckaynine_commission_type,
                admin_fee_value,
                admin_fee_type,
                trainer_fee_value,
                trainer_fee_type
              )
            )
          `)
          .eq('class_schedules.classes.branch_id', branchId)
          .eq('status', 'confirmed');

        if (fromDate && toDate) {
          bookingsQuery = bookingsQuery.gte('created_at', fromDate).lte('created_at', toDate);
        }

        // Enable abortSignal for this supabase query
        if (effectiveSignal) {
          bookingsQuery = bookingsQuery.abortSignal(effectiveSignal);
        }

        // Check again if request was cancelled
        if (effectiveSignal?.aborted) {
          console.log("Signal aborted during bookings query setup, cancelling");
          throw new DOMException("Query was cancelled", "AbortError");
        }
        
        const { data: bookings, error: bookingsError } = await bookingsQuery;

        if (bookingsError) {
          // Check if it's an abort error from Supabase
          if (bookingsError.message?.includes?.('The operation was aborted')) {
            console.log("Bookings query was aborted");
            throw new DOMException("Query was cancelled", "AbortError");
          }
          console.error("Error fetching booking data:", bookingsError);
          throw bookingsError;
        }

        // Check again if request was cancelled
        if (effectiveSignal?.aborted) {
          console.log("Signal aborted after bookings query, cancelling");
          throw new DOMException("Query was cancelled", "AbortError");
        }
        
        // Get invoice items with complete invoice details in a single query
        let invoiceQuery = supabase
          .from('invoice_items')
          .select(`
            id,
            invoice_id,
            booking_id,
            amount,
            unit_price,
            quantity,
            description,
            invoices:invoice_id (
              id,
              status,
              payment_received,
              total,
              subtotal,
              tax_amount,
              discount_amount,
              discount_type,
              monetary_discount,
              client_id,
              issued_date,
              invoice_number,
              client:client_id (
                branch_id
              )
            )
          `)
          .in('invoices.status', ['sent', 'paid', 'overdue']);

        if (fromDate && toDate) {
          invoiceQuery = invoiceQuery.gte('invoices.issued_date', fromDate)
            .lte('invoices.issued_date', toDate);
        }

        // Enable abortSignal for this supabase query
        if (effectiveSignal) {
          invoiceQuery = invoiceQuery.abortSignal(effectiveSignal);
        }

        // Check again if request was cancelled
        if (effectiveSignal?.aborted) {
          console.log("Signal aborted during invoice items query setup, cancelling");
          throw new DOMException("Query was cancelled", "AbortError");
        }
        
        const { data: invoiceItems, error: invoiceItemsError } = await invoiceQuery;

        if (invoiceItemsError) {
          // Check if it's an abort error from Supabase
          if (invoiceItemsError.message?.includes?.('The operation was aborted')) {
            console.log("Invoice items query was aborted");
            throw new DOMException("Query was cancelled", "AbortError");
          }
          console.error("Error fetching invoice items:", invoiceItemsError);
          throw invoiceItemsError;
        }

        // Get invoice counts in separate queries with timeout handling
        const fetchCounts = async () => {
          // Check again if request was cancelled
          if (effectiveSignal?.aborted) {
            console.log("Signal aborted before count queries, cancelling");
            throw new DOMException("Query was cancelled", "AbortError");
          }
          
          const invalidCountPromise = supabase
            .from('invoices')
            .select('id, client_id, clients!inner(branch_id)', { count: 'exact' })
            .eq('status', 'invalid')
            .eq('clients.branch_id', branchId)
            .gte(fromDate ? 'issued_date' : 'created_at', fromDate || '1970-01-01')
            .lte(toDate ? 'issued_date' : 'created_at', toDate || '2100-01-01')
            .abortSignal(effectiveSignal);

          const allInvoicesCountPromise = supabase
            .from('invoices')
            .select('id, client_id, clients!inner(branch_id)', { count: 'exact' })
            .eq('clients.branch_id', branchId)
            .in('status', ['sent', 'paid', 'overdue'])
            .gte(fromDate ? 'issued_date' : 'created_at', fromDate || '1970-01-01')
            .lte(toDate ? 'issued_date' : 'created_at', toDate || '2100-01-01')
            .abortSignal(effectiveSignal);
            
          try {
            // Execute queries in parallel
            const [invalidResult, allResult] = await Promise.all([
              invalidCountPromise,
              allInvoicesCountPromise
            ]);
            
            // Check again if request was cancelled
            if (effectiveSignal?.aborted) {
              console.log("Signal aborted after count queries, cancelling");
              throw new DOMException("Query was cancelled", "AbortError");
            }
            
            return {
              invalidCount: invalidResult.count || 0,
              invalidError: invalidResult.error,
              allInvoicesCount: allResult.count || 0, 
              countError: allResult.error
            };
          } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
              console.log("Count queries were aborted");
              throw error;
            }
            // Return defaults with the error
            return {
              invalidCount: 0,
              invalidError: error,
              allInvoicesCount: 0,
              countError: error
            };
          }
        };
        
        let invalidCount = 0;
        let invalidError = null;
        let allInvoicesCount = 0;
        let countError = null;
        
        try {
          const counts = await fetchCounts();
          invalidCount = counts.invalidCount;
          invalidError = counts.invalidError;
          allInvoicesCount = counts.allInvoicesCount;
          countError = counts.countError;
        } catch (error) {
          // If this is an abort error, propagate it
          if (error instanceof DOMException && error.name === 'AbortError') {
            throw error;
          }
          console.error("Error fetching counts:", error);
        }
        
        if (invalidError && !effectiveSignal?.aborted) {
          console.error("Error counting invalid invoices:", invalidError);
        }

        if (countError && !effectiveSignal?.aborted) {
          console.error("Error counting invoices:", countError);
        }

        // Filter invoice items to match branch
        const filteredInvoiceItems = invoiceItems?.filter(item => 
          item.invoices?.client?.branch_id === branchId
        ) || [];

        // Create an empty class invoice map (will be populated by the processor)
        const classInvoiceMap: Array<{className: string, invoiceIds: string[]}> = [];

        console.log(`Successfully fetched financial data for branch ${branchId}: ${filteredInvoiceItems.length} invoice items, ${allInvoicesCount} invoices total`);
        
        return {
          bookingsWithInvoices: bookings || [],
          allInvoicesCount: allInvoicesCount || 0,
          invalidInvoicesCount: invalidCount || 0,
          totalRevenue: totalRevenueFromInvoices,
          totalDiscounts,
          invoiceItems: filteredInvoiceItems,
          classInvoiceMap
        } as FinancialData;
      } catch (error) {
        // Handle AbortError properly
        if (
          error instanceof DOMException && error.name === "AbortError" ||
          error?.name === 'CancelledError' ||
          error?.message?.includes?.('cancelled') ||
          error?.message?.includes?.('aborted')
        ) {
          console.log("Financial data query was cancelled");
          throw new DOMException("Query was cancelled", "AbortError"); // Re-throw for React Query to handle
        } else {
          console.error("Error in financial data query:", error);
          throw error;
        }
      }
    },
    staleTime: 0, // Always treat data as stale
    retry: 1, // Reduced from 2 to 1 to minimize retries on cancelled requests
    retryOnMount: true, // Retry when component mounts
    refetchOnWindowFocus: true, // Refetch when window is focused
    refetchOnMount: true, // Always refetch when component mounts
    gcTime: 0, // Don't keep in cache
    refetchInterval: false, // Don't auto-refetch on interval
    // Extra safety for cancelled queries
    throwOnError: (error) => {
      if (
        error instanceof DOMException && error.name === 'AbortError' ||
        error?.name === 'CancelledError' ||
        error?.message?.includes?.('cancelled')
      ) {
        console.log("Suppressing cancelled query error");
        return false;
      }
      return true;
    }
  });
}
