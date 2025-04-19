
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InvoiceFormValues } from "../types";
import { toast } from "sonner";
import { handleMutationError } from "./useMutationUtils";

/**
 * Hook to update an existing invoice
 */
export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invoiceId, values }: { invoiceId: string, values: InvoiceFormValues }) => {
      // Calculate subtotal
      const subtotal = values.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      
      // Calculate discount - fixed amount or percentage of subtotal
      let discount_amount = values.discount_amount;
      if (values.discount_type === 'percentage') {
        // Store the actual calculated amount, not the percentage
        discount_amount = (subtotal * values.discount_amount) / 100;
      }
      
      // Calculate tax amount based on subtotal minus discount
      const tax_amount = (subtotal - discount_amount) * (values.tax_rate / 100);
      
      // Calculate total: subtotal - discount + tax
      const total = subtotal - discount_amount + tax_amount;

      console.log("Invoice update calculations:", {
        subtotal,
        discount_type: values.discount_type,
        discount_amount_input: values.discount_amount,
        calculated_discount: discount_amount,
        tax_rate: values.tax_rate,
        tax_amount,
        total
      });

      // Update invoice
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          client_id: values.client_id,
          invoice_number: values.invoice_number,
          status: values.status,
          issued_date: values.issued_date.toISOString(),
          due_date: values.due_date.toISOString(),
          notes: values.notes || null,
          subtotal,
          tax_rate: values.tax_rate,
          tax_amount,
          total,
          discount_amount,
          discount_type: values.discount_type,
          discount_reason: values.discount_reason || null
        })
        .eq('id', invoiceId);

      if (invoiceError) throw invoiceError;

      // Delete existing items
      const { error: deleteError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId);

      if (deleteError) throw deleteError;

      // Insert new items
      const itemsToInsert = values.items.map(item => ({
        invoice_id: invoiceId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.quantity * item.unit_price,
        booking_id: item.booking_id || null
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      return { id: invoiceId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
      toast.success("Invoice updated successfully");
    },
    onError: (error: Error) => {
      handleMutationError(error, "Failed to update invoice");
    },
  });
}
