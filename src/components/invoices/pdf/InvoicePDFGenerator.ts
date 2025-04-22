
import { jsPDF } from "jspdf";
import { Invoice } from "@/hooks/invoices/types";
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

  // Add the new McKaynine logo with correct aspect ratio
  const logoPath = "/lovable-uploads/6ae95232-1c8d-4ab8-8413-5f228888fe0c.png";
  
  try {
    // Calculate logo dimensions to maintain aspect ratio
    const originalWidth = 1920;  // Original image width
    const originalHeight = 249;  // Original image height
    const aspectRatio = originalWidth / originalHeight;
    
    // Set logo width to 180 (page width is 210 for A4)
    const imgWidth = 180;
    const imgHeight = imgWidth / aspectRatio;
    
    // Center the logo horizontally
    const xPosition = (pageWidth - imgWidth) / 2;
    doc.addImage(logoPath, "PNG", xPosition, 15, imgWidth, imgHeight);

    // Company details below logo
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    const startY = imgHeight + 25; // Start text below logo
    
    // Company details on 4 lines as specified
    doc.text("McKaynine Training Centre", pageWidth / 2, startY, { align: 'center' });
    doc.text("Delta Park Branch", pageWidth / 2, startY + 5, { align: 'center' });
    doc.text("Camp Delta (SA Boyscouts), Delta Park Main Entrance, Craighall Road, Delta Park. Tel: 082 560-5100", 
             pageWidth / 2, startY + 10, { align: 'center' });
    doc.text("www.mckaynine.co.za", pageWidth / 2, startY + 15, { align: 'center' });

    // Add invoice sections
    const headerEndY = addInvoiceHeader(doc, invoice, startY + 25, pageWidth);
    const clientInfoEndY = addClientInfo(doc, invoice, headerEndY + 10);
    const tableEndY = addInvoiceItemsTable(doc, invoice, clientInfoEndY + 10);
    const summaryEndY = addInvoiceSummary(doc, invoice, tableEndY);
    
    // Add footer with banking details
    addInvoiceFooter(doc, invoice, summaryEndY + 15, pageWidth, pageHeight);

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
