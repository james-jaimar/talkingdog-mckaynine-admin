
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
    
    // Use autoTable for proper formatting
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
        cellPadding: 4, // Reduced from 5 to tighten spacing
        lineWidth: 0.5,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [70, 70, 70],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'center', cellWidth: 30 },
        2: { halign: 'right', cellWidth: 40 },
        3: { halign: 'right', cellWidth: 40 }
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 14, right: 14 }
    });
    
    // Return the final Y position after the table
    return (doc as any).lastAutoTable.finalY;
  } catch (error) {
    console.error("Error creating invoice items table:", error);
    // Return a reasonable position if table creation fails
    return startY + 40;
  }
};
