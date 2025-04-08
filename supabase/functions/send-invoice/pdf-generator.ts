
import { jsPDF } from "npm:jspdf@2.5.1";
import { Invoice } from "./types.ts";
import { addPaidStamp } from "./pdf-sections/stamp.ts";
import { addInvoiceHeader } from "./pdf-sections/header.ts";
import { addClientInfo } from "./pdf-sections/client-info.ts";
import { addInvoiceItemsTable } from "./items-table.ts";
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
    // so we'll need to use a full URL or base64 encoded image
    
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
