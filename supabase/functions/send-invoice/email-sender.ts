import { encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";
import { Invoice } from "./types.ts";
import { formatCurrency, formatDate } from "./utils.ts";

// Branch email configuration
// Using the production domain for reliable email image hosting
const APP_URL = "https://mckaynine.talkingdog.co.za";

const BRANCH_EMAIL_CONFIG: Record<string, { email: string; name: string; logoUrl: string }> = {
  "284817cf-de0d-43b9-a506-a3efa625ae1c": { 
    email: "randburg@mckaynine.co.za", 
    name: "Randburg McKaynine",
    logoUrl: `${APP_URL}/lovable-uploads/mckaynine_randburg_long_2025.jpg`
  },
  "6351a9e8-77db-403b-ab1f-cd47e393a006": { 
    email: "delta@mckaynine.co.za", 
    name: "Delta McKaynine",
    logoUrl: `${APP_URL}/lovable-uploads/mckaynine_delta_long_2025.jpg`
  },
};

// McKaynine brand blue color
const BRAND_BLUE = "#3b82f6";

// Banking details for the organization
const BANKING_DETAILS = {
  accountHolder: "Adrienne Hawkins",
  bank: "FNB, Sandton City",
  accountNumber: "6212 7520 189",
  reference: "Please use your name as reference.",
};

// Branch-specific signature configurations
interface BranchSignature {
  name: string;
  title: string;
  phone: string;
  company: string;
  email: string;
  website: string;
}

const BRANCH_SIGNATURES: Record<string, BranchSignature> = {
  "Delta": {
    name: "Ady Hawkins",
    title: "McKaynine - Delta",
    phone: "083 400 2987",
    company: "",
    email: "delta@mckaynine.co.za",
    website: "www.mckaynine.co.za",
  },
  "Randburg": {
    name: "Ady Hawkins",
    title: "McKaynine - Randburg",
    phone: "083 400 2987",
    company: "",
    email: "randburg@mckaynine.co.za",
    website: "www.mckaynine.co.za",
  },
};

function getSignatureHtml(branchName?: string): string {
  let signature: BranchSignature;
  
  if (branchName?.toLowerCase().includes("randburg")) {
    signature = BRANCH_SIGNATURES["Randburg"];
  } else {
    signature = BRANCH_SIGNATURES["Delta"];
  }
  
  // Build signature HTML, omitting company line if empty
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
 * Gets the from email config based on branch_id
 */
function getBranchEmailConfig(branchId?: string): { email?: string; name?: string; logoUrl?: string } {
  const defaultLogoUrl = `${APP_URL}/lovable-uploads/mckaynine_delta_long_2025.jpg`;
  if (!branchId) return { logoUrl: defaultLogoUrl };
  return BRANCH_EMAIL_CONFIG[branchId] || { logoUrl: defaultLogoUrl };
}

/**
 * Sends an invoice via email with the PDF attachment
 * using SMTP for email delivery
 * 
 * @param invoice - The invoice to send
 * @param email - The recipient email address
 * @param pdfBuffer - The PDF as an ArrayBuffer
 * @param customSubject - Optional custom email subject (if user edited it)
 * @param customEmailHtml - Optional custom email HTML (if user edited the message)
 */
export async function sendInvoiceEmail(
  invoice: Invoice, 
  email: string, 
  pdfBuffer: ArrayBuffer,
  customSubject?: string,
  customEmailHtml?: string
): Promise<boolean> {
  console.log(`Preparing to send invoice ${invoice.invoice_number} to ${email}`);
  console.log("Invoice status in email sender:", invoice.status);
  console.log("Client branch_id:", invoice.client.branch_id);
  console.log("Custom email provided:", !!customEmailHtml);
  
  try {
    // Get Supabase configuration from env
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.");
    }
    
    // Convert PDF buffer to base64 for attachment (avoid stack overflow on large PDFs)
    const pdfBase64 = encode(new Uint8Array(pdfBuffer));

    // Get branch-specific email config
    const branchConfig = getBranchEmailConfig(invoice.client.branch_id);
    const branchName = branchConfig.name || "McKaynine Training Centre";
    const logoUrl = branchConfig.logoUrl || `${APP_URL}/lovable-uploads/mckaynine_delta_long_2025.jpg`;
    
    // Use custom subject if provided, otherwise generate default
    const emailSubject = customSubject || `Invoice ${invoice.invoice_number} from ${branchName}`;
    const clientName = `${invoice.client.first_name} ${invoice.client.last_name || ''}`.trim();
    const isPaid = invoice.status && invoice.status.toLowerCase() === 'paid';
    
    // Use custom email HTML if provided, otherwise generate default
    const htmlMessage = customEmailHtml || createInvoiceEmailHtml(invoice, clientName, branchName, logoUrl, isPaid);
    
    console.log("Using send-with-smtp function to deliver email");
    console.log("From email:", branchConfig.email || "default");
    console.log("From name:", branchConfig.name || "default");
    
    // Prepare the request to the send-with-smtp edge function
    const smtpFunctionUrl = `${supabaseUrl}/functions/v1/send-with-smtp`;
    
    // Send the email using the SMTP edge function
    const response = await fetch(smtpFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        to: email,
        subject: emailSubject,
        html: htmlMessage,
        from: branchConfig.email,
        fromName: branchConfig.name,
        attachments: [
          {
            filename: `Invoice-${invoice.invoice_number}.pdf`,
            content: pdfBase64,
            encoding: "base64",
            contentType: "application/pdf"
          }
        ]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response from SMTP email service:", response.status, errorText);
      throw new Error(`Failed to send email: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log("Email sent successfully via SMTP:", result);
    return true;
  } catch (error) {
    console.error("Error in sendInvoiceEmail:", error.message);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    throw error;
  }
}

/**
 * Creates the styled HTML email for invoice
 */
function createInvoiceEmailHtml(
  invoice: Invoice, 
  clientName: string, 
  branchName: string, 
  logoUrl: string,
  isPaid: boolean
): string {
  // Build the main content
  let contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #333333;">Dear ${clientName},</p>
    
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #333333;">
      Please find attached your invoice <strong>#${invoice.invoice_number}</strong> for the amount of <strong>${formatCurrency(invoice.total)}</strong>.
    </p>
  `;

  if (isPaid) {
    contentHtml += `
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
    contentHtml += `
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 20px 0;">
        <p style="margin: 0; color: #92400e; font-weight: 600;">
          Payment Due: ${formatDate(invoice.due_date)}
        </p>
        <p style="margin: 8px 0 0 0; color: #92400e;">
          Please ensure payment is made by the due date. Banking details are provided below.
        </p>
      </div>
    `;
  }

  contentHtml += `
    <p style="margin: 20px 0 16px 0; font-size: 15px; color: #333333;">
      If you have any questions regarding this invoice, please don't hesitate to contact us.
    </p>
    
    ${getSignatureHtml(branchName)}
  `;

  // Build the banking section (only for unpaid invoices)
  const bankingSection = !isPaid ? `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${BRAND_BLUE}; border-radius: 8px;">
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

  // Return the full wrapped email
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Invoice from ${branchName}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 15px;
      line-height: 1.6;
      color: #333333;
      background-color: #f5f5f5;
      -webkit-font-smoothing: antialiased;
    }
    a {
      color: ${BRAND_BLUE};
    }
    @media only screen and (max-width: 620px) {
      .container {
        width: 100% !important;
        padding: 12px !important;
      }
      .content-cell {
        padding: 24px 20px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <!--[if mso]>
        <table role="presentation" align="center" width="600" cellspacing="0" cellpadding="0" border="0">
        <tr>
        <td>
        <![endif]-->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="container" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 28px 32px 20px 32px; text-align: center; border-bottom: 1px solid #eaeaea;">
              <img src="${logoUrl}" alt="${branchName}" width="180" style="display: block; margin: 0 auto; max-width: 180px; width: 180px; height: auto; border: 0;" />
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td class="content-cell" style="padding: 28px 32px;">
              ${contentHtml}
            </td>
          </tr>
          
          ${!isPaid ? `
          <!-- Banking Details -->
          <tr>
            <td style="padding: 0 32px 28px 32px;">
              ${bankingSection}
            </td>
          </tr>
          ` : ''}
          
        </table>
        <!--[if mso]>
        </td>
        </tr>
        </table>
        <![endif]-->
        
        <!-- Post-footer text -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px;">
          <tr>
            <td style="padding: 16px 32px; text-align: center; color: #999999; font-size: 11px;">
              <p style="margin: 0;">This email was sent by ${branchName}.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
