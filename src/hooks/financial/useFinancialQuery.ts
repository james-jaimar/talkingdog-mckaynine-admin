import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FinancialData } from "./types";
import { getCourseFeeAmount, getEnrollmentFeeAmount, applyInvoiceDiscountToItems } from "@/lib/invoiceItemUtils";

/**
 * Simplified financial query hook
 * 
 * Strategy:
 * 1. Fetch invoices filtered by branch, status, and date range
 * 2. Use invoice IDs to fetch invoice_items (no nested join filtering)
 * 3. Use booking IDs from invoice_items to fetch only relevant bookings
 * 4. Apply invoice-level discounts proportionally to items for accurate revenue
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
      // Now using invoice.branch_id for proper branch filtering (supports multi-branch handlers)
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
          monetary_discount,
          discount_type,
          discount_amount,
          branch_id,
          client:client_id (
            id,
            branch_id
          )
        `)
        .eq('branch_id', branchId) // Filter by invoice's branch_id directly
        .in('status', ['sent', 'paid', 'overdue']);

      // Apply date filters using franchise_report_month for monthly reports
      // This respects the report_month_override set on classes
      if (fromDate && toDate) {
        // Extract YYYY-MM from the date range for franchise_report_month filtering
        const fromMonth = fromDate.substring(0, 7); // e.g., "2026-02"
        invoicesQuery = invoicesQuery.eq('franchise_report_month', fromMonth);
      } else if (fromDate) {
        // Fallback to issued_date if only partial range
        invoicesQuery = invoicesQuery.gte('issued_date', fromDate);
      } else if (toDate) {
        invoicesQuery = invoicesQuery.lte('issued_date', toDate);
      }

      const { data: invoices, error: invoicesError } = await invoicesQuery;

      if (invoicesError) {
        console.error("[FinancialQuery] Error fetching invoices:", invoicesError);
        throw invoicesError;
      }

      const invoiceIds = (invoices || []).map(inv => inv.id);
      
      console.log(`[FinancialQuery] Found ${invoices?.length || 0} invoices for branch ${branchId}`);

      // Calculate total revenue from invoices (already filtered by branch_id)
      const totalRevenue = (invoices || []).reduce((sum, inv) => sum + (inv.total || 0), 0);

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
      // First, enhance items with invoice discount info, then apply discounts
      const itemsWithInvoiceData = invoiceItems.map(item => {
        const invoice = invoices.find(inv => inv.id === item.invoice_id);
        return {
          ...item,
          invoices: invoice ? {
            subtotal: invoice.subtotal,
            monetary_discount: invoice.monetary_discount,
            discount_type: invoice.discount_type,
            discount_amount: invoice.discount_amount,
            status: invoice.status
          } : null
        };
      });
      
      // Apply invoice-level discounts to get accurate amounts
      const discountedItems = applyInvoiceDiscountToItems(itemsWithInvoiceData);
      
      const courseFeeRevenue = getCourseFeeAmount(discountedItems);
      const enrollmentFeeRevenue = getEnrollmentFeeAmount(discountedItems);

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

      // CRITICAL: Filter out any bookings where the class branch doesn't match the requested branch
      // This prevents cross-pollination of financial data between branches
      const filteredBookings = bookings.filter(booking => {
        const classBranchId = booking.class_schedules?.classes?.branch_id;
        if (classBranchId && classBranchId !== branchId) {
          console.warn(`[FinancialQuery] Filtering out booking ${booking.id} - class branch ${classBranchId} != requested branch ${branchId}`);
          return false;
        }
        return true;
      });

      console.log(`[FinancialQuery] Found ${bookings.length} bookings, ${filteredBookings.length} after branch filter`);

      // STEP 4: Get invalid invoices count
      const { count: invalidCount, error: invalidError } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'invalid');

      if (invalidError) {
        console.error("[FinancialQuery] Error counting invalid invoices:", invalidError);
      }

      // Enhance invoice items with invoice reference for processor compatibility
      // Include discount information so processor can apply discounts
      const enhancedInvoiceItems = invoiceItems.map(item => {
        const invoice = invoices.find(inv => inv.id === item.invoice_id);
        return {
          ...item,
          invoices: invoice ? {
            id: invoice.id,
            status: invoice.status,
            total: invoice.total,
            subtotal: invoice.subtotal,
            monetary_discount: invoice.monetary_discount,
            discount_type: invoice.discount_type,
            discount_amount: invoice.discount_amount,
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
        bookingsWithInvoices: filteredBookings,
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
    staleTime: 5 * 60 * 1000, // 5 minutes - report data rarely changes
    refetchOnWindowFocus: false,
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
