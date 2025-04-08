
import { jsPDF } from "npm:jspdf@2.5.1";
import { Invoice } from "./types.ts";
import { 
  addPaidStamp, 
  addInvoiceHeader, 
  addClientInfo, 
  addInvoiceSummary, 
  addInvoiceFooter 
} from "./pdf-helpers.ts";
import { addInvoiceItemsTable } from "./items-table.ts";

/**
 * Generates a PDF for the given invoice
 */
export async function generatePDF(invoice: Invoice): Promise<ArrayBuffer> {
  try {
    console.log("Starting PDF generation...");
    console.log("Invoice status:", invoice.status);
    
    // Create a new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Add title
    doc.setFontSize(20);
    doc.text("McKaynine Training Centre", pageWidth / 2, 20, { align: 'center' });
    
    // Add "PAID" stamp for paid invoices - normalize status to lowercase for comparison
    const status = invoice.status ? invoice.status.toLowerCase() : '';
    console.log("Normalized invoice status for stamp check:", status);
    
    if (status === 'paid') {
      console.log("Invoice is marked as PAID, adding stamp");
      try {
        addPaidStamp(doc, pageWidth);
        console.log("PAID stamp added successfully");
      } catch (stampError) {
        console.error("Error adding PAID stamp:", stampError);
        // Continue without the stamp rather than failing the entire PDF generation
      }
    }
    
    const startY = 40;
    
    // Add invoice header
    const headerEndY = addInvoiceHeader(doc, invoice, startY, pageWidth);
    
    // Add client info
    const clientInfoEndY = addClientInfo(doc, invoice, headerEndY);
    
    // Add invoice items table
    console.log("Items count:", invoice.items?.length || 0);
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
