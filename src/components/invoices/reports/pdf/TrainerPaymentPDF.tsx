
import { jsPDF } from "jspdf";
import { TrainerClassDetail } from "@/hooks/trainer-payments/types";
import { PaymentDetailsValues } from "../payment-dialog/PaymentDetailsForm";
import { formatCurrency } from "@/lib/formatters";
import autoTable from "jspdf-autotable";
import { addLogoToPdf } from "../../../invoices/pdf/utils/pdfHelpers";

interface TrainerPaymentPDFProps {
  trainerName: string;
  trainerEmail: string;
  classes: TrainerClassDetail[];
  paymentDetails: PaymentDetailsValues;
  paymentDate: string;
}

export async function generateTrainerPaymentPDF({
  trainerName,
  trainerEmail,
  classes,
  paymentDetails,
  paymentDate
}: TrainerPaymentPDFProps): Promise<string> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const totalAmount = classes.reduce((sum, c) => sum + c.potentialRevenue, 0);
  
  // Add McKaynine logo using the shared helper function
  addLogoToPdf(doc, pageWidth);
  
  // Add payment details section
  let currentY = 45; // Start after logo
  
  doc.setFontSize(20);
  doc.setTextColor(41, 128, 185);
  doc.setFont(undefined, 'bold');
  doc.text("Trainer Payment Confirmation", 14, currentY);
  doc.setFont(undefined, 'normal');
  currentY += 10;
  
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  
  // Format date for better readability
  const formattedDate = new Date(paymentDate).toLocaleDateString('en-ZA', {
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });
  
  doc.text(`Payment Date: ${formattedDate}`, 14, currentY);
  currentY += 10;
  
  // Unique Reference Number
  if (paymentDetails.transactionId) {
    doc.text(`Reference: ${paymentDetails.transactionId}`, 14, currentY);
    currentY += 6;
  }
  
  // Trainer info section with light gray background
  currentY += 5;
  doc.setFillColor(245, 245, 245);
  doc.rect(14, currentY, pageWidth - 28, 30, 'F');
  
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.setFont(undefined, 'bold');
  doc.text("Trainer Information", 18, currentY + 8);
  doc.setFont(undefined, 'normal');
  
  doc.text(`Name: ${trainerName}`, 18, currentY + 16);
  doc.text(`Email: ${trainerEmail}`, 18, currentY + 24);
  
  currentY += 35;
  
  // Payment details section with light blue background
  doc.setFillColor(240, 248, 255);
  doc.rect(14, currentY, pageWidth - 28, 34, 'F');
  
  doc.setFontSize(12);
  doc.setTextColor(41, 128, 185);
  doc.setFont(undefined, 'bold');
  doc.text("Payment Details", 18, currentY + 8);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(60, 60, 60);
  
  doc.text(`Method: ${formatPaymentMethod(paymentDetails.paymentMethod)}`, 18, currentY + 16);
  doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, 18, currentY + 24);
  
  currentY += 40;
  
  // Add notes if provided
  if (paymentDetails.paymentNotes) {
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text("Notes:", 14, currentY);
    currentY += 6;
    
    const splitNotes = doc.splitTextToSize(paymentDetails.paymentNotes, pageWidth - 28);
    doc.text(splitNotes, 14, currentY);
    currentY += splitNotes.length * 6 + 10;
  } else {
    currentY += 10;
  }
  
  // Table of classes
  doc.setFontSize(12);
  doc.setTextColor(41, 128, 185);
  doc.setFont(undefined, 'bold');
  doc.text("Classes Included in Payment", 14, currentY);
  doc.setFont(undefined, 'normal');
  currentY += 8;
  
  // Prepare data for the table
  const tableData = classes.map(cls => [
    cls.className,
    new Date(cls.classDate).toLocaleDateString('en-ZA'),
    cls.bookings.toString(),
    formatCurrency(cls.potentialRevenue)
  ]);
  
  // Add table
  autoTable(doc, {
    startY: currentY,
    head: [['Class Name', 'Date', 'Bookings', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: { 
      fillColor: [41, 128, 185],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 40 },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 40, halign: 'right' }
    },
    styles: {
      fontSize: 10
    },
    alternateRowStyles: {
      fillColor: [245, 250, 255]
    }
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 15;
  
  // Summary section
  doc.setFontSize(12);
  doc.setTextColor(41, 128, 185);
  doc.setFont(undefined, 'bold');
  doc.text("Payment Summary", 14, currentY);
  currentY += 8;
  
  doc.setTextColor(60, 60, 60);
  doc.setFont(undefined, 'normal');
  doc.text(`Total Classes: ${classes.length}`, 14, currentY);
  currentY += 6;
  
  const totalBookings = classes.reduce((sum, c) => sum + c.bookings, 0);
  doc.text(`Total Bookings: ${totalBookings}`, 14, currentY);
  currentY += 6;
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, 14, currentY);
  currentY += 15;
  
  // Footer with McKaynine info
  doc.setFillColor(41, 128, 185, 0.1);
  doc.rect(0, doc.internal.pageSize.height - 25, pageWidth, 25, 'F');
  
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text("This is an automatically generated payment confirmation.", 14, doc.internal.pageSize.height - 15);
  doc.text("McKaynine Training Centre", 14, doc.internal.pageSize.height - 10);
  
  // Return as a data URL
  return doc.output('datauristring');
}

// Helper function to format payment method names
function formatPaymentMethod(method: string): string {
  const methodMap: Record<string, string> = {
    'bank_transfer': 'Bank Transfer',
    'cash': 'Cash',
    'check': 'Check',
    'other': 'Other'
  };
  
  return methodMap[method] || method;
}
