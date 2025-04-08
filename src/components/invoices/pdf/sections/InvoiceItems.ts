
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Invoice } from "@/hooks/invoices/types";
import { formatCurrency } from "@/lib/formatters";

/**
 * Adds the invoice items table to the PDF
 */
export const addInvoiceItemsTable = (doc: jsPDF, invoice: Invoice, startY: number) => {
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
      item.quantity.toString(),
      formatCurrency(item.unit_price),
      formatCurrency(item.amount || 0)
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

  // Return the final Y position after the table
  return (doc as any).lastAutoTable.finalY;
};
