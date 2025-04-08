
import { jsPDF } from "npm:jspdf@2.5.1";
import autoTable from "npm:jspdf-autotable@3.8.2";
import { Invoice } from "../types.ts";
import { formatCurrency } from "../utils.ts";

/**
 * Adds the invoice items table to the PDF
 */
export function addInvoiceItemsTable(doc: jsPDF, invoice: Invoice, startY: number): number {
  try {
    console.log("Adding invoice items table...");
    console.log("Items count:", invoice.items?.length || 0);
    
    // Create table with invoice items
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
      },
      headStyles: {
        fillColor: [70, 70, 70],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
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
      margin: { left: 14, right: 14 },
    });
    
    console.log("Table added successfully");
    return (doc as any).lastAutoTable.finalY;
  } catch (error) {
    console.error("Error adding invoice items table:", error);
    // If table generation fails, return the startY plus some space to continue with the PDF
    return startY + 40;
  }
}
