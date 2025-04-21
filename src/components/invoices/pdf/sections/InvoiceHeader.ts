
import { jsPDF } from "jspdf";
import { Invoice } from "@/hooks/invoices/types";
import { format } from "date-fns";

export const addInvoiceHeader = (doc: jsPDF, invoice: Invoice, startY: number, pageWidth: number) => {
  // Add invoice number 
  doc.setFontSize(12);
  doc.text(`INVOICE: ${invoice.invoice_number}`, 14, startY);
  
  // Add status with clear format
  doc.text(`Status: ${invoice.status?.toUpperCase() || 'DRAFT'}`, pageWidth - 14, startY, { align: 'right' });

  // Invoice dates (right side, smaller font)
  doc.setFontSize(10);
  doc.text(`Issued Date: ${format(new Date(invoice.issued_date), "dd MMMM yyyy")}`, pageWidth - 14, startY + 10, { align: 'right' });
  doc.text(`Due Date: ${format(new Date(invoice.due_date), "dd MMMM yyyy")}`, pageWidth - 14, startY + 17, { align: 'right' });
  
  return startY + 25;
};
