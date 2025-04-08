
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
    const startY = logoAdded ? 65 : 40;
    
    // Add invoice header
    const headerEndY = addInvoiceHeader(doc, invoice, startY, pageWidth);
    
    // Add client info
    const clientInfoEndY = addClientInfo(doc, invoice, headerEndY);
    
    // Add invoice items table
    console.log("Items count:", invoice.items?.length || 0);
    const tableEndY = addInvoiceItemsTable(doc, invoice, clientInfoEndY);
    
    // Check if we need to add a new page for summary if table is too long
    const needsExtraSpace = tableEndY > (pageHeight - 120);
    
    let summaryStartY = tableEndY;
    
    if (needsExtraSpace) {
      doc.addPage();
      summaryStartY = 40;
    }
    
    // Add invoice summary
    const summaryEndY = addInvoiceSummary(doc, invoice, summaryStartY, pageWidth);
    
    // Check current page height before adding footer
    if (summaryEndY > (pageHeight - 80)) {
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
    // Use the McKaynine logo
    // Note: In Deno/Edge functions, we can't use local file paths,
    // so we'll need to use a base64 encoded image
    
    // This is a base64 representation of the logo
    const logoBase64 = "data:image/png;base64,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";
    
    // Set logo dimensions - 75% of page width
    const imgWidth = pageWidth * 0.75; // 75% of page width
    const imgHeight = 45; // Adjusted height 
    const xPosition = (pageWidth - imgWidth) / 2; // Center horizontally
    
    // Add the logo image - use an absolute path for better reliability
    doc.addImage(logoBase64, "PNG", xPosition, 10, imgWidth, imgHeight);
    console.log("Logo added successfully from base64");
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
