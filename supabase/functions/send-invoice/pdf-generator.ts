
import { jsPDF } from "npm:jspdf@2.5.1";
import { Invoice } from "./types.ts";
import { addPaidStamp } from "./pdf-sections/stamp.ts";
import { addInvoiceHeader } from "./pdf-sections/header.ts";
import { addClientInfo } from "./pdf-sections/client-info.ts";
import { addInvoiceItemsTable } from "./pdf-sections/items-table.ts";
import { addInvoiceSummary } from "./pdf-sections/summary.ts";
import { addInvoiceFooter } from "./pdf-sections/footer.ts";

/**
 * Generates a PDF for the given invoice
 */
export async function generatePDF(invoice: Invoice): Promise<ArrayBuffer> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Add title
  doc.setFontSize(20);
  doc.text("McKaynine Training Centre", pageWidth / 2, 20, { align: 'center' });
  
  // Add "PAID" stamp for paid invoices
  if (invoice.status === 'paid') {
    addPaidStamp(doc, pageWidth);
  }
  
  const startY = 40;
  
  // Add invoice header
  const headerEndY = addInvoiceHeader(doc, invoice, startY, pageWidth);
  
  // Add client info
  const clientInfoEndY = addClientInfo(doc, invoice, headerEndY);
  
  // Add invoice items table
  const tableEndY = addInvoiceItemsTable(doc, invoice, clientInfoEndY);
  
  // Add invoice summary
  addInvoiceSummary(doc, invoice, tableEndY, pageWidth);
  
  // Add footer
  addInvoiceFooter(doc, pageWidth, pageHeight);

  return doc.output('arraybuffer');
}
