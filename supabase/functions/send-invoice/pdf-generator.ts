
import { jsPDF } from "npm:jspdf@2.5.1";
import { Invoice } from "./types.ts";
import { 
  addPaidStamp, 
  addInvoiceHeader, 
  addClientInfo, 
  addInvoiceItemsTable, 
  addInvoiceSummary, 
  addInvoiceFooter 
} from "./pdf-helpers.ts";

/**
 * Generates a PDF for the given invoice
 */
export async function generatePDF(invoice: Invoice): Promise<ArrayBuffer> {
  try {
    console.log("Starting PDF generation...");
    
    // Create a new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Add title
    doc.setFontSize(20);
    doc.text("McKaynine Training Centre", pageWidth / 2, 20, { align: 'center' });
    
    // Add "PAID" stamp for paid invoices
    console.log("Invoice status in PDF generation:", invoice.status);
    if (invoice.status && invoice.status.toLowerCase() === 'paid') {
      console.log("Invoice is PAID, adding stamp");
      // Import the stamp function directly to ensure it's called
      const { addPaidStamp } = await import("./pdf-sections/stamp.ts");
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
    const summaryEndY = addInvoiceSummary(doc, invoice, tableEndY, pageWidth);
    
    // Add footer
    addInvoiceFooter(doc, pageWidth, pageHeight);
    
    console.log("PDF generation completed successfully");
    
    return doc.output('arraybuffer');
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
}
