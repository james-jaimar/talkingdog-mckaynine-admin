
import { jsPDF } from "jspdf";
import { Invoice } from "@/hooks/invoices/types";

/**
 * Adds client information to the invoice PDF
 */
export const addClientInfo = (doc: jsPDF, invoice: Invoice, startY: number) => {
  doc.setFontSize(12);
  doc.text("Bill To:", 14, startY);
  
  if (invoice.client) {
    doc.setFontSize(10);
    doc.text(`${invoice.client.first_name} ${invoice.client.last_name}`, 14, startY + 7);
    doc.text(`${invoice.client.email}`, 14, startY + 12);
    
    if (invoice.client.phone) {
      doc.text(`${invoice.client.phone}`, 14, startY + 17);
    }

    if (invoice.client.address) {
      doc.text(`${invoice.client.address}`, 14, startY + 22);
    }

    if (invoice.client.city && invoice.client.postal_code) {
      doc.text(`${invoice.client.city}, ${invoice.client.postal_code}`, 14, startY + 27);
    }

    // Return the next Y position
    return startY + 40;
  }

  // If no client info, add placeholder
  doc.text("Client information unavailable", 14, startY + 7);
  return startY + 15;
};
