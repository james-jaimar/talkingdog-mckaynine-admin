
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
        
        // Normalize discount values to prevent issues
        let discount_amount = 0;
        const discount_type = values.discount_type || 'fixed';
        const original_discount_input = Number(values.discount_amount || 0);
        
        // Calculate the actual monetary discount amount based on type
        if (discount_type === 'percentage') {
          // For percentage type, store the percentage directly but calculate the monetary value
          const percentage = Math.min(Math.max(original_discount_input, 0), 100);
          const discount_monetary_value = (subtotal * percentage) / 100;
          discount_amount = original_discount_input; // Store original percentage for percentage type
        } else {
          // For fixed type, ensure it doesn't exceed subtotal
          discount_amount = Math.min(original_discount_input, subtotal);
        }
        
        // Calculate tax on the amount after discount
        const taxable_amount = discount_type === 'percentage' ? 
          subtotal - ((subtotal * original_discount_input) / 100) : 
          subtotal - discount_amount;
          
        const tax_amount = taxable_amount * (values.tax_rate / 100);
        
        // Calculate total: subtotal - discount + tax
        const total = discount_type === 'percentage' ?
          subtotal - ((subtotal * original_discount_input) / 100) + tax_amount :
          subtotal - discount_amount + tax_amount;

        console.log("Invoice update calculations:", {
          subtotal,
          discount_type,
          discount_input: original_discount_input,
          calculated_discount_amount: discount_type === 'percentage' ? 
            ((subtotal * original_discount_input) / 100) : discount_amount,
          tax_rate: values.tax_rate,
          tax_amount,
          total
        });

        // Create invoice update object with properly formatted fields
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
          discount_amount,
          discount_type,
          discount_reason: values.discount_reason || null
        };

        // Update invoice
        const { error: invoiceError, data: updatedInvoice } = await supabase
          .from('invoices')
          .update(updateData)
          .eq('id', invoiceId)
          .select('*');

        if (invoiceError) {
          console.error("Error updating invoice:", invoiceError);
          if (invoiceError.message) {
            console.error("Error message:", invoiceError.message);
          }
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

        console.log("Old invoice items deleted successfully");

        // Insert new items
        const itemsToInsert = values.items.map(item => ({
          invoice_id: invoiceId,
          description: item.description || "Invoice item",
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          amount: (item.quantity || 1) * (item.unit_price || 0),
          booking_id: item.booking_id || null
        }));

        console.log("Inserting new invoice items:", itemsToInsert);

        if (itemsToInsert.length === 0) {
          console.warn("No items to insert - creating default item");
          itemsToInsert.push({
            invoice_id: invoiceId,
            description: "Invoice item",
            quantity: 1,
            unit_price: subtotal,
            amount: subtotal,
            booking_id: null
          });
        }

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error("Error inserting invoice items:", itemsError);
          throw itemsError;
        }

        console.log("New invoice items inserted successfully");
        return { id: invoiceId, success: true };
      } catch (error: any) {
        console.error("Invoice update failed with error:", error);
        // Provide more detailed error information
        if (error.details) {
          console.error("Error details:", error.details);
        }
        if (error.hint) {
          console.error("Error hint:", error.hint);
        }
        if (error.message) {
          console.error("Error message:", error.message);
        }
        throw error;
      }
    },
    onSuccess: (result, variables) => {
      console.log("Invoice update successful, invalidating queries", result);
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
