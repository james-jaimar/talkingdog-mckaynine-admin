
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
    
    // Define consistent column widths
    const tableColumns = [
      { header: 'Description', dataKey: 'description' },
      { header: 'Quantity', dataKey: 'quantity' },
      { header: 'Unit Price', dataKey: 'unit_price' },
      { header: 'Amount', dataKey: 'amount' }
    ];
    
    const tableRows = invoice.items?.map(item => ({
      description: item.description,
      quantity: item.quantity.toString(),
      unit_price: formatCurrency(item.unit_price),
      amount: formatCurrency(item.amount || item.quantity * item.unit_price)
    })) || [{ description: 'No items found for this invoice', quantity: '', unit_price: '', amount: '' }];
    
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
      body: tableRows.map(row => [
        row.description,
        row.quantity,
        row.unit_price,
        row.amount
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 5, // Increased padding for better readability
        lineWidth: 0.5,
        overflow: 'linebreak', // Handle overflow with line breaks
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
          // Custom header styling
          doc.setFillColor(70, 70, 70);
        }
      },
      didDrawPage: function(data) {
        // Handle page breaks if needed
        console.log("Page break occurred in table");
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
