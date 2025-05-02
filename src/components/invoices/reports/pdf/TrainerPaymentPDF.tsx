
import { jsPDF } from "jspdf";
import { TrainerClassDetail } from "@/hooks/trainer-payments/types";
import { PaymentDetailsFormValues } from "../payment-dialog/PaymentDetailsForm";
import { formatCurrency } from "@/lib/formatters";
import autoTable from "jspdf-autotable";

interface TrainerPaymentPDFProps {
  trainerName: string;
  trainerEmail: string;
  classes: TrainerClassDetail[];
  paymentDetails: PaymentDetailsFormValues;
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
  
  // Add McKaynine logo at original size (210mm wide)
  const logoPath = "/lovable-uploads/e55530eb-3e59-46f4-a6c6-93f2d1835712.png";
  
  try {
    // Set coordinates to place the logo at the top of the page
    const yPosition = 10; // Start 10mm from top
    doc.addImage(logoPath, "PNG", 0, yPosition, pageWidth, 25); // Height set to 25mm for proportion
  } catch (error) {
    console.error("Error adding logo to PDF:", error);
    // Continue without the logo if there's an error
  }

  // Add payment details section
  let currentY = 45; // Start after logo
  
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text("Payment Confirmation", 14, currentY);
  currentY += 10;
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Payment Date: ${new Date(paymentDate).toLocaleDateString()}`, 14, currentY);
  currentY += 10;
  
  // Trainer info
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Trainer Information", 14, currentY);
  currentY += 8;
  
  doc.setFontSize(11);
  doc.text(`Name: ${trainerName}`, 14, currentY);
  currentY += 6;
  doc.text(`Email: ${trainerEmail}`, 14, currentY);
  currentY += 10;
  
  // Payment details
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Payment Details", 14, currentY);
  currentY += 8;
  
  doc.setFontSize(11);
  doc.text(`Method: ${formatPaymentMethod(paymentDetails.paymentMethod)}`, 14, currentY);
  currentY += 6;
  
  if (paymentDetails.transactionId) {
    doc.text(`Transaction ID: ${paymentDetails.transactionId}`, 14, currentY);
    currentY += 6;
  }
  
  if (paymentDetails.paymentNotes) {
    doc.text("Notes:", 14, currentY);
    currentY += 6;
    
    const splitNotes = doc.splitTextToSize(paymentDetails.paymentNotes, pageWidth - 28);
    doc.text(splitNotes, 14, currentY);
    currentY += splitNotes.length * 6 + 4;
  }
  
  // Table of classes
  currentY += 10;
  
  // Prepare data for the table
  const tableData = classes.map(cls => [
    cls.className,
    new Date(cls.classDate).toLocaleDateString(),
    cls.bookings.toString(),
    formatCurrency(cls.potentialRevenue)
  ]);

  // Add header for classes
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Classes Included in Payment", 14, currentY);
  currentY += 10;
  
  // Add table
  autoTable(doc, {
    startY: currentY,
    head: [['Class Name', 'Date', 'Bookings', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: { 
      fillColor: [41, 128, 185],
      textColor: [255, 255, 255]
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 40 },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 40, halign: 'right' }
    },
    styles: {
      fontSize: 10
    }
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 15;
  
  // Summary section
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Payment Summary", 14, currentY);
  currentY += 8;
  
  doc.setFontSize(12);
  doc.text(`Total Classes: ${classes.length}`, 14, currentY);
  currentY += 6;
  
  const totalBookings = classes.reduce((sum, c) => sum + c.bookings, 0);
  doc.text(`Total Bookings: ${totalBookings}`, 14, currentY);
  currentY += 6;
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, 14, currentY);
  currentY += 15;
  
  // Footer
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text("This is an automatically generated payment confirmation.", 14, currentY);
  currentY += 5;
  doc.text("McKaynine Training Centre", 14, currentY);
  
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
