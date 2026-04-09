
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InvoiceFormValues } from "../types";
import { toast } from "sonner";
import { handleMutationError } from "./useMutationUtils";
import { calculateInvoiceComponents } from "@/lib/calculateInvoiceComponents";
import { issueCreditNote } from "../useIOSync";

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

        // Calculate discount and expenses using canonical utility
        const discount_type = values.discount_type || 'fixed';
        const original_discount_amount = Number(values.discount_amount || 0);
        const breakdown = calculateInvoiceComponents({
          courseFee: subtotal,
          enrollmentFee: 0,
          discount: original_discount_amount,
          discountType: discount_type,
        });

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

        // Calculate tax and total
        const taxable_amount = subtotal - monetary_discount;
        const tax_amount = taxable_amount * (values.tax_rate / 100);
        const total = subtotal - monetary_discount + tax_amount;

        // Update invoice with all calculated fields 
        // (removed expense breakdown fields that don't exist in DB)
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
          monetary_discount,
          original_discount_amount,
          original_discount_type: discount_type,
          // Removed expense breakdown fields that don't exist in the DB schema
        };

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

        // If invoice was previously synced to IO, credit-note the old document and clear sync fields
        if (updatedInvoice.io_document_id) {
          console.log("[IO Sync] Invoice was synced to IO, issuing credit note and clearing sync fields...");
          
          try {
            await issueCreditNote(invoiceId);
          } catch (err) {
            console.warn("[IO Sync] Credit note failed (non-blocking):", err);
          }
          
          // Clear IO sync fields so next sync creates a fresh document
          await supabase
            .from('invoices')
            .update({
              io_document_id: null,
              io_invoice_number: null,
              io_invoice_url: null,
              io_sync_status: null,
              io_synced_at: null,
              io_sync_error: null,
              io_client_id: null,
              io_payment_id: null,
              io_payment_url: null,
            })
            .eq('id', invoiceId);
          
          console.log("[IO Sync] IO sync fields cleared - will re-sync on next email/pay action");
        }

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
          booking_id: item.booking_id || null,
          io_inventory_code: item.io_inventory_code || null,
          item_type: item.item_type || 'course_fee',
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
