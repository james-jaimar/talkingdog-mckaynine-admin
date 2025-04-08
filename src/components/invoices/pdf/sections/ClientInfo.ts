
import { jsPDF } from "jspdf";
import { Invoice } from "@/hooks/invoices/types";

/**
 * Adds client information to the invoice PDF
 */
export const addClientInfo = (doc: jsPDF, invoice: Invoice, startY: number) => {
  // Set styles for the "Bill To" section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 14, startY);
  
  // Reset to normal font for client details
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  if (invoice.client) {
    // Client name
    const clientName = `${invoice.client.first_name} ${invoice.client.last_name}`;
    doc.text(clientName, 14, startY + 7);
    
    // Client email
    if (invoice.client.email) {
      doc.text(invoice.client.email, 14, startY + 14);
    }
    
    // Client phone
    if (invoice.client.phone) {
      doc.text(invoice.client.phone, 14, startY + 21);
    }
    
    // Client address (if available)
    let addressY = startY + 28;
    if (invoice.client.address) {
      doc.text(invoice.client.address, 14, addressY);
      addressY += 7;
    }

    if (invoice.client.city || invoice.client.postal_code) {
      const cityZip = [invoice.client.city, invoice.client.postal_code]
        .filter(Boolean)
        .join(", ");
        
      if (cityZip) {
        doc.text(cityZip, 14, addressY);
        addressY += 7;
      }
    }

    // Return the next Y position based on how many lines of address were added
    return addressY + 5;
  }

  // If no client info, add placeholder
  doc.text("Client information unavailable", 14, startY + 7);
  return startY + 15;
};
