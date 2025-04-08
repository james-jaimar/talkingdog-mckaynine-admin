import { Invoice } from "./types.ts";
import { formatCurrency, formatDate } from "./pdf-helpers.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

/**
 * Sends an invoice via email with the PDF attachment
 * using Supabase's built-in email service
 */
export async function sendInvoiceEmail(invoice: Invoice, email: string, pdfBuffer: ArrayBuffer): Promise<boolean> {
  console.log(`Preparing to send invoice ${invoice.invoice_number} to ${email}`);
  console.log("Invoice status in email sender:", invoice.status);
  
  try {
    // Get email configuration
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.");
    }
    
    // Initialize Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create email message based on invoice status
    const emailSubject = `Invoice ${invoice.invoice_number} from McKaynine Training Centre`;
    const emailMessage = createEmailMessage(invoice, `${invoice.client.first_name} ${invoice.client.last_name}`);
    const htmlMessage = formatEmailHtml(emailMessage);
    
    // Convert PDF buffer to base64 for attachment
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));
    
    console.log(`Sending email via Supabase to: ${email}`);
    
    // Send email directly using the SMTP function
    const { data, error } = await supabase.functions.invoke('send-with-smtp', {
      body: {
        to: email,
        subject: emailSubject,
        html: htmlMessage,
        attachments: [
          {
            filename: `Invoice-${invoice.invoice_number}.pdf`,
            content: pdfBase64,
            encoding: "base64",
            contentType: "application/pdf",
          }
        ]
      }
    });
    
    if (error) {
      console.error("Error sending email directly through SMTP:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
    
    if (!data || data.success === false) {
      console.error("SMTP function returned error:", data?.error || "Unknown error");
      throw new Error(data?.error || "Failed to send email through SMTP");
    }
    
    console.log("Email sent successfully through SMTP");
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
