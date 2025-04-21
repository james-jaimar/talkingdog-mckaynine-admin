
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
        // Calculate subtotal correctly from all items
        const subtotal = values.items.reduce((sum, item) => {
          const itemAmount = (item.quantity || 1) * (item.unit_price || 0);
          console.log(`Item: ${item.description}, Amount: ${itemAmount}`);
          return sum + itemAmount;
        }, 0);
        
        console.log(`Calculated subtotal from items: ${subtotal}`);
        
        // Normalize discount values
        const discount_type = values.discount_type || 'fixed';
        const original_discount_amount = Number(values.discount_amount || 0);
        
        // For percentage discounts, ensure the value is between 0-100
        if (discount_type === 'percentage' && (original_discount_amount < 0 || original_discount_amount > 100)) {
          throw new Error("Percentage discount must be between 0 and 100");
        }
        
        // Calculate monetary discount
        let monetary_discount = 0;
        if (discount_type === 'percentage') {
          monetary_discount = subtotal * (original_discount_amount / 100);
        } else {
          monetary_discount = Math.min(original_discount_amount, subtotal);
        }
        
        console.log(`Discount: ${monetary_discount} (${discount_type}, original: ${original_discount_amount})`);
        
        // Calculate tax and total
        const taxable_amount = subtotal - monetary_discount;
        const tax_amount = taxable_amount * (values.tax_rate / 100);
        const total = subtotal - monetary_discount + tax_amount;
        
        console.log(`Final calculations:
          - Subtotal: ${subtotal}
          - Taxable amount: ${taxable_amount}
          - Tax amount (${values.tax_rate}%): ${tax_amount}
          - Total: ${total}`);
          
        // Update invoice with all calculated fields
        const updateData = {
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
          discount_type,
          discount_amount: discount_type === 'percentage' ? original_discount_amount : monetary_discount,
          discount_reason: values.discount_reason || null,
          // Explicitly add these fields to ensure correct values
          monetary_discount,
          original_discount_amount,
          original_discount_type: discount_type
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

        // Insert new items with correct amounts
        const itemsToInsert = values.items.map(item => ({
          invoice_id: invoiceId,
          description: item.description || "Invoice item",
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          amount: (item.quantity || 1) * (item.unit_price || 0),
          booking_id: item.booking_id || null
        }));
        
        console.log("Inserting updated invoice items:", itemsToInsert);

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error("Error inserting invoice items:", itemsError);
          throw itemsError;
        }
        
        // Verify the final invoice total matches our calculated total
        const { data: finalInvoice, error: finalInvoiceError } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', invoiceId)
          .single();
          
        if (finalInvoiceError) {
          console.error("Error fetching final updated invoice:", finalInvoiceError);
          // Continue anyway
        } else if (finalInvoice && Math.abs(finalInvoice.total - total) > 0.01) {
          console.warn(`Warning: Final updated invoice total (${finalInvoice.total}) doesn't match calculated total (${total})`);
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
