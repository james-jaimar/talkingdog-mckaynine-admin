
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InvoiceFormValues } from "../types";
import { toast } from "sonner";
import { handleMutationError } from "./useMutationUtils";
import { calculateInvoiceComponents } from "@/lib/calculateInvoiceComponents";

/**
 * Hook to create a new invoice
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: InvoiceFormValues) => {
      try {
        console.log("Creating invoice with values:", values);

        // Check if this invoice number already exists
        const { data: existingInvoice } = await supabase
          .from('invoices')
          .select('id')
          .eq('invoice_number', values.invoice_number)
          .maybeSingle();
        if (existingInvoice) {
          throw new Error(`Invoice number ${values.invoice_number} already exists. Please use a different number.`);
        }

        // Calculate subtotal, discount, and expense breakdowns using canonical utility
        const subtotal = values.items.reduce((sum, item) => {
          const itemAmount = item.quantity * item.unit_price;
          console.log(`Item: ${item.description}, Amount: ${itemAmount}`);
          return sum + itemAmount;
        }, 0);

        // Call canonical breakdown utility (will always be used for these amounts)
        const breakdown = calculateInvoiceComponents({
          courseFee: subtotal,
          enrollmentFee: 0,
          discount: values.discount_amount,
          discountType: values.discount_type,
          adminFeeRate: 0,
          trainerFeeRate: 0,
          franchiseFeeRate: 0,
        });

        // Calculate discount amount based on type
        let discount_amount = 0;
        const original_discount_input = values.discount_amount || 0;
        if (values.discount_type === 'percentage') {
          const percentage = Math.min(Math.max(original_discount_input, 0), 100);
          discount_amount = (subtotal * percentage) / 100;
        } else {
          discount_amount = Math.min(original_discount_input, subtotal);
        }

        // Calculate tax and total
        const taxable_amount = subtotal - discount_amount;
        const tax_amount = taxable_amount * (values.tax_rate / 100);
        const total = subtotal - discount_amount + tax_amount;

        // Insert invoice with all calculated fields, ensure expense breakdown fields exist
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
            discount_amount: values.discount_type === 'percentage'
              ? original_discount_input
              : discount_amount,
            discount_type: values.discount_type,
            discount_reason: values.discount_reason || null,
            monetary_discount: discount_amount,
            original_discount_amount: original_discount_input,
            original_discount_type: values.discount_type,
            // EXPENSE BREAKDOWN - ALWAYS present (even if zero)
            admin_fee: breakdown.adminFee,
            trainer_fee: breakdown.trainerFee,
            franchise_fee: breakdown.franchiseFee,
          })
          .select('*')
          .single();
        if (invoiceError) {
          console.error("Error creating invoice:", invoiceError);
          throw invoiceError;
        }

        // Insert all items with correct amounts
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
          console.error("Error inserting invoice items:", itemsError);
          throw itemsError;
        }

        // Verify the final invoice total matches our calculated total
        const { data: finalInvoice, error: finalInvoiceError } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', invoice.id)
          .single();

        if (finalInvoiceError) {
          console.error("Error fetching final invoice:", finalInvoiceError);
        } else if (finalInvoice && Math.abs(finalInvoice.total - total) > 0.01) {
          console.warn(`Warning: Final invoice total (${finalInvoice.total}) doesn't match calculated total (${total})`);
        }

        return invoice;
      } catch (error) {
        console.error("Invoice creation failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Invoice mutation completed successfully, invalidating queries");

      queryClient.invalidateQueries({ queryKey: ['invoices'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['invoice', data.id], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['client-invoices', data.client_id], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['my-invoices'], refetchType: 'all' });
      queryClient.refetchQueries({ queryKey: ['invoices'], type: 'all' });

      toast.success("Invoice created successfully");
    },
    onError: (error: any) => {
      handleMutationError(error, "Failed to create invoice");
    },
  });
}
