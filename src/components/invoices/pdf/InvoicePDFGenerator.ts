
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
  
  // Use the McKaynine logo with paws
  const logoPath = "/lovable-uploads/16e080f8-98b8-46b6-91cd-19a0d0157348.png";
  
  try {
    // Calculate logo dimensions to fit 60% of page width while maintaining aspect ratio
    const maxWidth = pageWidth * 0.6; // 60% of page width
    const aspectRatio = 1040 / 337; // Original image aspect ratio
    const imgWidth = maxWidth;
    const imgHeight = maxWidth / aspectRatio;
    
    // Center the logo horizontally
    const xPosition = (pageWidth - imgWidth) / 2;
    doc.addImage(logoPath, "PNG", xPosition, 15, imgWidth, imgHeight);
    
    // Add company details with correct 4-line layout
    let startY = imgHeight + 20; // Start text below logo with padding
    
    doc.setFontSize(10);
    doc.text("McKaynine Training Centre", pageWidth / 2, startY, { align: 'center' });
    doc.text("Delta Park Branch", pageWidth / 2, startY + 5, { align: 'center' });
    doc.text("Camp Delta (SA Boyscouts), Delta Park Main Entrance, Craighall Road, Delta Park. Tel: 082 560-5100", 
             pageWidth / 2, startY + 10, { align: 'center' });
    doc.text("www.mckaynine.co.za", pageWidth / 2, startY + 15, { align: 'center' });
    
    // Adjust the starting position for invoice content
    startY += 25;

    // Add invoice header
    const headerEndY = addInvoiceHeader(doc, invoice, startY, pageWidth);
    
    // Add client information
    const clientInfoEndY = addClientInfo(doc, invoice, headerEndY + 10);
    
    // Add invoice items table
    const tableEndY = addInvoiceItemsTable(doc, invoice, clientInfoEndY + 10);
    
    // Add invoice summary
    const summaryEndY = addInvoiceSummary(doc, invoice, tableEndY + 10);
    
    // Add footer with banking details
    addInvoiceFooter(doc, invoice, summaryEndY + 15, pageWidth, doc.internal.pageSize.height);
    
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
