
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

  // Add McKaynine logo at original size
  const logoPath = "/lovable-uploads/6ae95232-1c8d-4ab8-8413-5f228888fe0c.png";
  
  try {
    // Use actual image dimensions
    const imgWidth = 1920;  // Original image width
    const imgHeight = 249;  // Original image height
    
    // Scale to fit page width while maintaining aspect ratio
    const scaleFactor = pageWidth / imgWidth;
    const finalWidth = imgWidth * scaleFactor;
    const finalHeight = imgHeight * scaleFactor;
    
    // Center the logo horizontally
    const xPosition = (pageWidth - finalWidth) / 2;
    doc.addImage(logoPath, "PNG", xPosition, 15, finalWidth, finalHeight);

    // Company details below logo with adjusted spacing
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    const startY = finalHeight + 20; // Adjusted spacing after scaled logo
    
    // Company details centered
    doc.text("McKaynine Training Centre", pageWidth / 2, startY, { align: 'center' });
    doc.text("Delta Park Branch", pageWidth / 2, startY + 5, { align: 'center' });
    doc.text("Camp Delta (SA Boyscouts), Delta Park Main Entrance, Craighall Road, Delta Park. Tel: 082 560-5100", 
             pageWidth / 2, startY + 10, { align: 'center' });
    doc.text("www.mckaynine.co.za", pageWidth / 2, startY + 15, { align: 'center' });

    // Add invoice sections with improved spacing
    const headerEndY = addInvoiceHeader(doc, invoice, startY + 25, pageWidth);
    const clientInfoEndY = addClientInfo(doc, invoice, headerEndY + 5);
    const tableEndY = addInvoiceItemsTable(doc, invoice, clientInfoEndY + 10);
    const summaryEndY = addInvoiceSummary(doc, invoice, tableEndY + 5);
    
    // Add footer with banking details
    addInvoiceFooter(doc, invoice, summaryEndY + 10, pageWidth, pageHeight);

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
