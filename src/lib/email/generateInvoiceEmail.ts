import { supabase } from "@/integrations/supabase/client";
import { renderTemplate, getVariablesWithSignature, TemplateVariables } from "./template-renderer";
import { format, parseISO } from "date-fns";

// Default invoice email template
const DEFAULT_INVOICE_TEMPLATE = `
<p>Dear {{handler_name}},</p>

<p>Please find attached your invoice <strong>{{invoice_number}}</strong> dated {{invoice_date}}.</p>

<h3>Invoice Summary</h3>
<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
  <tr style="background-color: #f5f5f5;">
    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Invoice Number</strong></td>
    <td style="padding: 10px; border: 1px solid #ddd;">{{invoice_number}}</td>
  </tr>
  <tr>
    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Invoice Date</strong></td>
    <td style="padding: 10px; border: 1px solid #ddd;">{{invoice_date}}</td>
  </tr>
  <tr style="background-color: #f5f5f5;">
    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Due Date</strong></td>
    <td style="padding: 10px; border: 1px solid #ddd;">{{due_date}}</td>
  </tr>
  <tr>
    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Amount</strong></td>
    <td style="padding: 10px; border: 1px solid #ddd;"><strong>{{total_amount}}</strong></td>
  </tr>
</table>

<p>Please ensure payment is made by the due date.</p>

<p>If you have any questions about this invoice, please don't hesitate to contact us.</p>

<p>Kind regards,<br>
{{signature}}</p>
`;

const DEFAULT_INVOICE_SUBJECT = "Invoice {{invoice_number}} from McKaynine";

/**
 * Fetches the invoice email template from the database
 * Falls back to hardcoded template if not found
 */
async function getInvoiceTemplate(branchId: string): Promise<{ template: string; subject: string }> {
  // First try branch_email_templates (branch-specific)
  const { data: branchTemplate } = await supabase
    .from("branch_email_templates")
    .select("content, subject")
    .eq("branch_id", branchId)
    .eq("type", "invoice")
    .eq("is_active", true)
    .maybeSingle();

  if (branchTemplate?.content) {
    console.log("Using branch email template for invoice");
    return {
      template: branchTemplate.content,
      subject: branchTemplate.subject || DEFAULT_INVOICE_SUBJECT,
    };
  }

  // Fallback to hardcoded template
  console.log("Using hardcoded invoice template (no branch template found)");
  return {
    template: DEFAULT_INVOICE_TEMPLATE,
    subject: DEFAULT_INVOICE_SUBJECT,
  };
}

/**
 * Formats a number as South African Rand
 */
function formatCurrency(amount: number): string {
  return `R ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

interface Invoice {
  id: string;
  invoice_number: string;
  issued_date?: string;
  due_date?: string;
  total?: number;
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
  };
  client_id?: string;
  branch_id?: string;
}

/**
 * Generate invoice email subject
 */
export function generateInvoiceEmailSubject(invoice: Invoice): string {
  return DEFAULT_INVOICE_SUBJECT.replace("{{invoice_number}}", invoice.invoice_number);
}

/**
 * Generate invoice email HTML content
 */
export async function generateInvoiceEmailHtml(invoice: Invoice): Promise<string> {
  // Get branch_id from invoice
  let branchId = invoice.branch_id;
  
  if (!branchId) {
    const { data: invoiceDetails } = await supabase
      .from('invoices')
      .select('branch_id')
      .eq('id', invoice.id)
      .single();
    branchId = invoiceDetails?.branch_id;
  }
  
  if (!branchId) {
    throw new Error("Invoice does not have a branch assigned");
  }
  
  // Get the template
  const { template } = await getInvoiceTemplate(branchId);
  
  // Format dates
  const invoiceDate = invoice.issued_date 
    ? format(parseISO(invoice.issued_date), "d MMMM yyyy")
    : format(new Date(), "d MMMM yyyy");
    
  const dueDate = invoice.due_date
    ? format(parseISO(invoice.due_date), "d MMMM yyyy")
    : "On receipt";
  
  // Build handler name
  const handlerName = invoice.client
    ? `${invoice.client.first_name} ${invoice.client.last_name}`
    : "Valued Customer";
  
  // Build variables
  const variables: TemplateVariables = {
    handler_name: handlerName,
    invoice_number: invoice.invoice_number,
    invoice_date: invoiceDate,
    due_date: dueDate,
    total_amount: formatCurrency(invoice.total || 0),
  };
  
  // Get signature and render
  const variablesWithSignature = getVariablesWithSignature(variables);
  
  return renderTemplate(template, variablesWithSignature);
}
