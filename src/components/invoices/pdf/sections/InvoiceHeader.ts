
import { jsPDF } from "jspdf";
import { Invoice } from "@/hooks/invoices/types";
import { formatDate } from "@/lib/formatters";

/**
 * Adds invoice header information to the PDF
 */
export const addInvoiceHeader = (doc: jsPDF, invoice: Invoice, startY: number, pageWidth: number) => {
  // Set font styles for header section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  
  // Add invoice number with larger font
  doc.text(`INVOICE: ${invoice.invoice_number}`, 14, startY);
  
  // Add status with a clear format
  doc.setFontSize(12);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, pageWidth - 14, startY, { align: 'right' });

  // Invoice details (right side)
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Issued Date: ${formatDate(invoice.issued_date)}`, pageWidth - 14, startY + 10, { align: 'right' });
  doc.text(`Due Date: ${formatDate(invoice.due_date)}`, pageWidth - 14, startY + 17, { align: 'right' });
  
  // Add a subtle separator line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(14, startY + 25, pageWidth - 14, startY + 25);
  
  // Return the next Y position
  return startY + 35;
};
