
import { jsPDF } from "jspdf";
import { Invoice } from "@/hooks/invoices/types";
import { formatDate } from "@/lib/formatters";

/**
 * Adds invoice header information to the PDF
 */
export const addInvoiceHeader = (doc: jsPDF, invoice: Invoice, startY: number, pageWidth: number) => {
  // Add invoice number with larger font
  doc.setFontSize(14);
  doc.text(`INVOICE: ${invoice.invoice_number}`, 14, startY);
  
  // Add status with clear format on the right side
  doc.text(`Status: ${invoice.status?.toUpperCase() || 'DRAFT'}`, pageWidth - 14, startY, { align: 'right' });

  // Invoice details (right side, smaller font)
  doc.setFontSize(10);
  doc.text(`Issued Date: ${formatDate(invoice.issued_date)}`, pageWidth - 14, startY + 10, { align: 'right' });
  doc.text(`Due Date: ${formatDate(invoice.due_date)}`, pageWidth - 14, startY + 17, { align: 'right' });
  
  return startY + 25; // Reduced from 30 to tighten spacing
};
