
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FinancialData } from "./types";

/**
 * Custom hook to fetch financial data with optimized queries and better error handling
 * Always fetches fresh data on every component mount
 */
export function useFinancialQuery(branchId?: string, fromDate?: string, toDate?: string) {
  const queryKey = ['financial-bookings', branchId, fromDate, toDate];

  return useQuery({
    queryKey,
    queryFn: async () => {
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
        
        // Build a single combined query for revenue data
        let totalRevenueQuery = supabase
          .from('invoices')
          .select('id, total, status, subtotal, monetary_discount, client:clients(branch_id)')
          .eq('clients.branch_id', branchId)
          .in('status', ['sent', 'paid', 'overdue']);

        if (fromDate && toDate) {
          totalRevenueQuery = totalRevenueQuery.gte('issued_date', fromDate).lte('issued_date', toDate);
        }

        const { data: invoicesTotal, error: invoiceTotalError } = await totalRevenueQuery;

        if (invoiceTotalError) {
          console.error("Error fetching invoice totals:", invoiceTotalError);
          throw invoiceTotalError;
        }

        const totalRevenueFromInvoices = invoicesTotal?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
        const totalDiscounts = invoicesTotal?.reduce((sum, inv) => sum + (inv.monetary_discount || 0), 0) || 0;

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

        const { data: bookings, error: bookingsError } = await bookingsQuery;

        if (bookingsError) {
          console.error("Error fetching booking data:", bookingsError);
          throw bookingsError;
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

        const { data: invoiceItems, error: invoiceItemsError } = await invoiceQuery;

        if (invoiceItemsError) {
          console.error("Error fetching invoice items:", invoiceItemsError);
          throw invoiceItemsError;
        }

        // Get invoice counts in separate queries with timeout handling
        const fetchCounts = async () => {
          const invalidCountPromise = supabase
            .from('invoices')
            .select('id, client_id, clients!inner(branch_id)', { count: 'exact' })
            .eq('status', 'invalid')
            .eq('clients.branch_id', branchId)
            .gte(fromDate ? 'issued_date' : 'created_at', fromDate || '1970-01-01')
            .lte(toDate ? 'issued_date' : 'created_at', toDate || '2100-01-01');

          const allInvoicesCountPromise = supabase
            .from('invoices')
            .select('id, client_id, clients!inner(branch_id)', { count: 'exact' })
            .eq('clients.branch_id', branchId)
            .in('status', ['sent', 'paid', 'overdue'])
            .gte(fromDate ? 'issued_date' : 'created_at', fromDate || '1970-01-01')
            .lte(toDate ? 'issued_date' : 'created_at', toDate || '2100-01-01');
            
          // Execute queries in parallel
          const [invalidResult, allResult] = await Promise.all([
            invalidCountPromise,
            allInvoicesCountPromise
          ]);
          
          return {
            invalidCount: invalidResult.count || 0,
            invalidError: invalidResult.error,
            allInvoicesCount: allResult.count || 0, 
            countError: allResult.error
          };
        };
        
        const { invalidCount, invalidError, allInvoicesCount, countError } = await fetchCounts();
        
        if (invalidError) {
          console.error("Error counting invalid invoices:", invalidError);
        }

        if (countError) {
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
        console.error("Error in financial data query:", error);
        throw error;
      }
    },
    staleTime: 0, // Always treat data as stale
    retry: 2, // Retry failed requests up to 2 times
    refetchOnWindowFocus: true, // Refetch when window is focused
    refetchOnMount: true, // Always refetch when component mounts
    gcTime: 0, // Don't keep in cache
    refetchInterval: false // Don't auto-refetch on interval
  });
}
