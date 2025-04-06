
import { supabase } from "@/integrations/supabase/client";

// Generate invoice number
export async function generateInvoiceNumber(): Promise<string> {
  try {
    const { count, error } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error("Error generating invoice number:", error);
      return `INV-${new Date().getFullYear()}-0001`;
    }
    
    const nextNumber = (count || 0) + 1;
    const year = new Date().getFullYear();
    return `INV-${year}-${nextNumber.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error("Error generating invoice number:", error);
    return `INV-${new Date().getFullYear()}-0001`;
  }
}
