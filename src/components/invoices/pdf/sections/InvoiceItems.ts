
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Invoice } from "@/hooks/invoices/types";
import { formatCurrency } from "@/lib/formatters";

/**
 * Adds the invoice items table to the PDF
 */
export const addInvoiceItemsTable = (doc: jsPDF, invoice: Invoice, startY: number) => {
  try {
    console.log("Adding invoice items to PDF table");
    
    autoTable(doc, {
      startY: startY + 5, // Add some spacing before the table
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
        formatCurrency(item.amount || item.quantity * item.unit_price)
      ]) || [['No items found for this invoice', '', '', '']],
      styles: {
        fontSize: 9,
        cellPadding: 5, // Increased padding for better readability
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [80, 80, 80],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
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
      didParseCell: function(data) {
        // Ensure description text wraps properly
        if (data.column.index === 0) {
          data.cell.styles.cellWidth = 'auto';
        }
      }
    });

    // Return the final Y position after the table
    return (doc as any).lastAutoTable.finalY + 5; // Add some spacing after the table
  } catch (error) {
    console.error("Error creating invoice items table:", error);
    // Return a reasonable position if table creation fails
    return startY + 100;
  }
};
