
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
