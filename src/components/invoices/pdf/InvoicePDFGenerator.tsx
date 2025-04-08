
import { jsPDF } from "jspdf";
import { Invoice } from "@/hooks/invoices/types";
import { addPaidStamp, addLogoToPdf, calculateDynamicPosition } from "./utils/pdfHelpers";
import { addInvoiceHeader } from "./sections/InvoiceHeader";
import { addClientInfo } from "./sections/ClientInfo";
import { addInvoiceItemsTable } from "./sections/InvoiceItems";
import { addInvoiceSummary } from "./sections/InvoiceSummary";
import { addInvoiceFooter } from "./sections/InvoiceFooter";

export const generateInvoicePDF = async (invoice: Invoice) => {
  try {
    console.log("Starting client-side PDF generation...");
    
    // Create a new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Add McKaynine logo (75% of page width)
    const logoAdded = addLogoToPdf(doc, pageWidth);
    
    // Add "PAID" stamp for paid invoices - ensure we check status correctly
    console.log("Invoice status for PDF generation:", invoice.status);
    if (invoice.status && invoice.status.toLowerCase() === 'paid') {
      console.log("Adding PAID stamp to client-side PDF");
      addPaidStamp(doc, pageWidth);
    }
    
    // Set the starting Y position based on whether the logo was added
    const startY = logoAdded ? 65 : 40;
    
    // Add invoice header (invoice number, status, dates)
    const headerEndY = addInvoiceHeader(doc, invoice, startY, pageWidth);
    
    // Add client information
    const clientInfoEndY = addClientInfo(doc, invoice, headerEndY);
    
    // Add invoice items table
    const tableEndY = addInvoiceItemsTable(doc, invoice, clientInfoEndY);
    
    // Check if we need to add a new page for summary if table is too long
    const itemsCount = invoice.items?.length || 0;
    const needsExtraSpace = tableEndY > (pageHeight - 120);
    
    let summaryStartY = tableEndY;
    
    if (needsExtraSpace) {
      doc.addPage();
      summaryStartY = 40;
    }
    
    // Add invoice summary (subtotal, tax, total)
    const summaryEndY = addInvoiceSummary(doc, invoice, summaryStartY, pageWidth);
    
    // Check current page height before adding footer
    if (summaryEndY > (pageHeight - 80)) {
      doc.addPage();
      // Add footer (notes, banking details, thank you message)
      addInvoiceFooter(doc, invoice, 40, pageWidth, pageHeight);
    } else {
      // Add footer (notes, banking details, thank you message)
      addInvoiceFooter(doc, invoice, summaryEndY, pageWidth, pageHeight);
    }
    
    console.log("Client-side PDF generation completed successfully");

    // Save the PDF with a filename based on the invoice number
    doc.save(`invoice-${invoice.invoice_number}.pdf`);
    
    return doc;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

// Extension method for jsPDF to handle text wrapping
if (typeof jsPDF !== 'undefined') {
  jsPDF.prototype.splitTextToLines = function(text, maxWidth) {
    const fontSize = this.getFontSize();
    const lines = [];
    
    // Split the text by newlines first
    const paragraphs = text.split(/\r\n|\r|\n/);
    
    for (let i = 0; i < paragraphs.length; i++) {
      let paragraph = paragraphs[i];
      let textWidth = this.getStringUnitWidth(paragraph) * fontSize / this.internal.scaleFactor;
      
      if (textWidth <= maxWidth) {
        lines.push(paragraph);
      } else {
        let words = paragraph.split(' ');
        let line = '';
        
        for (let j = 0; j < words.length; j++) {
          let testLine = line + words[j] + ' ';
          let testWidth = this.getStringUnitWidth(testLine) * fontSize / this.internal.scaleFactor;
          
          if (testWidth > maxWidth && line !== '') {
            lines.push(line);
            line = words[j] + ' ';
          } else {
            line = testLine;
          }
        }
        
        if (line.trim() !== '') {
          lines.push(line.trim());
        }
      }
    }
    
    return lines;
  };
}

// Export the helper function for use in other components
export { splitTextToLines } from "./utils/formatters";
