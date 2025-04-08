
import { jsPDF } from "npm:jspdf@2.5.1";
import { Invoice } from "../types.ts";

/**
 * Adds client information to the invoice PDF
 */
export function addClientInfo(doc: jsPDF, invoice: Invoice, startY: number): number {
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

    return startY + 30;
  }
  
  doc.text("Client information unavailable", 14, startY + 7);
  return startY + 15;
}
