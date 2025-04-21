
import { jsPDF } from "jspdf";
import { Invoice } from "@/hooks/invoices/types";

/**
 * Adds the invoice footer including notes and banking details
 */
export const addInvoiceFooter = (doc: jsPDF, invoice: Invoice, startY: number, pageWidth: number, pageHeight: number) => {
  let currentY = startY;
  
  // Line before banking details
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 4, currentY, pageWidth - pageWidth / 4, currentY);
  currentY += 10;
  
  // Banking details section
  doc.setFontSize(10);
  doc.text("BANKING DETAILS:", pageWidth / 2, currentY, { align: 'center' });
  currentY += 6;
  
  doc.text(
    "Adrienne Hawkins, FNB, Sandton City (26095400), Account Number: 6212 7520 189",
    pageWidth / 2, 
    currentY, 
    { align: 'center' }
  );
  currentY += 6;
  
  doc.text("Please use your name as reference.", pageWidth / 2, currentY, { align: 'center' });
  currentY += 10;
  
  // Line after banking details
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 4, currentY, pageWidth - pageWidth / 4, currentY);
  currentY += 15;
  
  // Display the total amount
  if (invoice.total) {
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text("Total:", pageWidth / 2 - 25, currentY);
    doc.text(`R ${invoice.total.toFixed(2)}`, pageWidth / 2 + 25, currentY);
  }
  
  // Thank you message at the very bottom
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text("Thank you for your business!", pageWidth / 2, pageHeight - 15, { align: "center" });
};
