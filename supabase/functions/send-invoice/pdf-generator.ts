
import { jsPDF } from "npm:jspdf@2.5.1";
import { Invoice } from "./types.ts";
import { addInvoiceHeader } from "./pdf-sections/header.ts";
import { addClientInfo } from "./pdf-sections/client-info.ts";
import { addInvoiceItemsTable } from "./pdf-sections/items-table.ts";
import { addInvoiceSummary } from "./pdf-sections/summary.ts";
import { addInvoiceFooter } from "./pdf-sections/footer.ts";

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
    
    // Add McKaynine logo
    const logoAdded = addLogoToPdf(doc, pageWidth);
    
    // Set the starting Y position based on whether the logo was added
    const startY = logoAdded ? 70 : 40;
    
    // Add invoice header
    const headerEndY = addInvoiceHeader(doc, invoice, startY, pageWidth);
    
    // Add horizontal separator line after header
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(14, headerEndY - 5, pageWidth - 14, headerEndY - 5);
    
    // Add client info
    const clientInfoEndY = addClientInfo(doc, invoice, headerEndY);
    
    // Add invoice items table
    console.log("Items count:", invoice.items?.length || 0);
    const tableEndY = addInvoiceItemsTable(doc, invoice, clientInfoEndY);
    
    // Check if we need to add a new page for summary if table is too long
    const needsExtraSpace = tableEndY > (pageHeight - 100);
    
    let summaryStartY = tableEndY;
    
    if (needsExtraSpace) {
      doc.addPage();
      summaryStartY = 40;
    }
    
    // Add invoice summary
    const summaryEndY = addInvoiceSummary(doc, invoice, summaryStartY, pageWidth);
    
    // Check current page height before adding footer
    if (summaryEndY > (pageHeight - 70)) {
      doc.addPage();
      // Add footer on new page
      addInvoiceFooter(doc, invoice, 40, pageWidth, pageHeight);
    } else {
      // Add footer on current page
      addInvoiceFooter(doc, invoice, summaryEndY, pageWidth, pageHeight);
    }
    
    console.log("PDF generation completed successfully");
    
    return doc.output('arraybuffer');
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
}

/**
 * Adds a logo to the PDF document
 */
function addLogoToPdf(doc: jsPDF, pageWidth: number): boolean {
  try {
    // Use base64 encoded image data for the full McKaynine logo with paws
    const logoBase64 = "data:image/png;base64,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";
    
    // Set logo dimensions and position
    const imgWidth = 170; // Logo width
    const imgHeight = 55; // Logo height
    const xPosition = (pageWidth - imgWidth) / 2; // Center horizontally
    
    // Add the logo image
    doc.addImage(logoBase64, "PNG", xPosition, 10, imgWidth, imgHeight);
    
    // Reset text color to black for the rest of the document
    doc.setTextColor(0, 0, 0);
    
    console.log("Logo added successfully");
    return true;
  } catch (logoError) {
    console.error("Error adding logo to PDF:", logoError);
    
    // Fall back to text title if logo fails
    doc.setFontSize(20);
    doc.text("McKaynine Training Centre", pageWidth / 2, 20, { align: 'center' });
    console.log("Fallback to text title");
    return false;
  }
}
