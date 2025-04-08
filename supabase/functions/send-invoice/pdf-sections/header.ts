
import { jsPDF } from "npm:jspdf@2.5.1";
import { Invoice } from "../types.ts";
import { formatDate } from "../utils.ts";

/**
 * Adds invoice header information to the PDF
 */
export function addInvoiceHeader(doc: jsPDF, invoice: Invoice, startY: number, pageWidth: number): number {
  doc.setFontSize(15);
  doc.text(`INVOICE: ${invoice.invoice_number}`, 14, startY);
  
  // Add status
  doc.setFontSize(12);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, pageWidth - 60, startY);

  // Invoice details
  doc.setFontSize(10);
  doc.text(`Issued Date: ${formatDate(invoice.issued_date)}`, pageWidth - 80, startY + 10);
  doc.text(`Due Date: ${formatDate(invoice.due_date)}`, pageWidth - 80, startY + 15);
  
  return startY + 25;
}
