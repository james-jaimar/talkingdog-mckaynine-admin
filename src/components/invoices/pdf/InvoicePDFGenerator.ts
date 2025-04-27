
import { jsPDF } from "jspdf";
import { Invoice } from "@/hooks/invoices/types";
import { addInvoiceHeader } from "./sections/InvoiceHeader";
import { addClientInfo } from "./sections/ClientInfo";
import { addInvoiceItemsTable } from "./sections/InvoiceItems";
import { addInvoiceSummary } from "./sections/InvoiceSummary";
import { addInvoiceFooter } from "./sections/InvoiceFooter";

export async function generateInvoicePDF(invoice: Invoice, returnBase64: boolean = false): Promise<string | void> {
  console.log("Starting PDF generation...");
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Add new McKaynine logo at original size (210mm wide)
  const logoPath = "/lovable-uploads/3647f206-d732-423e-91db-6a150b7df9b6.png";
  
  try {
    // Set coordinates to place the logo at the top of the page
    // The logo is exactly 210mm wide (A4 page width)
    const yPosition = 10; // Start 10mm from top
    doc.addImage(logoPath, "PNG", 0, yPosition, pageWidth, 25); // Height set to 25mm for proportion

    // Start content after logo
    const startY = 40; // Adjusted spacing after logo
    
    // Add invoice sections
    const headerEndY = addInvoiceHeader(doc, invoice, startY, pageWidth);
    const clientInfoEndY = addClientInfo(doc, invoice, headerEndY + 5);
    const tableEndY = addInvoiceItemsTable(doc, invoice, clientInfoEndY + 10);
    const summaryEndY = addInvoiceSummary(doc, invoice, tableEndY + 5);
    
    // Add footer with banking details
    addInvoiceFooter(doc, invoice, summaryEndY + 10, pageWidth, pageHeight);

    if (returnBase64) {
      return doc.output('datauristring').split(',')[1];
    } else {
      doc.save(`Invoice-${invoice.invoice_number}.pdf`);
    }
    
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}
