
import { jsPDF } from "npm:jspdf@2.5.1";
import { Invoice } from "../types.ts";

/**
 * Adds client information to the invoice PDF
 */
export function addClientInfo(doc: jsPDF, invoice: Invoice, startY: number): number {
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 14, startY);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  if (invoice.client) {
    let currentY = startY + 7;
    const lineHeight = 5;
    
    // Client name
    const clientName = `${invoice.client.first_name} ${invoice.client.last_name}`;
    doc.text(clientName, 14, currentY);
    currentY += lineHeight;
    
    // Client email
    if (invoice.client.email) {
      doc.text(invoice.client.email, 14, currentY);
      currentY += lineHeight;
    }
    
    // Client phone
    if (invoice.client.phone) {
      doc.text(invoice.client.phone, 14, currentY);
      currentY += lineHeight;
    }
    
    // Client address (if available)
    if (invoice.client.address) {
      doc.text(invoice.client.address, 14, currentY);
      currentY += lineHeight;
    }

    return currentY + 10; // Return the new Y position with some padding
  }
  
  doc.text("Client information unavailable", 14, startY + 7);
  return startY + 15;
}
