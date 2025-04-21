
import { Invoice } from "@/hooks/invoices/types";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import { addLogoToPdf } from "./utils/pdfHelpers";
import { addInvoiceHeader } from "./sections/InvoiceHeader";
import { addClientInfo } from "./sections/ClientInfo";
import { addInvoiceItemsTable } from "./sections/InvoiceItems";
import { addInvoiceSummary } from "./sections/InvoiceSummary";
import { addInvoiceFooter } from "./sections/InvoiceFooter";

export async function generateInvoicePDF(invoice: Invoice, returnBase64: boolean = false): Promise<string | void> {
  console.log("Starting PDF generation...");
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Add McKaynine logo and header text
  const logoAdded = await addLogoToPdf(doc, pageWidth);
  let startY = logoAdded ? 50 : 30;

  // Add company details
  doc.setFontSize(10);
  doc.text("McKaynine Training Centre", pageWidth / 2, startY, { align: 'center' });
  doc.text("Delta Park Branch", pageWidth / 2, startY + 5, { align: 'center' });
  doc.text("Camp Delta (SA Boyscouts), Delta Park Main Entrance, Craighall Road, Delta Park", pageWidth / 2, startY + 10, { align: 'center' });
  doc.text("Tel: 082 560-5100", pageWidth / 2, startY + 15, { align: 'center' });
  doc.text("www.mckaynine.co.za", pageWidth / 2, startY + 20, { align: 'center' });

  startY += 35;

  // Add invoice header (invoice number, dates, status)
  const headerEndY = addInvoiceHeader(doc, invoice, startY, pageWidth);
  
  // Add client information
  const clientInfoEndY = addClientInfo(doc, invoice, headerEndY + 10);
  
  // Add invoice items table
  const tableEndY = addInvoiceItemsTable(doc, invoice, clientInfoEndY + 10);
  
  // Add invoice summary
  const summaryEndY = addInvoiceSummary(doc, invoice, tableEndY + 10);
  
  // Add notes if present
  let currentY = summaryEndY + 20;
  if (invoice.notes) {
    doc.setFontSize(11);
    doc.text("Notes:", 14, currentY);
    doc.setFontSize(10);
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 28);
    splitNotes.forEach((line: string, index: number) => {
      doc.text(line, 14, currentY + 7 + (index * 5));
    });
    currentY += (splitNotes.length * 5) + 20;
  }

  // Add footer
  addInvoiceFooter(doc, invoice, currentY, pageWidth, pageHeight);
  
  if (returnBase64) {
    return doc.output('datauristring').split(',')[1];
  } else {
    doc.save(`Invoice-${invoice.invoice_number}.pdf`);
  }
}
