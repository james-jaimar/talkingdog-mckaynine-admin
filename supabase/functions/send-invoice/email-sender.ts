
import { Invoice } from "./types.ts";
import { formatCurrency, formatDate } from "./utils.ts";

/**
 * Sends an invoice via email with the PDF attachment
 * using Supabase's email service
 */
export async function sendInvoiceEmail(invoice: Invoice, email: string, pdfBuffer: ArrayBuffer): Promise<boolean> {
  console.log(`Preparing to send invoice ${invoice.invoice_number} to ${email}`);
  
  try {
    const apiKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const projectRef = Deno.env.get("SUPABASE_PROJECT_REF") || "vsgsagbpfclbuyqrepvf";
    
    if (!apiKey) {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY. Please set this environment variable.");
    }
    
    // Create email message based on invoice status
    const emailSubject = `Invoice ${invoice.invoice_number} from McKaynine Training Centre`;
    const emailMessage = createEmailMessage(invoice, `${invoice.client.first_name} ${invoice.client.last_name}`);
    
    // Convert PDF buffer to base64
    const pdfBase64 = btoa(
      String.fromCharCode(...new Uint8Array(pdfBuffer))
    );
    
    // Prepare the email request
    const fromEmail = Deno.env.get("FROM_EMAIL") || "noreply@mckaynine.co.za";
    
    // Prepare email payload for Supabase
    const payload = {
      from: fromEmail,
      to: email,
      subject: emailSubject,
      html: formatEmailHtml(emailMessage),
      attachments: [{
        name: `Invoice-${invoice.invoice_number}.pdf`,
        content: pdfBase64,
        type: "application/pdf"
      }]
    };
    
    console.log(`Sending email via Supabase Email API...`);
    
    // Make the API request to Supabase Email API
    const response = await fetch(`https://${projectRef}.supabase.co/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Email API error: ${response.status} - ${errorText}`);
      throw new Error(`Failed to send email: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log("Email sent successfully:", result);
    
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

/**
 * Creates the email message based on invoice status
 */
function createEmailMessage(invoice: Invoice, clientName: string): string {
  let emailMessage = `Dear ${clientName},\n\nPlease find attached your invoice #${invoice.invoice_number} for the amount of ${formatCurrency(invoice.total)}.\n\n`;
  
  if (invoice.status === 'paid') {
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
