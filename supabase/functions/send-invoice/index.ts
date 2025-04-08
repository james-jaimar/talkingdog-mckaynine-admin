
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import { jsPDF } from "npm:jspdf@2.5.1";
import {
  formatCurrency, 
  formatDate, 
  addPaidStamp,
  addInvoiceHeader,
  addClientInfo,
  addInvoiceItemsTable,
  addInvoiceSummary,
  addInvoiceFooter
} from "./pdf-helpers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceRequest {
  invoice: {
    id: string;
    invoice_number: string;
    status: string;
    issued_date: string;
    due_date: string;
    subtotal: number;
    tax_rate: number;
    tax_amount: number;
    total: number;
    notes?: string;
    items: Array<{
      description: string;
      quantity: number;
      unit_price: number;
      amount: number;
    }>;
    client: {
      first_name: string;
      last_name: string;
      email: string;
      phone?: string;
      address?: string;
      city?: string;
      postal_code?: string;
    };
  };
  email: string;
}

// Function to generate PDF
async function generatePDF(invoice: InvoiceRequest["invoice"]): Promise<ArrayBuffer> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Add title
  doc.setFontSize(20);
  doc.text("McKaynine Training Centre", pageWidth / 2, 20, { align: 'center' });
  
  // Add "PAID" stamp for paid invoices
  if (invoice.status === 'paid') {
    addPaidStamp(doc, pageWidth);
  }
  
  const startY = 40;
  
  // Add invoice header
  const headerEndY = addInvoiceHeader(doc, invoice, startY, pageWidth);
  
  // Add client info
  const clientInfoEndY = addClientInfo(doc, invoice, headerEndY);
  
  // Add invoice items table
  const tableEndY = addInvoiceItemsTable(doc, invoice, clientInfoEndY);
  
  // Add invoice summary
  addInvoiceSummary(doc, invoice, tableEndY, pageWidth);
  
  // Add footer
  addInvoiceFooter(doc, pageWidth, pageHeight);

  return doc.output('arraybuffer');
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get email configuration from environment variables
    const smtpHost = Deno.env.get("SMTP_HOST") || "";
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUsername = Deno.env.get("SMTP_USERNAME") || "";
    const smtpPassword = Deno.env.get("SMTP_PASSWORD") || "";
    const fromEmail = Deno.env.get("FROM_EMAIL") || "";

    if (!smtpHost || !smtpUsername || !smtpPassword || !fromEmail) {
      throw new Error("Missing SMTP configuration. Please set SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, and FROM_EMAIL environment variables.");
    }

    const { invoice, email } = await req.json() as InvoiceRequest;
    
    // Generate PDF
    console.log("Generating PDF for invoice:", invoice.invoice_number);
    const pdfBuffer = await generatePDF(invoice);
    
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

    // Convert PDF buffer to base64
    const pdfBase64 = btoa(
      String.fromCharCode(...new Uint8Array(pdfBuffer))
    );

    console.log(`Sending email to ${email}...`);
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

    console.log("Email sent successfully!");
    await client.close();

    return new Response(
      JSON.stringify({ success: true, message: "Invoice sent successfully" }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending invoice:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
};

serve(handler);
