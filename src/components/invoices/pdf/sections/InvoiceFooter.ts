
import { jsPDF } from "jspdf";
import { Invoice } from "@/hooks/invoices/types";

/**
 * Adds the invoice footer including notes and banking details
 */
export const addInvoiceFooter = (doc: jsPDF, invoice: Invoice, startY: number, pageWidth: number, pageHeight: number) => {
  let currentY = startY;
  
  // Notes at the bottom if present
  if (invoice.notes) {
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("Notes:", 14, currentY);
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    
    // For longer notes, handle wrapping
    const splitNotes = doc.splitTextToLines(invoice.notes, pageWidth - 28);
    splitNotes.forEach((line, index) => {
      doc.text(line, 14, currentY + 7 + (index * 5));
    });
    
    currentY += 7 + (splitNotes.length * 5) + 10; // Adjust based on number of note lines
  }

  // Banking details in the footer - always at bottom of page
  const footerY = pageHeight - 40; // Position from bottom of page
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(14, footerY - 10, pageWidth - 14, footerY - 10);
  
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.text("BANKING DETAILS:", pageWidth / 2, footerY, { align: 'center' });
  doc.setFont(undefined, "normal");
  doc.setFontSize(9);
  doc.text(
    "Adrienne Hawkins. FNB, Sandton City (26095400). Account Number: 6212 7520 189",
    pageWidth / 2, 
    footerY + 6, 
    { align: 'center' }
  );
  doc.text("Please use your name as reference.", pageWidth / 2, footerY + 12, { align: 'center' });
  
  // Thank you message
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("Thank you for your business!", pageWidth / 2, pageHeight - 15, { align: "center" });
};
