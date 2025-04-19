
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
      console.log("Starting invoice update for ID:", invoiceId);
      console.log("Update values:", values);
      
      if (!invoiceId) {
        throw new Error("Invoice ID is required for update");
      }

      try {
        // Calculate subtotal
        const subtotal = values.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        
        // Normalize discount values
        const discount_type = values.discount_type || 'fixed';
        const discount_amount = Number(values.discount_amount || 0);
        
        // For percentage discounts, ensure the value is between 0-100
        if (discount_type === 'percentage' && (discount_amount < 0 || discount_amount > 100)) {
          throw new Error("Percentage discount must be between 0 and 100");
        }
        
        // Let the database trigger handle the actual discount calculations
        const updateData = {
          client_id: values.client_id,
          invoice_number: values.invoice_number,
          status: values.status,
          issued_date: values.issued_date.toISOString(),
          due_date: values.due_date.toISOString(),
          notes: values.notes || null,
          subtotal,
          tax_rate: values.tax_rate,
          discount_amount, // This will be interpreted by the trigger based on discount_type
          discount_type,   // The trigger will handle percentage vs fixed calculation
          discount_reason: values.discount_reason || null
        };

        // Update invoice
        const { error: invoiceError, data: updatedInvoice } = await supabase
          .from('invoices')
          .update(updateData)
          .eq('id', invoiceId)
          .select('*')
          .single();

        if (invoiceError) {
          console.error("Error updating invoice:", invoiceError);
          throw invoiceError;
        }

        console.log("Invoice updated successfully:", updatedInvoice);

        // Delete existing items
        const { error: deleteError } = await supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', invoiceId);

        if (deleteError) {
          console.error("Error deleting invoice items:", deleteError);
          throw deleteError;
        }

        // Insert new items
        const itemsToInsert = values.items.map(item => ({
          invoice_id: invoiceId,
          description: item.description || "Invoice item",
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          amount: (item.quantity || 1) * (item.unit_price || 0),
          booking_id: item.booking_id || null
        }));

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error("Error inserting invoice items:", itemsError);
          throw itemsError;
        }

        return { id: invoiceId, success: true };
      } catch (error) {
        console.error("Invoice update failed with error:", error);
        throw error;
      }
    },
    onSuccess: (result, variables) => {
      console.log("Invoice update successful, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
      toast.success("Invoice updated successfully");
    },
    onError: (error: Error) => {
      console.error("Invoice update error in mutation:", error);
      handleMutationError(error, "Failed to update invoice");
    },
  });
}
