
import { jsPDF } from "jspdf";
import { Invoice } from "@/hooks/invoices/types";
import { formatDate } from "@/lib/formatters";

/**
 * Adds invoice header information to the PDF
 */
export const addInvoiceHeader = (doc: jsPDF, invoice: Invoice, startY: number, pageWidth: number) => {
  // Add invoice number and status
  doc.setFontSize(15);
  doc.text(`INVOICE: ${invoice.invoice_number}`, 14, startY);
  
  // Add status
  doc.setFontSize(12);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, pageWidth - 60, startY);

  // Invoice details (right side)
  doc.setFontSize(10);
  doc.text(`Issued Date: ${formatDate(invoice.issued_date)}`, pageWidth - 80, startY + 10);
  doc.text(`Due Date: ${formatDate(invoice.due_date)}`, pageWidth - 80, startY + 15);
  
  // Return the next Y position
  return startY + 25;
};
