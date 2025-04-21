
import { jsPDF } from "jspdf";
import { Invoice } from "@/hooks/invoices/types";
import { format } from "date-fns";

export const addInvoiceHeader = (doc: jsPDF, invoice: Invoice, startY: number, pageWidth: number) => {
  // Center the invoice number with larger font
  doc.setFontSize(16);
  doc.text(`INVOICE: ${invoice.invoice_number}`, pageWidth / 2, startY, { align: 'center' });
  
  // Add status with clear format below the invoice number
  doc.setFontSize(12);
  doc.text(`Status: ${invoice.status?.toUpperCase() || 'DRAFT'}`, pageWidth / 2, startY + 8, { align: 'center' });

  // Invoice dates (centered, smaller font)
  doc.setFontSize(10);
  doc.text(`Issued Date: ${format(new Date(invoice.issued_date), "dd MMMM yyyy")}`, pageWidth / 2, startY + 16, { align: 'center' });
  doc.text(`Due Date: ${format(new Date(invoice.due_date), "dd MMMM yyyy")}`, pageWidth / 2, startY + 24, { align: 'center' });
  
  return startY + 32; // Return the new Y position after the header
};
