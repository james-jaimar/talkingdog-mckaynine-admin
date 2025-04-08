
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Invoice } from "@/hooks/invoices/types";
import { formatCurrency, formatDate } from "@/lib/formatters";

export const generateInvoicePDF = async (invoice: Invoice) => {
  // Create a new PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Add McKaynine logo
  const logoPath = "/lovable-uploads/bb90b920-3e7c-4462-a0f1-d47b855c07b7.png";
  try {
    // Set logo to 75% of page width
    const imgWidth = pageWidth * 0.75;
    // Calculate height proportionally (assuming original aspect ratio)
    const imgHeight = imgWidth * (45/160); // Maintain aspect ratio
    const xPosition = (pageWidth - imgWidth) / 2;
    
    doc.addImage(logoPath, "PNG", xPosition, 10, imgWidth, imgHeight);
  } catch (error) {
    console.error("Error adding logo:", error);
    // If logo fails to load, add a text title instead
    doc.setFontSize(20);
    doc.text("McKaynine Training Centre", pageWidth / 2, 20, { align: 'center' });
  }
  
  // Add "PAID" stamp for paid invoices
  if (invoice.status === 'paid') {
    doc.setGlobalAlpha(0.3); // Set transparency
    doc.setFillColor(39, 174, 96); // Green color
    doc.setTextColor(255, 255, 255); // White text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(72);
    
    // Rotate and position the "PAID" text as a stamp
    doc.saveGraphicsState();
    doc.translate(pageWidth / 2, 120);
    doc.rotate(-30);
    doc.text("PAID", 0, 0, { align: 'center' });
    doc.restoreGraphicsState();
    
    // Reset styles for the rest of the document
    doc.setGlobalAlpha(1);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
  }
  
  // Add invoice number and status (positioned below the logo)
  const startY = 65; // Position after the logo
  
  doc.setFontSize(15);
  doc.text(`INVOICE: ${invoice.invoice_number}`, 14, startY);
  
  // Add status
  doc.setFontSize(12);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, pageWidth - 60, startY);

  // Invoice details (right side)
  doc.setFontSize(10);
  doc.text(`Issued Date: ${formatDate(invoice.issued_date)}`, pageWidth - 80, startY + 10);
  doc.text(`Due Date: ${formatDate(invoice.due_date)}`, pageWidth - 80, startY + 15);
  
  // Client info
  doc.setFontSize(12);
  doc.text("Bill To:", 14, startY + 25);
  
  if (invoice.client) {
    doc.setFontSize(10);
    doc.text(`${invoice.client.first_name} ${invoice.client.last_name}`, 14, startY + 32);
    doc.text(`${invoice.client.email}`, 14, startY + 37);
    
    if (invoice.client.phone) {
      doc.text(`${invoice.client.phone}`, 14, startY + 42);
    }

    if (invoice.client.address) {
      doc.text(`${invoice.client.address}`, 14, startY + 47);
    }

    if (invoice.client.city && invoice.client.postal_code) {
      doc.text(`${invoice.client.city}, ${invoice.client.postal_code}`, 14, startY + 52);
    }
  } else {
    doc.text("Client information unavailable", 14, startY + 32);
  }

  // Invoice items table
  autoTable(doc, {
    startY: startY + 65,
    head: [
      [
        'Description',
        'Quantity',
        'Unit Price',
        'Amount'
      ]
    ],
    body: invoice.items?.map(item => [
      item.description,
      item.quantity.toString(),
      formatCurrency(item.unit_price),
      formatCurrency(item.amount)
    ]) || [['No items found for this invoice', '', '', '']],
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [80, 80, 80],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'right', cellWidth: 25 },
      2: { halign: 'right', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 35 }
    },
  });

  // Add summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Draw a line
  doc.setDrawColor(200, 200, 200);
  doc.line(pageWidth - 90, finalY, pageWidth - 14, finalY);
  
  // Subtotal, Tax, Total
  doc.text("Subtotal:", pageWidth - 90, finalY + 8);
  doc.text(formatCurrency(invoice.subtotal), pageWidth - 25, finalY + 8, { align: "right" });
  
  doc.text(`Tax (${invoice.tax_rate}%):`, pageWidth - 90, finalY + 15);
  doc.text(formatCurrency(invoice.tax_amount), pageWidth - 25, finalY + 15, { align: "right" });
  
  // Draw another line
  doc.line(pageWidth - 90, finalY + 18, pageWidth - 14, finalY + 18);
  
  // Total (bold)
  doc.setFont(undefined, "bold");
  doc.text("Total:", pageWidth - 90, finalY + 25);
  doc.text(formatCurrency(invoice.total), pageWidth - 25, finalY + 25, { align: "right" });
  doc.setFont(undefined, "normal");
  
  // Notes at the bottom if present
  if (invoice.notes) {
    doc.setFontSize(11);
    doc.text("Notes:", 14, finalY + 40);
    doc.setFontSize(9);
    doc.text(invoice.notes, 14, finalY + 47);
  }

  // Banking details in the footer
  const footerY = doc.internal.pageSize.height - 40; // Position from bottom of page
  
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.text("BANKING DETAILS:", pageWidth / 2, footerY, { align: 'center' });
  doc.setFont(undefined, "normal");
  doc.setFontSize(9);
  doc.text(
    "Adrienne Hawkins. FNB, Sandton City (26095400). Account Number: 6212 7520 189",
    pageWidth / 2, 
    footerY + 6, 
    { align: 'center' }
  );
  doc.text("Please use your name as reference.", pageWidth / 2, footerY + 12, { align: 'center' });
  
  // Thank you message
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("Thank you for your business!", pageWidth / 2, doc.internal.pageSize.height - 15, { align: "center" });

  // Save the PDF with a filename based on the invoice number
  doc.save(`invoice-${invoice.invoice_number}.pdf`);
  
  return doc;
};

// Helper function to ensure the text doesn't overflow the page
const splitTextToFitPage = (doc: jsPDF, text: string, maxWidth: number) => {
  const textWidth = doc.getStringUnitWidth(text) * doc.getFontSize() / doc.internal.scaleFactor;
  if (textWidth <= maxWidth) {
    return [text];
  }
  
  // Simple split by words
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = doc.getStringUnitWidth(testLine) * doc.getFontSize() / doc.internal.scaleFactor;
    
    if (testWidth > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
};
