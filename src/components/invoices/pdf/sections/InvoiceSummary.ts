
import { jsPDF } from "jspdf";
import { Invoice } from "@/hooks/invoices/types";
import { formatCurrency } from "@/lib/formatters";

/**
 * Adds the invoice summary (subtotal, tax, total) to the PDF
 */
export const addInvoiceSummary = (doc: jsPDF, invoice: Invoice, startY: number, pageWidth: number) => {
  const finalY = startY + 10;
  
  // Draw a line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(pageWidth - 90, finalY, pageWidth - 14, finalY);
  
  // Subtotal, Tax, Total
  doc.setFontSize(10);
  doc.text("Subtotal:", pageWidth - 90, finalY + 8);
  doc.text(formatCurrency(invoice.subtotal), pageWidth - 14, finalY + 8, { align: "right" });
  
  doc.text(`Tax (${invoice.tax_rate}%):`, pageWidth - 90, finalY + 15);
  doc.text(formatCurrency(invoice.tax_amount), pageWidth - 14, finalY + 15, { align: "right" });
  
  // Draw another line
  doc.line(pageWidth - 90, finalY + 18, pageWidth - 14, finalY + 18);
  
  // Total (bold)
  doc.setFont(undefined, "bold");
  doc.text("Total:", pageWidth - 90, finalY + 25);
  doc.text(formatCurrency(invoice.total), pageWidth - 14, finalY + 25, { align: "right" });
  doc.setFont(undefined, "normal");
  
  // Return the next Y position
  return finalY + 35;
};
