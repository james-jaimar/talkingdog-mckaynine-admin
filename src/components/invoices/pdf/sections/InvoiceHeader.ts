
import { jsPDF } from "jspdf";
import { Invoice } from "@/hooks/invoices/types";
import { format } from "date-fns";

export const addInvoiceHeader = (doc: jsPDF, invoice: Invoice, startY: number, pageWidth: number) => {
  // Invoice number left-aligned
  doc.setFontSize(12);
  doc.text(`INVOICE: ${invoice.invoice_number}`, 14, startY);
  
  // Status right-aligned on the same line
  doc.text(`Status: ${invoice.status?.toUpperCase() || 'DRAFT'}`, pageWidth - 14, startY, { align: 'right' });
  
  // Add dates right-aligned below status
  doc.setFontSize(10);
  const issuedDate = format(new Date(invoice.issued_date), "dd MMMM yyyy");
  const dueDate = format(new Date(invoice.due_date), "dd MMMM yyyy");
  
  doc.text(`Issued Date: ${issuedDate}`, pageWidth - 14, startY + 10, { align: 'right' });
  doc.text(`Due Date: ${dueDate}`, pageWidth - 14, startY + 18, { align: 'right' });
  
  return startY + 25; // Return the new Y position
};
