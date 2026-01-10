/**
 * Generates invoice email content for preview/editing
 * Mirrors the logic in supabase/functions/send-invoice/email-sender.ts
 */

import { Invoice } from "@/types/invoice";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { BRANCH_SIGNATURES, BANKING_DETAILS, BranchSignature } from "@/lib/email/email-wrapper";

// McKaynine brand blue color
const BRAND_BLUE = "#3b82f6";

interface InvoiceEmailContent {
  subject: string;
  greeting: string;
  mainMessage: string;
  signOff: string;
  signature: BranchSignature;
  isPaid: boolean;
  showBankingDetails: boolean;
}

/**
 * Get the signature for a branch
 */
function getSignatureForBranch(branchName?: string): BranchSignature {
  if (branchName?.toLowerCase().includes("randburg")) {
    return BRANCH_SIGNATURES["Randburg"];
  }
  return BRANCH_SIGNATURES["Delta"];
}

/**
 * Generate the default email content for an invoice
 */
export function generateInvoiceEmailContent(
  invoice: Invoice,
  clientName: string,
  branchName: string
): InvoiceEmailContent {
  const isPaid = invoice.status === 'paid';
  
  return {
    subject: `Invoice #${invoice.invoice_number} from ${branchName || 'McKaynine'}`,
    greeting: `Dear ${clientName},`,
    mainMessage: `Please find attached your invoice #${invoice.invoice_number} for the amount of ${formatCurrency(invoice.total)}.`,
    signOff: "If you have any questions regarding this invoice, please don't hesitate to contact us.",
    signature: getSignatureForBranch(branchName),
    isPaid,
    showBankingDetails: !isPaid,
  };
}

/**
 * Generate the signature HTML
 */
function getSignatureHtml(signature: BranchSignature): string {
  const companyLine = signature.company ? `${signature.company}<br>` : '';
  
  return `<p style="margin: 20px 0 0 0; font-size: 14px; color: #333333; line-height: 1.6;">
    <strong style="color: #2c5530;">${signature.name}</strong><br>
    ${signature.title}<br>
    📞 ${signature.phone}<br>
    ${companyLine}✉️ <a href="mailto:${signature.email}" style="color: #3b82f6; text-decoration: none;">${signature.email}</a><br>
    🌐 <a href="https://${signature.website}" style="color: #3b82f6; text-decoration: none;">${signature.website}</a>
  </p>`;
}

/**
 * Build the full email HTML from editable content
 */
export function buildInvoiceEmailHtml(
  content: InvoiceEmailContent,
  invoice: Invoice,
  branchName: string,
  logoUrl: string
): string {
  const { greeting, mainMessage, signOff, signature, isPaid, showBankingDetails } = content;
  
  // Build status message
  let statusSection = '';
  if (isPaid) {
    statusSection = `
      <div style="background-color: #dcfce7; border-left: 4px solid #22c55e; padding: 16px; border-radius: 4px; margin: 20px 0;">
        <p style="margin: 0; color: #166534; font-weight: 600;">
          ✓ Payment Received
        </p>
        <p style="margin: 8px 0 0 0; color: #166534;">
          We're pleased to confirm that this invoice has been paid. Thank you for your business!
        </p>
      </div>
    `;
  } else {
    statusSection = `
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 20px 0;">
        <p style="margin: 0; color: #92400e; font-weight: 600;">
          Payment Due: ${format(new Date(invoice.due_date), 'dd MMM yyyy')}
        </p>
        <p style="margin: 8px 0 0 0; color: #92400e;">
          Please ensure payment is made by the due date. Banking details are provided below.
        </p>
      </div>
    `;
  }
  
  // Build banking section
  const bankingSection = showBankingDetails ? `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${BRAND_BLUE}; border-radius: 8px; margin-top: 24px;">
      <tr>
        <td style="padding: 20px 24px;">
          <h3 style="margin: 0 0 16px 0; color: #ffffff; font-size: 16px; font-weight: 600; letter-spacing: 0.5px;">Banking Details</h3>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px; color: #ffffff;">
            <tr>
              <td style="padding: 6px 0; color: rgba(255,255,255,0.85); width: 140px;">Account Holder:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #ffffff;">${BANKING_DETAILS.accountHolder}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: rgba(255,255,255,0.85);">Bank:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #ffffff;">${BANKING_DETAILS.bank}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: rgba(255,255,255,0.85);">Account Number:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #ffffff;">${BANKING_DETAILS.accountNumber}</td>
            </tr>
          </table>
          <p style="margin: 14px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.9); font-style: italic; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 14px;">
            ${BANKING_DETAILS.reference}
          </p>
        </td>
      </tr>
    </table>
  ` : '';
  
  // Build the full email
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice from ${branchName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 15px;
      line-height: 1.6;
      color: #333333;
      background-color: #f5f5f5;
    }
  </style>
</head>
<body>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #e5e7eb;">
              <img src="${logoUrl}" alt="${branchName}" width="180" style="display: block; margin: 0 auto; max-width: 180px; width: 180px; height: auto; border: 0;" />
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #333333;">${greeting}</p>
              
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #333333;">${mainMessage}</p>
              
              ${statusSection}
              
              <p style="margin: 20px 0 16px 0; font-size: 15px; color: #333333;">${signOff}</p>
              
              ${getSignatureHtml(signature)}
              
              ${bankingSection}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; text-align: center;">
                This email was sent from ${branchName}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generate a preview-friendly HTML for displaying in an iframe
 */
export function generatePreviewHtml(
  content: InvoiceEmailContent,
  invoice: Invoice,
  branchName: string,
  logoUrl: string
): string {
  return buildInvoiceEmailHtml(content, invoice, branchName, logoUrl);
}
