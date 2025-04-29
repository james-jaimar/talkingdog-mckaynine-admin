
import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceItem } from "@/hooks/invoices/types";
import { toast } from "sonner";

/**
 * Fetch the base invoice data with client information
 */
export async function fetchInvoiceWithClient(invoiceId: string): Promise<Invoice> {
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select(`
      *,
      clients:client_id (id, first_name, last_name, email, phone, address, city, postal_code)
    `)
    .eq('id', invoiceId)
    .single();

  if (invoiceError) {
    console.error("Error fetching invoice:", invoiceError);
    toast.error("Could not retrieve invoice details");
    throw invoiceError;
  }

  if (!invoice) {
    toast.error("Invoice not found");
    throw new Error("Invoice not found");
  }

  console.log("Fetched invoice data:", invoice);
  return invoice as Invoice;
}

/**
 * Fetch invoice items for a specific invoice
 */
export async function fetchInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
  const { data: items, error: itemsError } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoiceId);

  if (itemsError) {
    console.error("Error fetching invoice items:", itemsError);
    toast.error("Could not retrieve invoice items");
    return [];
  }

  console.log("Fetched invoice items:", items);
  return items as InvoiceItem[];
}

/**
 * Create a default invoice item when no items exist
 */
export function createDefaultInvoiceItem(total: number): InvoiceItem {
  console.log("Creating a default item based on invoice total");
  return {
    id: 'default-item',
    description: "Training services",
    quantity: 1,
    unit_price: total,
    amount: total
  };
}
