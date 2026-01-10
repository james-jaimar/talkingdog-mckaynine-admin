import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FinancialData } from "./types";
import { getCourseFeeAmount, getEnrollmentFeeAmount } from "@/lib/invoiceItemUtils";

/**
 * Simplified financial query hook
 * 
 * Strategy:
 * 1. Fetch invoices filtered by branch, status, and date range
 * 2. Use invoice IDs to fetch invoice_items (no nested join filtering)
 * 3. Use booking IDs from invoice_items to fetch only relevant bookings
 * 
 * This eliminates nested join filtering issues and ensures data consistency.
 */
export function useFinancialQuery(branchId?: string, fromDate?: string, toDate?: string) {
  return useQuery({
    // Simple, deterministic query key - no cached objects
    queryKey: ['financial-data', branchId, fromDate, toDate],
    queryFn: async (): Promise<FinancialData> => {
      if (!branchId) {
        return {
          bookingsWithInvoices: [],
          allInvoicesCount: 0,
          invalidInvoicesCount: 0,
          totalRevenue: 0,
          courseFeeRevenue: 0,
          enrollmentFeeRevenue: 0,
          invoiceItems: [],
          invoices: [],
          branchId: undefined
        };
      }

      console.log(`[FinancialQuery] Fetching for branch ${branchId}, dates: ${fromDate} to ${toDate}`);

      // STEP 1: Fetch invoices for this branch with date/status filters
      let invoicesQuery = supabase
        .from('invoices')
        .select(`
          id,
          total,
          subtotal,
          status,
          client_id,
          issued_date,
          invoice_number,
          client:client_id (
            id,
            branch_id
          )
        `)
        .in('status', ['sent', 'paid', 'overdue']);

      // Apply date filters if provided
      if (fromDate) {
        invoicesQuery = invoicesQuery.gte('issued_date', fromDate);
      }
      if (toDate) {
        invoicesQuery = invoicesQuery.lte('issued_date', toDate);
      }

      const { data: allInvoices, error: invoicesError } = await invoicesQuery;

      if (invoicesError) {
        console.error("[FinancialQuery] Error fetching invoices:", invoicesError);
        throw invoicesError;
      }

      // Filter invoices to only include those for this branch
      const invoices = (allInvoices || []).filter(inv => 
        inv.client?.branch_id === branchId
      );

      const invoiceIds = invoices.map(inv => inv.id);
      
      console.log(`[FinancialQuery] Found ${invoices.length} invoices for branch (filtered from ${allInvoices?.length || 0} total)`);

      // Calculate total revenue from filtered invoices
      const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

      // STEP 2: Fetch invoice items by invoice IDs (simple IN query, no nested filters)
      let invoiceItems: any[] = [];
      
      if (invoiceIds.length > 0) {
        // Supabase has a limit on IN queries, batch if needed
        const batchSize = 100;
        const batches = [];
        
        for (let i = 0; i < invoiceIds.length; i += batchSize) {
          batches.push(invoiceIds.slice(i, i + batchSize));
        }

        for (const batch of batches) {
          const { data: batchItems, error: itemsError } = await supabase
            .from('invoice_items')
            .select(`
              id,
              invoice_id,
              booking_id,
              amount,
              unit_price,
              quantity,
              description,
              item_type
            `)
            .in('invoice_id', batch);

          if (itemsError) {
            console.error("[FinancialQuery] Error fetching invoice items:", itemsError);
            throw itemsError;
          }

          invoiceItems = invoiceItems.concat(batchItems || []);
        }
      }

      console.log(`[FinancialQuery] Found ${invoiceItems.length} invoice items`);

      // Count items with and without booking_id for debugging
      const itemsWithBooking = invoiceItems.filter(item => item.booking_id).length;
      const itemsWithoutBooking = invoiceItems.filter(item => !item.booking_id).length;
      console.log(`[FinancialQuery] Items with booking_id: ${itemsWithBooking}, without: ${itemsWithoutBooking}`);

      // Calculate course fee and enrollment fee from invoice items
      const courseFeeRevenue = getCourseFeeAmount(invoiceItems);
      const enrollmentFeeRevenue = getEnrollmentFeeAmount(invoiceItems);

      // STEP 3: Get unique booking IDs from invoice items and fetch only those bookings
      const bookingIds = [...new Set(invoiceItems
        .map(item => item.booking_id)
        .filter(Boolean)
      )];

      console.log(`[FinancialQuery] Fetching ${bookingIds.length} bookings referenced by invoice items`);

      let bookings: any[] = [];
      
      if (bookingIds.length > 0) {
        // Batch booking queries if needed
        const batchSize = 100;
        const batches = [];
        
        for (let i = 0; i < bookingIds.length; i += batchSize) {
          batches.push(bookingIds.slice(i, i + batchSize));
        }

        for (const batch of batches) {
          const { data: batchBookings, error: bookingsError } = await supabase
            .from('bookings')
            .select(`
              id,
              payment_status,
              client_id,
              clients:client_id (
                id,
                branch_id
              ),
              class_schedules:class_schedule_id (
                id,
                classes:class_id (
                  id,
                  name,
                  course_fee,
                  mckaynine_commission_type,
                  mckaynine_commission_value,
                  admin_fee_type,
                  admin_fee_value,
                  trainer_fee_value,
                  trainer_fee_type,
                  branch_id
                )
              )
            `)
            .in('id', batch);

          if (bookingsError) {
            console.error("[FinancialQuery] Error fetching bookings:", bookingsError);
            throw bookingsError;
          }

          bookings = bookings.concat(batchBookings || []);
        }
      }

      console.log(`[FinancialQuery] Found ${bookings.length} bookings`);

      // STEP 4: Get invalid invoices count
      const { count: invalidCount, error: invalidError } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'invalid');

      if (invalidError) {
        console.error("[FinancialQuery] Error counting invalid invoices:", invalidError);
      }

      // Enhance invoice items with invoice reference for processor compatibility
      const enhancedInvoiceItems = invoiceItems.map(item => {
        const invoice = invoices.find(inv => inv.id === item.invoice_id);
        return {
          ...item,
          invoices: invoice ? {
            id: invoice.id,
            status: invoice.status,
            total: invoice.total,
            client: invoice.client
          } : null
        };
      });

      // Summary log
      console.log(`[FinancialQuery] Summary for branch ${branchId}:
        - Invoices: ${invoices.length}
        - Invoice items: ${invoiceItems.length}
        - Bookings: ${bookings.length}
        - Total revenue: R${totalRevenue.toFixed(2)}
        - Course fees: R${courseFeeRevenue.toFixed(2)}
        - Enrollment fees: R${enrollmentFeeRevenue.toFixed(2)}`);

      return {
        bookingsWithInvoices: bookings,
        allInvoicesCount: invoices.length,
        invalidInvoicesCount: invalidCount || 0,
        totalRevenue,
        courseFeeRevenue,
        enrollmentFeeRevenue,
        invoiceItems: enhancedInvoiceItems,
        invoices,
        branchId
      };
    },
    enabled: !!branchId,
    staleTime: 30000,
    refetchOnWindowFocus: true,
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
