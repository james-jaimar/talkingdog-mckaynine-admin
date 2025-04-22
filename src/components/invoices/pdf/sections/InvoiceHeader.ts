
import { jsPDF } from "jspdf";
import { Invoice } from "@/hooks/invoices/types";
import { format } from "date-fns";

export const addInvoiceHeader = (doc: jsPDF, invoice: Invoice, startY: number, pageWidth: number) => {
  // Set smaller font size for invoice details
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  // Left-aligned invoice number
  doc.text(`INVOICE: ${invoice.invoice_number}`, 14, startY);
  
  // Right-aligned status and dates
  doc.text(`Status: ${invoice.status?.toUpperCase() || 'DRAFT'}`, pageWidth - 14, startY, { align: 'right' });
  
  // Format dates
  const issuedDate = format(new Date(invoice.issued_date), "dd MMMM yyyy");
  const dueDate = format(new Date(invoice.due_date), "dd MMMM yyyy");
  
  // Add dates below status
  doc.text(`Issued Date: ${issuedDate}`, pageWidth - 14, startY + 5, { align: 'right' });
  doc.text(`Due Date: ${dueDate}`, pageWidth - 14, startY + 10, { align: 'right' });
  
  return startY + 20;
};
