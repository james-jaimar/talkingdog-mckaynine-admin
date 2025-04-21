
import { Invoice } from "@/hooks/invoices/types";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import { format } from "date-fns";
import { formatCurrency } from "@/lib/formatters";
import autoTable from 'jspdf-autotable';

/**
 * Generates a PDF for the given invoice and either downloads it or returns base64 data
 */
export async function generateInvoicePDF(invoice: Invoice, returnBase64: boolean = false): Promise<string | void> {
  // Create new PDF document
  const doc = new jsPDF();
  
  // Set document properties
  doc.setProperties({
    title: `Invoice ${invoice.invoice_number}`,
    subject: 'McKaynine Training Centre Invoice',
    author: 'McKaynine Training Centre',
    creator: 'McKaynine Training System'
  });
  
  // Add company logo and header
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text("McKaynine Training Centre", 15, 20);
  
  // Company details
  doc.setFontSize(10);
  doc.text("McKaynine Training Centre", 15, 30);
  doc.text("Sandton, Johannesburg", 15, 35);
  doc.text("Email: admin@talkingdog.co.za", 15, 40);
  
  // Invoice details
  doc.setFontSize(14);
  doc.text(`Invoice ${invoice.invoice_number}`, 15, 55);
  
  doc.setFontSize(10);
  doc.text(`Date: ${format(new Date(invoice.issued_date), "MMMM d, yyyy")}`, 15, 65);
  doc.text(`Due Date: ${format(new Date(invoice.due_date), "MMMM d, yyyy")}`, 15, 70);
  
  // Status
  let statusColor;
  switch (invoice.status) {
    case 'paid':
      statusColor = [0, 128, 0]; // Green
      break;
    case 'overdue':
      statusColor = [255, 0, 0]; // Red
      break;
    case 'sent':
      statusColor = [0, 0, 255]; // Blue
      break;
    default:
      statusColor = [128, 128, 128]; // Grey
  }
  
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 15, 80);
  doc.setTextColor(0, 0, 0);
  
  // Client information
  const clientName = `${invoice.client.first_name} ${invoice.client.last_name || ''}`.trim();
  doc.text("Bill To:", 130, 55);
  doc.text(clientName, 130, 65);
  if (invoice.client.address) {
    doc.text(invoice.client.address, 130, 70);
  }
  if (invoice.client.city && invoice.client.postal_code) {
    doc.text(`${invoice.client.city}, ${invoice.client.postal_code}`, 130, 75);
  } else if (invoice.client.city) {
    doc.text(invoice.client.city, 130, 75);
  }
  if (invoice.client.email) {
    doc.text(`Email: ${invoice.client.email}`, 130, 80);
  }
  
  // Prepare table data
  const tableColumn = ["Description", "Quantity", "Unit Price", "Amount"];
  let tableRows = [];
  
  // Add invoice items
  if (invoice.items && invoice.items.length > 0) {
    tableRows = invoice.items.map(item => [
      item.description,
      item.quantity.toString(),
      formatCurrency(item.unit_price),
      formatCurrency(item.amount)
    ]);
  } else {
    // Default item if no items are available
    tableRows.push([
      "Training services",
      "1",
      formatCurrency(invoice.total),
      formatCurrency(invoice.total)
    ]);
  }
  
  // Generate table
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 95,
    theme: 'striped',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [66, 66, 66] }
  });
  
  // Add summary
  let finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.text("Subtotal:", 130, finalY);
  doc.text(formatCurrency(invoice.subtotal), 175, finalY, { align: "right" });
  
  if (invoice.discount_amount > 0) {
    finalY += 7;
    doc.text("Discount:", 130, finalY);
    doc.text(`-${formatCurrency(invoice.discount_amount)}`, 175, finalY, { align: "right" });
  }
  
  if (invoice.tax_amount > 0) {
    finalY += 7;
    doc.text(`Tax (${invoice.tax_rate}%):`, 130, finalY);
    doc.text(formatCurrency(invoice.tax_amount), 175, finalY, { align: "right" });
  }
  
  finalY += 7;
  doc.setFontSize(12);
  doc.text("Total:", 130, finalY);
  doc.text(formatCurrency(invoice.total), 175, finalY, { align: "right" });
  
  // Add notes if available
  if (invoice.notes) {
    finalY += 15;
    doc.setFontSize(11);
    doc.text("Notes:", 15, finalY);
    doc.setFontSize(9);
    
    // Split notes into lines to handle wrapping
    const maxWidth = 180;
    const splitText = doc.splitTextToSize(invoice.notes, maxWidth);
    doc.text(splitText, 15, finalY + 7);
  }
  
  // Add payment instructions
  finalY += 30;
  doc.setFontSize(10);
  doc.text("Payment Instructions:", 15, finalY);
  doc.setFontSize(9);
  doc.text("Please make payment to the following bank account:", 15, finalY + 7);
  doc.text("Adrienne Hawkins", 15, finalY + 14);
  doc.text("FNB, Sandton City (26095400)", 15, finalY + 21);
  doc.text("Account Number: 6212 7520 189", 15, finalY + 28);
  doc.text("Please use your name as the payment reference.", 15, finalY + 35);
  
  // Add footer
  doc.setFontSize(8);
  doc.text("Thank you for your business!", 105, 280, { align: "center" });
  
  if (returnBase64) {
    // Return base64 encoded PDF data
    return doc.output('datauristring').split(',')[1];
  } else {
    // Save the PDF
    doc.save(`Invoice-${invoice.invoice_number}.pdf`);
  }
}
