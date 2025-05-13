
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Invoice, InvoiceItem } from "./types";
import { useBranch } from "@/context/BranchContext";

/**
 * Hook to fetch invoices with items that have no booking associations
 */
export function useProblematicInvoices() {
  const { currentBranch } = useBranch();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['problematic-invoices', currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch?.id) return { invoices: [], count: 0 };

      // Get invoices with items that don't have booking associations
      const { data: problematicInvoices, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          client_id,
          clients:client_id (id, first_name, last_name, email),
          status,
          total,
          created_at
        `)
        .eq('clients.branch_id', currentBranch.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching problematic invoices:", error);
        toast.error("Failed to load problematic invoices");
        return { invoices: [], count: 0 };
      }

      // Now get invoice items for these invoices
      if (!problematicInvoices || problematicInvoices.length === 0) {
        return { invoices: [], count: 0 };
      }

      const invoiceIds = problematicInvoices.map(inv => inv.id);
      
      const { data: items, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .in('invoice_id', invoiceIds);

      if (itemsError) {
        console.error("Error fetching invoice items:", itemsError);
        return { invoices: problematicInvoices, count: 0 };
      }

      // Group items by invoice_id
      const itemsByInvoice = items?.reduce((acc, item) => {
        if (!acc[item.invoice_id]) {
          acc[item.invoice_id] = [];
        }
        acc[item.invoice_id].push(item);
        return acc;
      }, {} as Record<string, InvoiceItem[]>) || {};

      // Filter invoices that have items without booking IDs
      const problematic = problematicInvoices.filter(invoice => {
        const invoiceItems = itemsByInvoice[invoice.id] || [];
        return invoiceItems.some(item => !item.booking_id);
      });

      return { 
        invoices: problematic as Invoice[], 
        count: problematic.length,
        itemsByInvoice
      };
    },
    enabled: !!currentBranch?.id,
  });

  /**
   * Mutation to fix a problematic invoice item by linking it to a booking
   */
  const linkInvoiceItemToBooking = useMutation({
    mutationFn: async ({ 
      invoiceItemId, 
      bookingId 
    }: { 
      invoiceItemId: string;
      bookingId: string;
    }) => {
      const { error } = await supabase
        .from('invoice_items')
        .update({ booking_id: bookingId })
        .eq('id', invoiceItemId);

      if (error) {
        console.error("Error linking invoice item to booking:", error);
        throw error;
      }

      return { success: true };
    },
    onSuccess: () => {
      toast.success("Invoice item linked to booking successfully");
      queryClient.invalidateQueries({ queryKey: ['problematic-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['financial-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error) => {
      toast.error(`Failed to link invoice item: ${error.message}`);
    }
  });

  return {
    ...query,
    linkInvoiceItemToBooking
  };
}
