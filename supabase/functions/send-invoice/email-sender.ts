
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import { Invoice } from "./types.ts";
import { formatCurrency, formatDate } from "./utils.ts";

/**
 * Sends an invoice via email with the PDF attachment
 */
export async function sendInvoiceEmail(invoice: Invoice, email: string, pdfBuffer: ArrayBuffer): Promise<boolean> {
  // Get email configuration from environment variables
  const smtpHost = Deno.env.get("SMTP_HOST") || "";
  const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
  const smtpUsername = Deno.env.get("SMTP_USERNAME") || "";
  const smtpPassword = Deno.env.get("SMTP_PASSWORD") || "";
  const fromEmail = Deno.env.get("FROM_EMAIL") || "";

  if (!smtpHost || !smtpUsername || !smtpPassword || !fromEmail) {
    throw new Error("Missing SMTP configuration. Please set SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, and FROM_EMAIL environment variables.");
  }
  
  // Create SMTP client
  const client = new SmtpClient();
  
  console.log(`Connecting to SMTP server ${smtpHost}:${smtpPort}...`);
  await client.connectTLS({
    hostname: smtpHost,
    port: smtpPort,
    username: smtpUsername,
    password: smtpPassword,
  });

  // Prepare email content
  const clientName = `${invoice.client.first_name} ${invoice.client.last_name}`;
  const emailSubject = `Invoice ${invoice.invoice_number} from McKaynine Training Centre`;
  
  // Determine email message based on invoice status
  let emailMessage = createEmailMessage(invoice, clientName);

  // Convert PDF buffer to base64
  const pdfBase64 = btoa(
    String.fromCharCode(...new Uint8Array(pdfBuffer))
  );

  // Send email with attachment
  await client.send({
    from: fromEmail,
    to: email,
    subject: emailSubject,
    content: emailMessage,
    attachments: [{
      filename: `Invoice-${invoice.invoice_number}.pdf`,
      content: pdfBase64,
      encoding: "base64",
      contentType: "application/pdf"
    }]
  });

  await client.close();
  return true;
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
