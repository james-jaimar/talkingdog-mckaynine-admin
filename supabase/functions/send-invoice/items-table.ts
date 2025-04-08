
import { jsPDF } from "npm:jspdf@2.5.1";
import autoTable from "npm:jspdf-autotable@3.8.2";
import { Invoice } from "./types.ts";
import { formatCurrency } from "./pdf-helpers.ts";

/**
 * Adds the invoice items table to the PDF
 */
export function addInvoiceItemsTable(doc: jsPDF, invoice: Invoice, startY: number): number {
  try {
    console.log("Adding invoice items table...");
    console.log("Items count:", invoice.items?.length || 0);
    
    // Use autoTable for better formatting and layout
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
      body: invoice.items?.map(item => [
        item.description,
        item.quantity?.toString() || '1',
        formatCurrency(item.unit_price || 0),
        formatCurrency(item.amount || (item.quantity * item.unit_price) || 0)
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
    
    console.log("Table added successfully");
    return (doc as any).lastAutoTable.finalY;
  } catch (error) {
    console.error("Error adding invoice items table:", error);
    // Fall back to manual table if autoTable fails
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;
    const tableWidth = pageWidth - (margin * 2);
    
    // Define column widths
    const colWidths = [
      tableWidth * 0.5,  // Description (50%)
      tableWidth * 0.15, // Quantity (15%)
      tableWidth * 0.17, // Unit Price (17%)
      tableWidth * 0.18  // Amount (18%)
    ];
    
    // Table header
    doc.setFillColor(80, 80, 80);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    
    // Header background
    doc.rect(margin, startY, tableWidth, 10, "F");
    
    // Header text
    let currentX = margin + 3;
    doc.text('Description', currentX, startY + 6);
    
    currentX += colWidths[0];
    doc.text('Quantity', currentX, startY + 6, { align: 'right' });
    
    currentX += colWidths[1];
    doc.text('Unit Price', currentX, startY + 6, { align: 'right' });
    
    currentX += colWidths[2];
    doc.text('Amount', currentX, startY + 6, { align: 'right' });
    
    // Reset text color for rows
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    
    let currentY = startY + 10;
    const rowHeight = 8;
    
    if (!invoice.items || invoice.items.length === 0) {
      doc.text('No items found for this invoice', margin + 3, currentY + 5);
      currentY += rowHeight;
    } else {
      invoice.items.forEach((item) => {
        doc.text(item.description || 'Unknown item', currentX - colWidths[2] - colWidths[1] - colWidths[0] + 3, currentY + 5);
        doc.text(item.quantity?.toString() || '1', currentX - colWidths[2] - colWidths[1] - 3, currentY + 5, { align: 'right' });
        doc.text(formatCurrency(item.unit_price || 0), currentX - colWidths[2] - 3, currentY + 5, { align: 'right' });
        doc.text(formatCurrency(item.amount || (item.quantity * item.unit_price) || 0), currentX - 3, currentY + 5, { align: 'right' });
        currentY += rowHeight;
      });
    }
    
    return currentY + 10;
  }
}
