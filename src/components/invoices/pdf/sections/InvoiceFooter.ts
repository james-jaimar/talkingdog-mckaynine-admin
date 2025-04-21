
import { jsPDF } from "jspdf";
import { Invoice } from "@/hooks/invoices/types";

export const addInvoiceFooter = (doc: jsPDF, invoice: Invoice, startY: number, pageWidth: number, pageHeight: number) => {
  let currentY = startY;
  
  // Add horizontal line before banking details
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(pageWidth / 4, currentY, pageWidth - pageWidth / 4, currentY);
  currentY += 10;
  
  // Banking details section
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
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
  
  // Add horizontal line after banking details
  doc.line(pageWidth / 4, currentY, pageWidth - pageWidth / 4, currentY);
  currentY += 10;
  
  // Display total
  doc.setFont(undefined, 'bold');
  doc.text("Total:", pageWidth / 2 - 15, currentY);
  doc.text(`R ${invoice.total.toFixed(2)}`, pageWidth / 2 + 15, currentY);
  
  // Thank you message at the bottom
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text("Thank you for your business!", pageWidth / 2, pageHeight - 15, { align: 'center' });
};
