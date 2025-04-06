
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Invoice } from "@/hooks/invoices/types";
import { formatCurrency, formatDate } from "@/lib/formatters";

export const generateInvoicePDF = async (invoice: Invoice) => {
  // Create a new PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Add title
  doc.setFontSize(20);
  doc.text("Invoice", 14, 20);

  // Add invoice number
  doc.setFontSize(15);
  doc.text(`${invoice.invoice_number}`, 14, 30);
  
  // Add status
  doc.setFontSize(12);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, pageWidth - 60, 30);

  // Company info (left side)
  doc.setFontSize(10);
  doc.text("McKaynine Training Centre", 14, 45);
  doc.text("123 Main Street", 14, 50);
  doc.text("Cape Town, South Africa", 14, 55);
  doc.text("admin@mckaynine.com", 14, 60);
  
  // Invoice details (right side)
  doc.setFontSize(10);
  doc.text(`Issued Date: ${formatDate(invoice.issued_date)}`, pageWidth - 80, 45);
  doc.text(`Due Date: ${formatDate(invoice.due_date)}`, pageWidth - 80, 50);
  
  // Client info
  doc.setFontSize(12);
  doc.text("Bill To:", 14, 75);
  
  if (invoice.client) {
    doc.setFontSize(10);
    doc.text(`${invoice.client.first_name} ${invoice.client.last_name}`, 14, 82);
    doc.text(`${invoice.client.email}`, 14, 87);
    
    if (invoice.client.phone) {
      doc.text(`${invoice.client.phone}`, 14, 92);
    }

    if (invoice.client.address) {
      doc.text(`${invoice.client.address}`, 14, 97);
    }

    if (invoice.client.city && invoice.client.postal_code) {
      doc.text(`${invoice.client.city}, ${invoice.client.postal_code}`, 14, 102);
    }
  } else {
    doc.text("Client information unavailable", 14, 82);
  }

  // Invoice items table
  autoTable(doc, {
    startY: 115,
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

  // Footer
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
