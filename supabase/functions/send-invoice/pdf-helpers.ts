
import { jsPDF } from "npm:jspdf@2.5.1";
import autoTable from "npm:jspdf-autotable@3.8.2";

// Helper function to format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  }).format(amount);
}

// Helper function to format date
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

// Add paid stamp to PDF 
export function addPaidStamp(doc: jsPDF, pageWidth: number) {
  // Set appearance for the "PAID" stamp
  doc.setFillColor(39, 174, 96); // Green color
  doc.setTextColor(255, 255, 255); // White text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(72);
  
  // Calculate position for the center of the page
  const stampX = pageWidth / 2;
  const stampY = 120;
  
  // Save current graphics state
  doc.saveGraphicsState();
  
  // Set transparency using the proper method for jsPDF
  doc.setGState(new (doc as any).GState({ opacity: 0.3 }));
  
  // Add rotated "PAID" text as a stamp
  doc.text("PAID", stampX, stampY, { 
    align: 'center',
    angle: -30
  });
  
  // Restore graphics state to reset opacity
  doc.restoreGraphicsState();
  
  // Reset styles for the rest of the document
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
}

// Add invoice header
export function addInvoiceHeader(doc: jsPDF, invoice: any, startY: number, pageWidth: number) {
  doc.setFontSize(15);
  doc.text(`INVOICE: ${invoice.invoice_number}`, 14, startY);
  
  // Add status
  doc.setFontSize(12);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, pageWidth - 60, startY);

  // Invoice details
  doc.setFontSize(10);
  doc.text(`Issued Date: ${formatDate(invoice.issued_date)}`, pageWidth - 80, startY + 10);
  doc.text(`Due Date: ${formatDate(invoice.due_date)}`, pageWidth - 80, startY + 15);
  
  return startY + 25;
}

// Add client info
export function addClientInfo(doc: jsPDF, invoice: any, startY: number) {
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

// Add invoice items table
export function addInvoiceItemsTable(doc: jsPDF, invoice: any, startY: number) {
  autoTable(doc, {
    startY: startY,
    head: [
      [
        'Description',
        'Quantity',
        'Unit Price',
        'Amount'
      ]
    ],
    body: invoice.items?.map((item: any) => [
      item.description,
      item.quantity.toString(),
      formatCurrency(item.unit_price),
      formatCurrency(item.amount || (item.quantity * item.unit_price))
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

  return (doc as any).lastAutoTable.finalY;
}

// Add invoice summary
export function addInvoiceSummary(doc: jsPDF, invoice: any, startY: number, pageWidth: number) {
  const finalY = startY + 10;
  
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
  
  doc.setFont("helvetica", "bold");
  doc.text("Total:", pageWidth - 90, finalY + 25);
  doc.text(formatCurrency(invoice.total), pageWidth - 25, finalY + 25, { align: "right" });
  doc.setFont("helvetica", "normal");
  
  return finalY + 35;
}

// Add invoice footer
export function addInvoiceFooter(doc: jsPDF, pageWidth: number, pageHeight: number) {
  // Banking details in the footer
  const footerY = pageHeight - 40;
  doc.setFontSize(10);
  doc.text("BANKING DETAILS: Adrienne Hawkins. FNB, Sandton City (26095400). Account Number: 6212 7520 189", pageWidth / 2, footerY, { align: 'center' });
  doc.text("Please use your name as reference.", pageWidth / 2, footerY + 6, { align: 'center' });
  
  // Thank you message
  doc.text("Thank you for your business!", pageWidth / 2, pageHeight - 15, { align: "center" });
}
