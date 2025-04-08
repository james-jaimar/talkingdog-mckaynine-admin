
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
        cellPadding: 5,
        lineWidth: 0.5,
        overflow: 'linebreak', // Handle text overflow with line breaks
      },
      headStyles: {
        fillColor: [70, 70, 70],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 'auto' }, // Description takes available space
        1: { halign: 'center', cellWidth: 30 }, // Center-align quantity
        2: { halign: 'right', cellWidth: 40 }, // Right-align price
        3: { halign: 'right', cellWidth: 40 } // Right-align amount
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245] // Light gray for alternate rows
      },
      margin: { left: 14, right: 14 },
      didParseCell: function(data) {
        // Ensure description text wraps properly
        if (data.column.index === 0) {
          data.cell.styles.cellWidth = 'auto';
        }
      },
      willDrawCell: function(data) {
        // Add dynamic styling for cells if needed
        if (data.section === 'head') {
          doc.setFillColor(70, 70, 70);
        }
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
    doc.setFillColor(70, 70, 70);
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
        // Handle long descriptions with text wrapping
        const description = item.description || 'Unknown item';
        const descLines = [];
        let tempDesc = description;
        const maxWidth = colWidths[0] - 6; // Subtract some padding
        
        while (tempDesc.length > 0) {
          let i = 0;
          if (doc.getStringUnitWidth(tempDesc) * 9 <= maxWidth) {
            descLines.push(tempDesc);
            break;
          }
          
          // Find breaking point
          while (i < tempDesc.length) {
            if (doc.getStringUnitWidth(tempDesc.substring(0, i)) * 9 > maxWidth) {
              // Find last space before this point
              let lastSpace = tempDesc.substring(0, i).lastIndexOf(' ');
              if (lastSpace <= 0) lastSpace = i; // If no space found, break at current position
              
              descLines.push(tempDesc.substring(0, lastSpace));
              tempDesc = tempDesc.substring(lastSpace + 1);
              break;
            }
            i++;
          }
          
          if (i >= tempDesc.length) {
            descLines.push(tempDesc);
            break;
          }
        }
        
        // Calculate dynamic row height based on description length
        const itemRowHeight = Math.max(rowHeight, descLines.length * rowHeight);
        
        // Print description lines
        descLines.forEach((line, idx) => {
          doc.text(line, currentX - colWidths[2] - colWidths[1] - colWidths[0] + 3, currentY + 5 + (idx * 5));
        });
        
        // Print other columns
        doc.text(item.quantity?.toString() || '1', currentX - colWidths[2] - colWidths[1] - 3, currentY + 5, { align: 'right' });
        doc.text(formatCurrency(item.unit_price || 0), currentX - colWidths[2] - 3, currentY + 5, { align: 'right' });
        doc.text(formatCurrency(item.amount || (item.quantity * item.unit_price) || 0), currentX - 3, currentY + 5, { align: 'right' });
        
        // Move to next row
        currentY += Math.max(rowHeight, descLines.length * 5 + 3);
      });
    }
    
    return currentY + 10;
  }
}
