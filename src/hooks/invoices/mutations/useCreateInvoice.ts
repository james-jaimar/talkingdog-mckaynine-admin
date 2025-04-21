
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { handleMutationError } from "./useMutationUtils";

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (invoiceData: any) => {
      try {
        console.log("Creating invoice with data:", invoiceData);
        
        // First, insert the invoice
        const { data: invoice, error } = await supabase
          .from('invoices')
          .insert({
            client_id: invoiceData.client_id,
            invoice_number: invoiceData.invoice_number,
            status: invoiceData.status,
            issued_date: invoiceData.issued_date,
            due_date: invoiceData.due_date,
            notes: invoiceData.notes,
            tax_rate: invoiceData.tax_rate,
            discount_type: invoiceData.discount_type,
            discount_amount: invoiceData.discount_amount,
            discount_reason: invoiceData.discount_reason,
            // Use subtotal/total if provided, otherwise they'll be calculated by DB triggers
            subtotal: invoiceData.subtotal,
            total: invoiceData.total,
            monetary_discount: invoiceData.monetary_discount,
            admin_fee: invoiceData.admin_fee,
            trainer_fee: invoiceData.trainer_fee,
            franchise_fee: invoiceData.franchise_fee
          })
          .select()
          .single();
        
        if (error) {
          console.error("Error creating invoice:", error);
          throw new Error("Failed to create invoice: " + error.message);
        }
        
        if (!invoice) {
          throw new Error("Invoice creation failed, no data returned");
        }
        
        console.log("Invoice created:", invoice);
        
        // Then insert all the invoice items
        if (invoiceData.items && invoiceData.items.length > 0) {
          // Map items to include the invoice_id
          const itemsWithInvoiceId = invoiceData.items.map((item: any) => ({
            invoice_id: invoice.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.quantity * item.unit_price,
            booking_id: item.booking_id || null
          }));
          
          console.log("Inserting invoice items:", itemsWithInvoiceId);
          
          const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(itemsWithInvoiceId);
          
          if (itemsError) {
            console.error("Error creating invoice items:", itemsError);
            throw new Error("Failed to create invoice items: " + itemsError.message);
          }
        }
        
        toast.success("Invoice created successfully");
        return invoice;
      } catch (error: any) {
        console.error("Invoice creation failed:", error);
        toast.error("Invoice creation failed: " + (error.message || "Unknown error"));
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['my-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['client-invoices'] });
    },
    onError: (error) => {
      handleMutationError(error, "Failed to create invoice");
    },
  });
}
