
import { jsPDF } from "npm:jspdf@2.5.1";
import { Invoice } from "../types.ts";
import { formatDate } from "../utils.ts";

/**
 * Adds invoice header information to the PDF
 */
export function addInvoiceHeader(doc: jsPDF, invoice: Invoice, startY: number, pageWidth: number): number {
  // Add invoice number with larger font
  doc.setFontSize(14);
  doc.text(`INVOICE: ${invoice.invoice_number}`, 14, startY);
  
  // Add status with clear format on the right side
  doc.text(`Status: ${invoice.status?.toUpperCase() || 'DRAFT'}`, pageWidth - 14, startY, { align: 'right' });

  // Invoice details (right side, smaller font)
  doc.setFontSize(10);
  doc.text(`Issued Date: ${formatDate(invoice.issued_date)}`, pageWidth - 14, startY + 10, { align: 'right' });
  doc.text(`Due Date: ${formatDate(invoice.due_date)}`, pageWidth - 14, startY + 17, { align: 'right' });
  
  return startY + 25; // Return the new Y position
}
