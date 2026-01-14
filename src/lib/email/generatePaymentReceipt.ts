import { supabase } from "@/integrations/supabase/client";
import { PAYMENT_RECEIPT_TEMPLATE, PAYMENT_RECEIPT_SUBJECT } from "./templates/payment-receipt-template";
import { renderTemplate, getVariablesWithSignature, TemplateVariables } from "./template-renderer";
import { format, parseISO } from "date-fns";

/**
 * Fetches the payment receipt email template from the database
 * Falls back to hardcoded template if not found
 */
async function getPaymentReceiptTemplate(branchId: string): Promise<{ template: string; subject: string }> {
  // First try branch_email_templates (branch-specific)
  const { data: branchTemplate } = await supabase
    .from("branch_email_templates")
    .select("content, subject")
    .eq("branch_id", branchId)
    .eq("type", "payment_receipt")
    .eq("is_active", true)
    .maybeSingle();

  if (branchTemplate?.content) {
    console.log("Using branch email template for payment receipt");
    return {
      template: branchTemplate.content,
      subject: branchTemplate.subject || PAYMENT_RECEIPT_SUBJECT,
    };
  }

  // Fallback to hardcoded template
  console.log("Using hardcoded payment receipt template (no branch template found)");
  return {
    template: PAYMENT_RECEIPT_TEMPLATE,
    subject: PAYMENT_RECEIPT_SUBJECT,
  };
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface ReceiptEmailData {
  to_email: string;
  subject: string;
  html_content: string;
  handler_id: string;
  branch_id: string;
}

/**
 * Formats a number as South African Rand
 */
function formatCurrency(amount: number): string {
  return `R ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

/**
 * Generates a payment receipt email for a paid invoice
 * Returns null if handler has no email
 */
export async function generatePaymentReceiptEmail(
  invoiceId: string
): Promise<ReceiptEmailData | null> {
  try {
    // Fetch invoice with all related data
    const { data: invoiceData, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        id,
        invoice_number,
        issued_date,
        payment_date,
        subtotal,
        discount_amount,
        discount_type,
        monetary_discount,
        tax_amount,
        total,
        client_id,
        clients!inner (
          id,
          first_name,
          last_name,
          email,
          branch_id
        )
      `)
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoiceData) {
      console.warn("Could not fetch invoice for receipt email:", invoiceError);
      return null;
    }

    const client = invoiceData.clients as any;
    
    if (!client?.email) {
      console.warn("No email address for client:", client?.id);
      return null;
    }

    // Fetch invoice items
    const { data: itemsData, error: itemsError } = await supabase
      .from("invoice_items")
      .select("description, quantity, unit_price, amount")
      .eq("invoice_id", invoiceId)
      .order("created_at", { ascending: true });

    if (itemsError) {
      console.warn("Could not fetch invoice items:", itemsError);
      return null;
    }

    const items: InvoiceItem[] = itemsData || [];

    // Get branch name for signature
    const { data: branchData } = await supabase
      .from("branches")
      .select("name")
      .eq("id", client.branch_id)
      .single();

    // Build payment summary HTML
    const paymentSummaryHtml = buildPaymentSummaryHtml(invoiceData);

    // Build items breakdown HTML
    const itemsBreakdownHtml = buildItemsBreakdownHtml(items, invoiceData);

    // Build template variables
    const handlerName = `${client.first_name} ${client.last_name}`.trim() || "Valued Client";

    const variables: TemplateVariables = {
      handler_name: handlerName,
      invoice_number: invoiceData.invoice_number,
      payment_summary: paymentSummaryHtml,
      items_breakdown: itemsBreakdownHtml,
      branch_name: branchData?.name || "McKaynine",
    };

    // Fetch the template from database (or fallback to hardcoded)
    const { template, subject: templateSubject } = await getPaymentReceiptTemplate(client.branch_id);

    // Render template with signature
    const variablesWithSignature = getVariablesWithSignature(variables);
    const htmlContent = renderTemplate(template, variablesWithSignature);
    const subject = renderTemplate(templateSubject, { invoice_number: invoiceData.invoice_number });

    return {
      to_email: client.email,
      subject,
      html_content: htmlContent,
      handler_id: client.id,
      branch_id: client.branch_id,
    };
  } catch (error) {
    console.error("Error generating payment receipt email:", error);
    return null;
  }
}

/**
 * Builds HTML for payment summary section
 */
