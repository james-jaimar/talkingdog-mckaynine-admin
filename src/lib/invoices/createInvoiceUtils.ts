
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { calculateInvoiceComponents } from "@/lib/calculateInvoiceComponents";

/**
 * Centralized utility for creating invoices with improved error handling
 * and validation
 */
export async function createInvoice(invoiceData: any) {
  try {
    // Validate required fields
    const requiredFields = ['client_id', 'invoice_number', 'status', 'issued_date', 'due_date'];
    const missingFields = requiredFields.filter(field => !invoiceData[field]);
    
    if (missingFields.length > 0) {
      const errorMessage = `Missing required fields: ${missingFields.join(', ')}`;
      console.error(errorMessage, invoiceData);
      throw new Error(errorMessage);
    }

    // Validate items array if provided
    if (invoiceData.items && (!Array.isArray(invoiceData.items) || invoiceData.items.length === 0)) {
      const errorMessage = "Invoice items must be a non-empty array";
      console.error(errorMessage, invoiceData);
      throw new Error(errorMessage);
    }

    // Log the full invoice data for debugging
    console.log("Creating invoice with validated data:", JSON.stringify(invoiceData, null, 2));
    
    // Calculate invoice components if not already done
    let calculatedData = { ...invoiceData };
    
    // Only calculate if we have items and no subtotal/total already set
    if (invoiceData.items && (!invoiceData.subtotal || !invoiceData.total)) {
      const subtotal = invoiceData.items.reduce(
        (sum: number, item: any) => sum + (item.quantity * item.unit_price), 0
      );
      
      // Use canonical calculation utility
      const breakdown = calculateInvoiceComponents({
        courseFee: subtotal, // Use items total as the course fee
        enrollmentFee: 0, // No enrollment fee for manual invoices
        discount: invoiceData.discount_amount || 0,
        discountType: invoiceData.discount_type || 'fixed',
        adminFeeRate: invoiceData.adminFeeRate || 0,
        trainerFeeRate: invoiceData.trainerFeeRate || 0,
        franchiseFeeRate: invoiceData.franchiseFeeRate || 0,
      });

      calculatedData = {
        ...invoiceData,
        subtotal: breakdown.subtotal,
        total: breakdown.total,
        monetary_discount: breakdown.monetaryDiscount,
        admin_fee: breakdown.adminFee,
        trainer_fee: breakdown.trainerFee,
        franchise_fee: breakdown.franchiseFee
      };
      
      console.log("Final calculated invoice data:", calculatedData);
    }

    // First, insert the invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        client_id: calculatedData.client_id,
        invoice_number: calculatedData.invoice_number,
        status: calculatedData.status,
        issued_date: calculatedData.issued_date,
        due_date: calculatedData.due_date,
        notes: calculatedData.notes,
        tax_rate: calculatedData.tax_rate || 0,
        discount_type: calculatedData.discount_type || 'fixed',
        discount_amount: calculatedData.discount_amount || 0,
        discount_reason: calculatedData.discount_reason || '',
        subtotal: calculatedData.subtotal,
        total: calculatedData.total,
        monetary_discount: calculatedData.monetary_discount,
        admin_fee: calculatedData.admin_fee || 0,
        trainer_fee: calculatedData.trainer_fee || 0,
        franchise_fee: calculatedData.franchise_fee || 0
      })
      .select()
      .single();
    
    if (error) {
      console.error("Invoice creation error:", error);
      console.error("Error creating invoice with data:", calculatedData);
      throw new Error(`Failed to create invoice: ${error.message}`);
    }
    
    if (!invoice) {
      throw new Error("Invoice creation failed, no data returned");
    }
    
    console.log("Invoice created successfully:", invoice);
    
    // Then insert all the invoice items if provided
    if (calculatedData.items && calculatedData.items.length > 0) {
      // Map items to include the invoice_id
      const itemsWithInvoiceId = calculatedData.items.map((item: any) => ({
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
        // Don't fail the whole operation, but log the error
        console.warn("Invoice created but items failed to insert. Manual cleanup may be needed.");
        toast.warning("Invoice created but some items may be missing.");
      }
    }
    
    toast.success("Invoice created successfully");
    return invoice;
  } catch (error: any) {
    console.error("Invoice creation failed:", error);
    
    // Enhanced error reporting
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    
    // Provide user-friendly error message
    const userMessage = error.message || "Unknown error creating invoice";
    toast.error(`Invoice creation failed: ${userMessage}`);
    throw error;
  }
}
