
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InvoiceFormValues } from "../types";
import { toast } from "sonner";
import { handleMutationError } from "./useMutationUtils";

/**
 * Hook to create a new invoice
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: InvoiceFormValues) => {
      try {
        console.log("Creating invoice with values:", values);
        console.log("Using invoice number:", values.invoice_number);
        
        // Calculate subtotal
        const subtotal = values.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        
        // Calculate discount amount based on type
        let discount_amount = 0;
        
        if (values.discount_type === 'percentage') {
          // For percentage type, calculate the actual amount based on the percentage input
          // Ensure the percentage is between 0-100
          const percentage = Math.min(Math.max(values.discount_amount || 0, 0), 100);
          discount_amount = (subtotal * percentage) / 100;
        } else {
          // For fixed type, use the input directly but ensure it doesn't exceed the subtotal
          discount_amount = Math.min(values.discount_amount || 0, subtotal);
        }
        
        // Ensure discount doesn't create a negative amount
        discount_amount = Math.max(0, Math.min(discount_amount, subtotal));
        
        // Calculate tax on the amount after discount
        const taxable_amount = subtotal - discount_amount;
        const tax_amount = taxable_amount * (values.tax_rate / 100);
        
        // Calculate total: subtotal - discount + tax
        const total = subtotal - discount_amount + tax_amount;
        
        console.log("Invoice calculations:", {
          subtotal,
          discount_type: values.discount_type,
          discount_input: values.discount_amount,
          calculated_discount_amount: discount_amount,
          tax_rate: values.tax_rate,
          tax_amount,
          total
        });

        // Insert invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
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
          .select('*')
          .single();

        if (invoiceError) {
          console.error("Error creating invoice:", invoiceError);
          throw invoiceError;
        }

        console.log("Invoice created successfully:", invoice);

        // Insert invoice items
        const itemsToInsert = values.items.map(item => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.quantity * item.unit_price,
          booking_id: item.booking_id || null
        }));

        console.log("Inserting invoice items:", itemsToInsert);

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error("Error creating invoice items:", itemsError);
          throw itemsError;
        }

        // Log success message
        console.log("Invoice items inserted successfully");

        return invoice;
      } catch (error) {
        console.error("Error creating invoice:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Invoice mutation completed successfully, invalidating queries");
      
      // Immediately invalidate all relevant queries with refetch
      queryClient.invalidateQueries({ queryKey: ['invoices'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['invoice', data.id], refetchType: 'all' }); 
      queryClient.invalidateQueries({ queryKey: ['client-invoices', data.client_id], refetchType: 'all' }); 
      queryClient.invalidateQueries({ queryKey: ['my-invoices'], refetchType: 'all' });
      
      // Force an immediate refetch of the invoices list
      queryClient.refetchQueries({ queryKey: ['invoices'], type: 'all' });
      
      toast.success("Invoice created successfully");
    },
    onError: (error: any) => {
      handleMutationError(error, "Failed to create invoice");
    },
  });
}
