
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import { jsPDF } from "npm:jspdf@2.5.1";
import autoTable from "npm:jspdf-autotable@3.8.2";

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

// Helper function to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  }).format(amount);
}

// Helper function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

// Function to generate PDF
async function generatePDF(invoice: InvoiceRequest["invoice"]): Promise<ArrayBuffer> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Add title
  doc.setFontSize(20);
  doc.text("McKaynine Training Centre", pageWidth / 2, 20, { align: 'center' });
  
  // Add "PAID" stamp for paid invoices
  if (invoice.status === 'paid') {
    doc.setGlobalAlpha(0.3); // Set transparency
    doc.setFillColor(39, 174, 96); // Green color
    doc.setTextColor(255, 255, 255); // White text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(72);
    
    // Rotate and position the "PAID" text as a stamp
    doc.saveGraphicsState();
    doc.translate(pageWidth / 2, 120);
    doc.rotate(-30);
    doc.text("PAID", 0, 0, { align: 'center' });
    doc.restoreGraphicsState();
    
    // Reset styles for the rest of the document
    doc.setGlobalAlpha(1);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
  }
  
  const startY = 40;
  
  doc.setFontSize(15);
  doc.text(`INVOICE: ${invoice.invoice_number}`, 14, startY);
  
  // Add status
  doc.setFontSize(12);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, pageWidth - 60, startY);

  // Invoice details
  doc.setFontSize(10);
  doc.text(`Issued Date: ${formatDate(invoice.issued_date)}`, pageWidth - 80, startY + 10);
  doc.text(`Due Date: ${formatDate(invoice.due_date)}`, pageWidth - 80, startY + 15);
  
  // Client info
  doc.setFontSize(12);
  doc.text("Bill To:", 14, startY + 25);
  
  if (invoice.client) {
    doc.setFontSize(10);
    doc.text(`${invoice.client.first_name} ${invoice.client.last_name}`, 14, startY + 32);
    doc.text(`${invoice.client.email}`, 14, startY + 37);
    
    if (invoice.client.phone) {
      doc.text(`${invoice.client.phone}`, 14, startY + 42);
    }
  }

  // Invoice items table
  autoTable(doc, {
    startY: startY + 55,
    head: [
      [
        'Description',
        'Quantity',
        'Unit Price',
        'Amount'
      ]
    ],
    body: invoice.items?.map(item => [
      item.description,
      item.quantity.toString(),
      formatCurrency(item.unit_price),
      formatCurrency(item.amount)
    ]) || [['No items found for this invoice', '', '', '']],
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [80, 80, 80],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'right', cellWidth: 25 },
      2: { halign: 'right', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 35 }
    },
  });

  // Add summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Subtotal, Tax, Total
  doc.text("Subtotal:", pageWidth - 90, finalY + 8);
  doc.text(formatCurrency(invoice.subtotal), pageWidth - 25, finalY + 8, { align: "right" });
  
  doc.text(`Tax (${invoice.tax_rate}%):`, pageWidth - 90, finalY + 15);
  doc.text(formatCurrency(invoice.tax_amount), pageWidth - 25, finalY + 15, { align: "right" });
  
  doc.setFont("helvetica", "bold");
  doc.text("Total:", pageWidth - 90, finalY + 25);
  doc.text(formatCurrency(invoice.total), pageWidth - 25, finalY + 25, { align: "right" });
  doc.setFont("helvetica", "normal");
  
  // Banking details in the footer
  const footerY = doc.internal.pageSize.height - 40;
  doc.setFontSize(10);
  doc.text("BANKING DETAILS: Adrienne Hawkins. FNB, Sandton City (26095400). Account Number: 6212 7520 189", pageWidth / 2, footerY, { align: 'center' });
  doc.text("Please use your name as reference.", pageWidth / 2, footerY + 6, { align: 'center' });
  
  // Thank you message
  doc.text("Thank you for your business!", pageWidth / 2, doc.internal.pageSize.height - 15, { align: "center" });

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
