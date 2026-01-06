import { encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";
import { Invoice } from "./types.ts";
import { formatCurrency, formatDate } from "./utils.ts";

// Branch email configuration
const BRANCH_EMAIL_CONFIG: Record<string, { email: string; name: string }> = {
  "284817cf-de0d-43b9-a506-a3efa625ae1c": { email: "randburg@mckaynine.co.za", name: "Randburg Mckaynine" },
  "6351a9e8-77db-403b-ab1f-cd47e393a006": { email: "delta@mckaynine.co.za", name: "Delta Mckaynine" },
};

/**
 * Gets the from email config based on branch_id
 */
function getBranchEmailConfig(branchId?: string): { email?: string; name?: string } {
  if (!branchId) return {};
  return BRANCH_EMAIL_CONFIG[branchId] || {};
}

/**
 * Sends an invoice via email with the PDF attachment
 * using SMTP for email delivery
 */
export async function sendInvoiceEmail(invoice: Invoice, email: string, pdfBuffer: ArrayBuffer): Promise<boolean> {
  console.log(`Preparing to send invoice ${invoice.invoice_number} to ${email}`);
  console.log("Invoice status in email sender:", invoice.status);
  console.log("Client branch_id:", invoice.client.branch_id);
  
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
    
    // Create email message based on invoice status
    const emailSubject = `Invoice ${invoice.invoice_number} from ${branchName}`;
    const emailMessage = createEmailMessage(invoice, `${invoice.client.first_name} ${invoice.client.last_name || ''}`, branchName);
    const htmlMessage = formatEmailHtml(emailMessage);
    
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
 * Creates the email message based on invoice status
 */
function createEmailMessage(invoice: Invoice, clientName: string, branchName: string = "McKaynine Training Centre"): string {
  let emailMessage = `Dear ${clientName},\n\nPlease find attached your invoice #${invoice.invoice_number} for the amount of ${formatCurrency(invoice.total)}.\n\n`;
  
  if (invoice.status && invoice.status.toLowerCase() === 'paid') {
    emailMessage += "We're pleased to confirm that this invoice has been paid. Thank you for your business!\n\n";
  } else {
    emailMessage += `This invoice is due on ${formatDate(invoice.due_date)}.\n\n`;
    emailMessage += "Payment can be made to the following account:\n";
    emailMessage += "Adrienne Hawkins\n";
    emailMessage += "FNB, Sandton City (26095400)\n";
    emailMessage += "Account Number: 6212 7520 189\n";
    emailMessage += "Please use your name as the payment reference.\n\n";
  }
  
  emailMessage += "If you have any questions regarding this invoice, please don't hesitate to contact us.\n\n";
  emailMessage += "Kind regards,\n";
  emailMessage += branchName;
  
  return emailMessage;
}

/**
 * Formats the plain text email message as HTML
 */
function formatEmailHtml(plainText: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .email-container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .signature { margin-top: 20px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="email-container">
        ${plainText.split('\n').map(line => {
          if (line.trim() === '') return '<br>';
          return `<p>${line}</p>`;
        }).join('')}
      </div>
    </body>
    </html>
  `;
}
