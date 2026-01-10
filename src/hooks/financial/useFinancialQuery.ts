
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FinancialData } from "./types";

export function useFinancialQuery(branchId?: string, fromDate?: string, toDate?: string) {
  const queryClient = useQueryClient();
  const invoicesKey = ['invoices', branchId];
  const invoicesData = queryClient.getQueryData(invoicesKey);

  return useQuery({
    queryKey: ['financial-bookings', branchId, fromDate, toDate, invoicesData],
    queryFn: async () => {
      if (!branchId) return {
        bookingsWithInvoices: [],
        allInvoicesCount: 0,
        invalidInvoicesCount: 0,
        totalRevenue: 0,
        invoiceItems: [],
        invoices: [],
        branchId: null
      } as FinancialData;

      console.log(`Fetching financial data for branch ${branchId} from ${fromDate} to ${toDate}`);

      // Get all valid invoices for this branch - directly using the invoices table
      let invoicesQuery = supabase
        .from('invoices')
        .select(`
          id,
          total, 
          status,
          client_id,
          issued_date,
          client:client_id (branch_id)
        `)
        .eq('client.branch_id', branchId)
        .in('status', ['sent', 'paid', 'overdue']);

      if (fromDate && toDate) {
        invoicesQuery = invoicesQuery.gte('issued_date', fromDate).lte('issued_date', toDate);
      }

      const { data: invoices, error: invoicesError } = await invoicesQuery;

      if (invoicesError) {
        console.error("Error fetching invoices:", invoicesError);
        throw invoicesError;
      }

      console.log(`Found ${invoices?.length || 0} invoices for branch ${branchId}`);

      // Verify all invoices actually belong to the correct branch
      const validInvoices = invoices.filter(inv => 
        !inv.client?.branch_id || inv.client.branch_id === branchId
      );

      if (validInvoices.length !== invoices.length) {
        console.warn(
          `Filtered out ${invoices.length - validInvoices.length} invoices that don't match branch ${branchId}`
        );
      }

      // Calculate total revenue directly from invoices total column
      const totalRevenueFromInvoices = validInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

      // Set up query for confirmed bookings with their class information
      let query = supabase
        .from('bookings')
        .select(`
          id,
          payment_status,
          client_id,
          clients:client_id (branch_id),
          class_schedules:class_schedule_id (
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
        .eq('status', 'confirmed');
      
      // Additional filter to ensure we only get bookings for the correct branch
      // Either filter by the class's branch_id or by the client's branch_id
      query = query
        .eq('clients.branch_id', branchId)
        .eq('class_schedules.classes.branch_id', branchId);

      // NOTE: Do NOT filter bookings by created_at date - booking dates can be corrupted
      // Instead, we rely on invoice_items to link invoices (filtered by issued_date) to bookings
      // This ensures we get all bookings that are linked to invoices in the selected date range

      const { data: bookings, error: bookingsError } = await query;

      if (bookingsError) {
        console.error("Error fetching booking data for financial report:", bookingsError);
        throw bookingsError;
      }

      // Verify all bookings actually have the correct branch
      const validBookings = bookings.filter(booking => 
        (!booking.clients?.branch_id || booking.clients.branch_id === branchId) &&
        (!booking.class_schedules?.classes?.branch_id || booking.class_schedules.classes.branch_id === branchId)
      );
      
      if (validBookings.length !== bookings.length) {
        console.warn(
          `Filtered out ${bookings.length - validBookings.length} bookings that don't match branch ${branchId}`
        );
      }

      console.log(`Found ${validBookings?.length || 0} valid bookings for branch ${branchId}`);

      // Get invoice items with full invoice details - we'll still need this to link invoices to bookings
      // IMPORTANT: Include item_type to distinguish course fees from enrollment fees
      let invoiceItemsQuery = supabase
        .from('invoice_items')
        .select(`
          id,
          invoice_id,
          booking_id,
          amount,
          unit_price,
          quantity,
          description,
          item_type,
          invoices:invoice_id (
            id,
            status,
            payment_received,
            total,
            subtotal,
            tax_amount,
            client_id,
            issued_date,
            invoice_number,
            client:client_id (
              branch_id
            )
          )
        `)
        .in('invoices.status', ['sent', 'paid', 'overdue']);
        
      // Add branch filter to invoice items
      invoiceItemsQuery = invoiceItemsQuery
        .eq('invoices.client.branch_id', branchId);

      if (fromDate && toDate) {
        invoiceItemsQuery = invoiceItemsQuery
          .gte('invoices.issued_date', fromDate)
          .lte('invoices.issued_date', toDate);
      }

      const { data: invoiceItems, error: invoiceItemsError } = await invoiceItemsQuery;

      if (invoiceItemsError) {
        console.error("Error fetching invoice items:", invoiceItemsError);
        throw invoiceItemsError;
      }

      console.log(`Found ${invoiceItems?.length || 0} invoice items for branch ${branchId}`);

      // Double-check that invoice items are for the correct branch
      const validInvoiceItems = invoiceItems?.filter(item => 
        !item.invoices?.client?.branch_id || item.invoices?.client?.branch_id === branchId
      );

      if (validInvoiceItems?.length !== invoiceItems?.length) {
        console.warn(
          `Filtered out ${(invoiceItems?.length || 0) - (validInvoiceItems?.length || 0)} invoice items that don't match branch ${branchId}`
        );
      }

      // Get invalid invoices count
      let invalidQuery = supabase
        .from('invoices')
        .select('id, client:client_id (branch_id)', { count: 'exact' })
        .eq('status', 'invalid')
        .eq('client.branch_id', branchId);

      if (fromDate && toDate) {
        invalidQuery = invalidQuery.gte('issued_date', fromDate).lte('issued_date', toDate);
      }

      const { count: invalidCount, error: invalidError } = await invalidQuery;

      if (invalidError) {
        console.error("Error counting invalid invoices:", invalidError);
      }

      // Get all invoices count
      let countQuery = supabase
        .from('invoices')
        .select('id, client:client_id (branch_id)', { count: 'exact' })
        .eq('client.branch_id', branchId)
        .in('status', ['sent', 'paid', 'overdue']);

      if (fromDate && toDate) {
        countQuery = countQuery.gte('issued_date', fromDate).lte('issued_date', toDate);
      }

      const { count: allInvoicesCount, error: countError } = await countQuery;

      if (countError) {
        console.error("Error counting invoices:", countError);
      }
      
      // Final validation log
      console.log(`Financial data for branch ${branchId}: ` +
                 `${validInvoices.length} invoices, ` +
                 `${validBookings.length} bookings, ` +
                 `${validInvoiceItems?.length} invoice items, ` +
                 `total revenue: ${totalRevenueFromInvoices}`);

      // Cast the result to FinancialData to ensure TypeScript compatibility
      const result: FinancialData = {
        bookingsWithInvoices: validBookings || [],
        allInvoicesCount: allInvoicesCount || 0,
        invalidInvoicesCount: invalidCount || 0,
        totalRevenue: totalRevenueFromInvoices,
        invoiceItems: validInvoiceItems || [],
        invoices: validInvoices || [],
        branchId // Include branchId in the result for reference
      };
      
      return result;
    },
    enabled: !!branchId,
    staleTime: 30000,
    refetchOnWindowFocus: true,
    gcTime: 10 * 60 * 1000,
  });
}
