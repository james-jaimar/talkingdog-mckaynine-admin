
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
        invoiceItems: []
      } as FinancialData;

      console.log(`Fetching financial data for branch ${branchId} from ${fromDate} to ${toDate}`);

      // Get all valid invoices for this branch
      let totalRevenueQuery = supabase
        .from('invoices')
        .select('id, total, status, client:client_id (branch_id)')
        .eq('client.branch_id', branchId)
        .in('status', ['sent', 'paid', 'overdue']);

      if (fromDate && toDate) {
        totalRevenueQuery = totalRevenueQuery.gte('issued_date', fromDate).lte('issued_date', toDate);
      }

      const { data: invoicesTotal, error: invoiceTotalError } = await totalRevenueQuery;

      if (invoiceTotalError) {
        console.error("Error fetching invoice totals:", invoiceTotalError);
      }

      // Calculate total revenue (using the total field which is already after discounts)
      const totalRevenueFromInvoices = invoicesTotal?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

      // Set up query for confirmed bookings with their class information
      let query = supabase
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
        query = query.gte('created_at', fromDate).lte('created_at', toDate);
      }

      const { data: bookings, error: bookingsError } = await query;

      if (bookingsError) {
        console.error("Error fetching booking data for financial report:", bookingsError);
        throw bookingsError;
      }

      // Get invoice items with full invoice details
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

      // Get invalid invoices count - fix the query to include client in the select
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

      // Get all invoices count - fix the query to include client in the select
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

      // Cast the result to FinancialData to ensure TypeScript compatibility
      const result: FinancialData = {
        bookingsWithInvoices: bookings || [],
        allInvoicesCount: allInvoicesCount || 0,
        invalidInvoicesCount: invalidCount || 0,
        totalRevenue: totalRevenueFromInvoices,
        invoiceItems: invoiceItems?.filter(item => 
          item.invoices?.client?.branch_id === branchId
        ) || []
      };
      
      return result;
    },
    enabled: !!branchId,
    staleTime: 30000,
    refetchOnWindowFocus: true,
    gcTime: 10 * 60 * 1000,
  });
}
