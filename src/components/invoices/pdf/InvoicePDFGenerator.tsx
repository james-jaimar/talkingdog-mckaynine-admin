
import { jsPDF } from "jspdf";
import { Invoice } from "@/hooks/invoices/types";
import { addLogoToPdf, calculateDynamicPosition } from "./utils/pdfHelpers";
import { addInvoiceHeader } from "./sections/InvoiceHeader";
import { addClientInfo } from "./sections/ClientInfo";
import { addInvoiceItemsTable } from "./sections/InvoiceItems";
import { addInvoiceSummary } from "./sections/InvoiceSummary";
import { addInvoiceFooter } from "./sections/InvoiceFooter";
import { splitTextToFitPage } from "./utils/formatters";

/**
 * Generates a PDF for the given invoice and saves it for download
 */
export const generateInvoicePDF = async (invoice: Invoice) => {
  try {
    const doc = await createInvoicePDF(invoice);
    
    // Save the PDF with a filename based on the invoice number
    doc.save(`invoice-${invoice.invoice_number}.pdf`);
    
    return doc;
  } catch (error) {
    console.error("Error generating PDF for download:", error);
    throw error;
  }
};

/**
 * Creates a PDF document for the given invoice and returns it as a base64 string
 */
export const getInvoiceAsBase64 = async (invoice: Invoice): Promise<string> => {
  try {
    const doc = await createInvoicePDF(invoice);
    
    // Return the PDF as a base64 string
    return doc.output('datauristring').split(',')[1];
  } catch (error) {
    console.error("Error generating PDF as base64:", error);
    throw error;
  }
};

/**
 * Core PDF generation logic used by both download and email functions
 */
async function createInvoicePDF(invoice: Invoice): Promise<jsPDF> {
  console.log("Starting PDF generation...");
  
  // Create a new PDF document with compression enabled for smaller file size
  const doc = new jsPDF({ compress: true });
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Add McKaynine logo 
  const logoAdded = addLogoToPdf(doc, pageWidth);
  
  // Set the starting Y position based on whether the logo was added
  const startY = logoAdded ? 50 : 40; // Adjusted for smaller logo dimensions
  
  // Add invoice header (invoice number, status, dates)
  const headerEndY = addInvoiceHeader(doc, invoice, startY, pageWidth);
  
  // Add horizontal separator line after header
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(14, headerEndY - 5, pageWidth - 14, headerEndY - 5);
  
  // Add client information
  const clientInfoEndY = addClientInfo(doc, invoice, headerEndY);
  
  // Add invoice items table
  const tableEndY = addInvoiceItemsTable(doc, invoice, clientInfoEndY);
  
  // Check if we need to add a new page for summary if table is too long
  const needsExtraSpace = tableEndY > (pageHeight - 100); // Reduced from 120 to fit more on first page
  
  let summaryStartY = tableEndY;
  
  if (needsExtraSpace) {
    doc.addPage();
    summaryStartY = 40;
  }
  
  // Add invoice summary (subtotal, tax, total)
  const summaryEndY = addInvoiceSummary(doc, invoice, summaryStartY);
  
  // Check current page height before adding footer
  if (summaryEndY > (pageHeight - 70)) { // Reduced from 80 to fit more on first page
    doc.addPage();
    // Add footer (notes, banking details, thank you message)
    addInvoiceFooter(doc, invoice, 40, pageWidth, pageHeight);
  } else {
    // Add footer (notes, banking details, thank you message)
    addInvoiceFooter(doc, invoice, summaryEndY, pageWidth, pageHeight);
  }
  
  console.log("PDF generation completed successfully");
  return doc;
}

// Export the helper function for use in other components
export { splitTextToFitPage } from "./utils/formatters";
