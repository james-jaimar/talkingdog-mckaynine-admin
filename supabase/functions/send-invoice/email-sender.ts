import { Invoice } from "./types.ts";
import { formatCurrency, formatDate } from "./pdf-helpers.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

/**
 * Sends an invoice via email with the PDF attachment
 * using Supabase's configured SMTP settings
 */
export async function sendInvoiceEmail(invoice: Invoice, email: string, pdfBuffer: ArrayBuffer): Promise<boolean> {
  console.log(`Preparing to send invoice ${invoice.invoice_number} to ${email}`);
  console.log("Invoice status in email sender:", invoice.status);
  
  try {
    // Get Supabase URL and service role key from environment
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase URL or service role key");
    }
    
    console.log("Creating Supabase admin client");
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Get FROM_EMAIL environment variable or use default
    const fromEmail = Deno.env.get("FROM_EMAIL") || "noreply@mckaynine.co.za";
    console.log(`Using from email: ${fromEmail}`);

    // Create email message based on invoice status
    const emailSubject = `Invoice ${invoice.invoice_number} from McKaynine Training Centre`;
    const emailMessage = createEmailMessage(invoice, `${invoice.client.first_name} ${invoice.client.last_name}`);
    const htmlMessage = formatEmailHtml(emailMessage);
    
    // Convert PDF buffer to base64 for the attachment
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));
    
    console.log(`Sending email via Supabase from: ${fromEmail} to: ${email}`);
    
    // Send email using Supabase's email service
    const { error } = await supabase.auth.admin.sendRawEmail({
      email,
      subject: emailSubject,
      html: htmlMessage,
      data: {
        from: fromEmail
      },
      attachments: [
        {
          content: pdfBase64,
          filename: `Invoice-${invoice.invoice_number}.pdf`,
          type: "application/pdf",
          disposition: "attachment"
        }
      ]
    });
    
    if (error) {
      console.error("Supabase email error:", error);
      throw new Error(`Supabase email error: ${error.message}`);
    }
    
    console.log("Email sent successfully");
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
function createEmailMessage(invoice: Invoice, clientName: string): string {
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
  emailMessage += "McKaynine Training Centre";
  
  return emailMessage;
}

/**
 * Formats the plain text email message as HTML
 */
function formatEmailHtml(plainText: string): string {
  // Convert line breaks to <br> tags and wrap in HTML
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
