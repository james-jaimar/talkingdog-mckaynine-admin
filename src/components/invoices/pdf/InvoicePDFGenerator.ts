
import { Invoice } from "@/hooks/invoices/types";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import { addInvoiceHeader } from "./sections/InvoiceHeader";
import { addClientInfo } from "./sections/ClientInfo";
import { addInvoiceItemsTable } from "./sections/InvoiceItems";
import { addInvoiceSummary } from "./sections/InvoiceSummary";
import { addInvoiceFooter } from "./sections/InvoiceFooter";

export async function generateInvoicePDF(invoice: Invoice, returnBase64: boolean = false): Promise<string | void> {
  console.log("Starting PDF generation...");
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Use the new McKaynine logo with paws
  const logoPath = "/lovable-uploads/16e080f8-98b8-46b6-91cd-19a0d0157348.png";
  
  try {
    // Add logo with specific dimensions for better visibility
    const imgWidth = 170;
    const imgHeight = 55;
    const xPosition = (pageWidth - imgWidth) / 2;
    doc.addImage(logoPath, "PNG", xPosition, 10, imgWidth, imgHeight);
    
    // Add company details centered below logo
    let startY = 70;
    doc.setFontSize(10);
    doc.text("McKaynine Training Centre", pageWidth / 2, startY, { align: 'center' });
    doc.text("Delta Park Branch", pageWidth / 2, startY + 6, { align: 'center' });
    doc.text("Camp Delta (SA Boyscouts), Delta Park Main Entrance,", pageWidth / 2, startY + 12, { align: 'center' });
    doc.text("Craighall Road, Delta Park", pageWidth / 2, startY + 18, { align: 'center' });
    doc.text("Tel: 082 560-5100", pageWidth / 2, startY + 24, { align: 'center' });
    doc.text("www.mckaynine.co.za", pageWidth / 2, startY + 30, { align: 'center' });

    startY += 40;

    // Add invoice header
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
      doc.text(splitNotes, 14, currentY + 7);
      currentY += (splitNotes.length * 5) + 20;
    }

    // Add footer
    addInvoiceFooter(doc, invoice, currentY, pageWidth, doc.internal.pageSize.height);
    
    if (returnBase64) {
      return doc.output('datauristring').split(',')[1];
    } else {
      doc.save(`Invoice-${invoice.invoice_number}.pdf`);
    }
    
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}