function buildPaymentSummaryHtml(invoice: any): string {
  const paymentDate = invoice.payment_date 
    ? format(parseISO(invoice.payment_date), "dd MMMM yyyy")
    : format(new Date(), "dd MMMM yyyy");
  
  const invoiceDate = format(parseISO(invoice.issued_date), "dd MMMM yyyy");

  return `
    <div style="background-color: #f8f9fa; padding: 24px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #2c5530;">
      <h2 style="margin: 0 0 16px; color: #2c5530; font-size: 18px; font-weight: 600;">💳 Payment Summary</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #555; font-size: 14px;"><strong>Receipt Number:</strong></td>
          <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${invoice.invoice_number}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #555; font-size: 14px;"><strong>Invoice Date:</strong></td>
          <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${invoiceDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #555; font-size: 14px;"><strong>Payment Date:</strong></td>
          <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${paymentDate}</td>
        </tr>
        <tr style="border-top: 2px solid #2c5530;">
          <td style="padding: 12px 0 0; color: #2c5530; font-size: 18px; font-weight: 700;"><strong>Amount Paid:</strong></td>
          <td style="padding: 12px 0 0; color: #2c5530; font-size: 18px; font-weight: 700; text-align: right;">${formatCurrency(invoice.total)}</td>
        </tr>
      </table>
    </div>
  `;
}

/**
 * Builds HTML for items breakdown section
 */
function buildItemsBreakdownHtml(items: InvoiceItem[], invoice: any): string {
  if (items.length === 0) {
    return "";
  }

  const itemRows = items.map(item => `
    <tr>
      <td style="padding: 10px 0; color: #333; font-size: 14px; border-bottom: 1px solid #eee;">${item.description}</td>
      <td style="padding: 10px 0; color: #333; font-size: 14px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
      <td style="padding: 10px 0; color: #333; font-size: 14px; text-align: right; border-bottom: 1px solid #eee;">${formatCurrency(item.unit_price)}</td>
      <td style="padding: 10px 0; color: #333; font-size: 14px; text-align: right; border-bottom: 1px solid #eee;">${formatCurrency(item.amount)}</td>
    </tr>
  `).join("");

  const discount = invoice.monetary_discount || invoice.discount_amount || 0;
  const hasDiscount = discount > 0;

  return `
    <div style="margin: 24px 0;">
      <h3 style="margin: 0 0 16px; color: #2c5530; font-size: 16px; font-weight: 600;">📋 Items</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 12px 0; color: #555; font-size: 12px; text-align: left; text-transform: uppercase; letter-spacing: 0.5px;">Description</th>
            <th style="padding: 12px 0; color: #555; font-size: 12px; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
            <th style="padding: 12px 0; color: #555; font-size: 12px; text-align: right; text-transform: uppercase; letter-spacing: 0.5px;">Price</th>
            <th style="padding: 12px 0; color: #555; font-size: 12px; text-align: right; text-transform: uppercase; letter-spacing: 0.5px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 10px 0; color: #555; font-size: 14px; text-align: right;"><strong>Subtotal:</strong></td>
            <td style="padding: 10px 0; color: #333; font-size: 14px; text-align: right;">${formatCurrency(invoice.subtotal)}</td>
          </tr>
          ${hasDiscount ? `
          <tr>
            <td colspan="3" style="padding: 10px 0; color: #28a745; font-size: 14px; text-align: right;"><strong>Discount:</strong></td>
            <td style="padding: 10px 0; color: #28a745; font-size: 14px; text-align: right;">-${formatCurrency(discount)}</td>
          </tr>
          ` : ""}
          ${invoice.tax_amount > 0 ? `
          <tr>
            <td colspan="3" style="padding: 10px 0; color: #555; font-size: 14px; text-align: right;"><strong>VAT:</strong></td>
            <td style="padding: 10px 0; color: #333; font-size: 14px; text-align: right;">${formatCurrency(invoice.tax_amount)}</td>
          </tr>
          ` : ""}
          <tr style="background-color: #e8f4e9;">
            <td colspan="3" style="padding: 14px 10px; color: #2c5530; font-size: 16px; font-weight: 700; text-align: right;"><strong>Total Paid:</strong></td>
            <td style="padding: 14px 10px; color: #2c5530; font-size: 16px; font-weight: 700; text-align: right;">${formatCurrency(invoice.total)}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 10px 0; color: #555; font-size: 14px; text-align: right;"><strong>Balance Due:</strong></td>
            <td style="padding: 10px 0; color: #28a745; font-size: 14px; font-weight: 600; text-align: right;">R 0.00</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
}
