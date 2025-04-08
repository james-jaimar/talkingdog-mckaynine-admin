
import { jsPDF } from "npm:jspdf@2.5.1";
import { Invoice } from "../types.ts";
import { formatCurrency } from "../utils.ts";

/**
 * Adds the invoice summary (subtotal, tax, total) to the PDF
 */
export function addInvoiceSummary(doc: jsPDF, invoice: Invoice, startY: number, pageWidth: number): number {
  const finalY = startY + 10;
  
  // Draw a line
  doc.setDrawColor(200, 200, 200);
  doc.line(pageWidth - 90, finalY, pageWidth - 14, finalY);
  
  // Subtotal, Tax, Total
  doc.text("Subtotal:", pageWidth - 90, finalY + 8);
  doc.text(formatCurrency(invoice.subtotal), pageWidth - 25, finalY + 8, { align: "right" });
  
  doc.text(`Tax (${invoice.tax_rate}%):`, pageWidth - 90, finalY + 15);
  doc.text(formatCurrency(invoice.tax_amount), pageWidth - 25, finalY + 15, { align: "right" });
  
  // Draw another line
  doc.line(pageWidth - 90, finalY + 18, pageWidth - 14, finalY + 18);
  
  // Total (bold)
  doc.setFont("helvetica", "bold");
  doc.text("Total:", pageWidth - 90, finalY + 25);
  doc.text(formatCurrency(invoice.total), pageWidth - 25, finalY + 25, { align: "right" });
  doc.setFont("helvetica", "normal");
  
  return finalY + 35;
}
