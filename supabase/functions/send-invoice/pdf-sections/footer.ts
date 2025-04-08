
import { jsPDF } from "npm:jspdf@2.5.1";

/**
 * Adds the invoice footer including banking details and thank you message
 */
export function addInvoiceFooter(doc: jsPDF, pageWidth: number, pageHeight: number): void {
  // Banking details in the footer
  const footerY = pageHeight - 40;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("BANKING DETAILS:", pageWidth / 2, footerY, { align: 'center' });
  doc.setFont("helvetica", "normal");
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
}
