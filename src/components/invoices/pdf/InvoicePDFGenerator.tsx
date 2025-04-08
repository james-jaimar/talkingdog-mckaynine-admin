
import { jsPDF } from "jspdf";
import { Invoice } from "@/hooks/invoices/types";
import { addPaidStamp, addLogoToPdf } from "./utils/pdfHelpers";
import { addInvoiceHeader } from "./sections/InvoiceHeader";
import { addClientInfo } from "./sections/ClientInfo";
import { addInvoiceItemsTable } from "./sections/InvoiceItems";
import { addInvoiceSummary } from "./sections/InvoiceSummary";
import { addInvoiceFooter } from "./sections/InvoiceFooter";
import { splitTextToFitPage } from "./utils/formatters";

export const generateInvoicePDF = async (invoice: Invoice) => {
  // Create a new PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Add McKaynine logo
  const logoAdded = addLogoToPdf(doc, pageWidth);
  
  // Add "PAID" stamp for paid invoices
  if (invoice.status === 'paid') {
    addPaidStamp(doc, pageWidth);
  }
  
  // Set the starting Y position based on whether the logo was added
  const startY = logoAdded ? 65 : 40;
  
  // Add invoice header (invoice number, status, dates)
  const headerEndY = addInvoiceHeader(doc, invoice, startY, pageWidth);
  
  // Add client information
  const clientInfoEndY = addClientInfo(doc, invoice, headerEndY);
  
  // Add invoice items table
  const tableEndY = addInvoiceItemsTable(doc, invoice, clientInfoEndY);
  
  // Add invoice summary (subtotal, tax, total)
  const summaryEndY = addInvoiceSummary(doc, invoice, tableEndY, pageWidth);
  
  // Add footer (notes, banking details, thank you message)
  addInvoiceFooter(doc, invoice, summaryEndY, pageWidth, pageHeight);

  // Save the PDF with a filename based on the invoice number
  doc.save(`invoice-${invoice.invoice_number}.pdf`);
  
  return doc;
};

// Export the helper function for use in other components
export { splitTextToFitPage };
