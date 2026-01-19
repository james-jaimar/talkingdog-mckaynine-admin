
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

    const discountType = (invoiceData.discount_type || 'fixed') as 'fixed' | 'percentage';
    const inputDiscountAmount = Number(invoiceData.discount_amount || 0);

    // Only calculate if we have items and no subtotal/total already set
    if (invoiceData.items && (!invoiceData.subtotal || !invoiceData.total)) {
      const itemsSubtotal = invoiceData.items.reduce(
        (sum: number, item: any) => sum + (item.quantity * item.unit_price),
        0
      );

      // Use canonical calculation utility for totals
      const breakdown = calculateInvoiceComponents({
        courseFee: itemsSubtotal, // Use items total as the course fee
        enrollmentFee: 0, // No enrollment fee for manual invoices
        discount: inputDiscountAmount,
        discountType,
      });

      calculatedData = {
        ...invoiceData,
        subtotal: breakdown.subtotal,
        total: breakdown.total,
        tax_rate: invoiceData.tax_rate || 0,
        monetary_discount: breakdown.monetaryDiscount,
      };

      console.log("Final calculated invoice data:", calculatedData);
    }

    // Normalize discount fields for storage consistency:
    // - fixed: discount_amount = monetary amount (clamped to subtotal)
    // - percentage: discount_amount = percent (0-100), original_discount_amount = percent
    const normalizedSubtotal = Number(calculatedData.subtotal || 0);

    let discount_amount = inputDiscountAmount;
    let monetary_discount = Number(calculatedData.monetary_discount || 0);
    let original_discount_amount: number | null = null;
    let original_discount_type: string | null = null;

    if (discountType === 'percentage') {
      const pct = Math.min(Math.max(inputDiscountAmount, 0), 100);
      discount_amount = pct;
      original_discount_amount = pct;
      original_discount_type = 'percentage';
      // Ensure monetary_discount aligns to pct + subtotal (breakdown already should, but keep robust)
      monetary_discount = normalizedSubtotal > 0 ? (normalizedSubtotal * pct) / 100 : 0;
    } else {
      const fixed = Math.max(inputDiscountAmount, 0);
      discount_amount = Math.min(fixed, normalizedSubtotal);
      original_discount_amount = fixed;
      original_discount_type = 'fixed';
      monetary_discount = discount_amount;
    }

    // Only include fields that exist in the database schema
    // Remove admin_fee, trainer_fee, and franchise_fee from the payload
    // Include branch_id for proper branch attribution (supports multi-branch handlers)
    // Auto-set franchise_report_month based on issued_date for proper reporting
    const issuedDate = new Date(calculatedData.issued_date);
    const franchiseReportMonth = `${issuedDate.getFullYear()}-${String(issuedDate.getMonth() + 1).padStart(2, '0')}`;

    const insertData = {
      client_id: calculatedData.client_id,
      invoice_number: calculatedData.invoice_number,
      status: calculatedData.status,
      issued_date: calculatedData.issued_date,
      due_date: calculatedData.due_date,
      notes: calculatedData.notes,
      tax_rate: calculatedData.tax_rate || 0,
      discount_type: discountType,
      discount_amount,
      discount_reason: calculatedData.discount_reason || '',
      subtotal: calculatedData.subtotal,
      total: calculatedData.total,
      monetary_discount,
      original_discount_amount,
      original_discount_type,
      branch_id: calculatedData.branch_id || null, // Branch from class for proper attribution
      franchise_report_month: franchiseReportMonth, // Auto-set for reporting
    };

    console.log("Inserting invoice with sanitized data:", insertData);

    // First, insert the invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error("Invoice creation error:", error);
      console.error("Error creating invoice with data:", insertData);
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
