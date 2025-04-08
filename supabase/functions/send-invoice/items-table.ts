
import { jsPDF } from "npm:jspdf@2.5.1";
import { Invoice } from "./types.ts";
import { formatCurrency } from "./pdf-helpers.ts";

/**
 * Adds the invoice items table to the PDF
 */
export function addInvoiceItemsTable(doc: jsPDF, invoice: Invoice, startY: number): number {
  try {
    console.log("Adding invoice items table...");
    console.log("Items count:", invoice.items?.length || 0);
    
    // Manual implementation of table since autoTable is causing issues
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
    
    // Reset styles for rows
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    
    // Table rows
    let currentY = startY + 10;
    const rowHeight = 8;
    
    if (!invoice.items || invoice.items.length === 0) {
      doc.text('No items found for this invoice', margin + 3, currentY + 5);
      currentY += rowHeight;
    } else {
      invoice.items.forEach((item) => {
        // Item background (alternating)
        if ((currentY - startY) % 20 === 10) {
          doc.setFillColor(245, 245, 245);
          doc.rect(margin, currentY, tableWidth, rowHeight, "F");
        }
        
        // Item text
        currentX = margin + 3;
        doc.text(item.description || 'Unknown item', currentX, currentY + 5);
        
        currentX = margin + colWidths[0] + colWidths[1] - 3;
        doc.text(item.quantity?.toString() || '1', currentX, currentY + 5, { align: 'right' });
        
        currentX = margin + colWidths[0] + colWidths[1] + colWidths[2] - 3;
        doc.text(formatCurrency(item.unit_price || 0), currentX, currentY + 5, { align: 'right' });
        
        currentX = margin + tableWidth - 3;
        doc.text(formatCurrency(item.amount || (item.quantity * item.unit_price) || 0), currentX, currentY + 5, { align: 'right' });
        
        currentY += rowHeight;
      });
    }
    
    // Draw table borders
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, startY, margin, currentY); // Left border
    doc.line(margin + tableWidth, startY, margin + tableWidth, currentY); // Right border
    doc.line(margin, currentY, margin + tableWidth, currentY); // Bottom border
    
    // Column dividers
    let dividerX = margin + colWidths[0];
    doc.line(dividerX, startY, dividerX, currentY);
    
    dividerX += colWidths[1];
    doc.line(dividerX, startY, dividerX, currentY);
    
    dividerX += colWidths[2];
    doc.line(dividerX, startY, dividerX, currentY);
    
    console.log("Table added successfully");
    return currentY;
  } catch (error) {
    console.error("Error adding invoice items table:", error);
    // If table generation fails, return the startY plus some space to continue with the PDF
    return startY + 40;
  }
}
