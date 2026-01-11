import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { addEmbeddedFonts, setFont } from "@/components/invoices/pdf/utils/embeddedFonts";
import { getBranchLogo } from "@/lib/branchLogo";

interface HandlerDetail {
  handlerName: string;
  handlerEmail?: string;
  dogName?: string;
  dogBreed?: string;
  courseFee?: number;
  commissionAmount: number;
  paymentStatus?: string;
}

interface ClassDetail {
  className: string;
  classDate: string;
  bookingsCount: number;
  commissionAmount: number;
  paymentStatus: "paid" | "unpaid" | "partial";
  handlers?: HandlerDetail[];
}

interface TrainerStatementPDFProps {
  trainerName: string;
  trainerEmail: string;
  termInfo: string;
  dateRange: { from: Date; to: Date };
  totalCommission: number;
  totalPaid: number;
  outstanding: number;
  classes: ClassDetail[];
  generatedDate?: Date;
  branchName?: string;
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateTrainerStatementPDF({
  trainerName,
  trainerEmail,
  termInfo,
  dateRange,
  totalCommission,
  totalPaid,
  outstanding,
  classes,
  generatedDate = new Date(),
  branchName = "delta",
}: TrainerStatementPDFProps): Promise<string> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
    putOnlyUsedFonts: true,
  });

  const fontsEmbedded = await addEmbeddedFonts(doc);
  const fontName = fontsEmbedded ? "Roboto" : "helvetica";

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = 12;

  // Helper to check if we need a new page
  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - 25) {
      doc.addPage();
      yPos = 15;
      return true;
    }
    return false;
  };

  // Add branch logo
  const logoPath = getBranchLogo(branchName, 'jpg');
  const logoBase64 = await loadImageAsBase64(logoPath);
  
  if (logoBase64) {
    try {
      const logoWidth = 60;
      const logoHeight = 17;
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(logoBase64, "JPEG", logoX, yPos, logoWidth, logoHeight);
      yPos += logoHeight + 8;
    } catch (error) {
      console.error("Error adding logo:", error);
      yPos += 5;
    }
  } else {
    setFont(doc, "bold");
    doc.setFontSize(14);
    doc.setTextColor(31, 41, 55);
    const branchDisplay = branchName.charAt(0).toUpperCase() + branchName.slice(1);
    doc.text(`McKaynine ${branchDisplay}`, pageWidth / 2, yPos + 5, { align: "center" });
    yPos += 12;
  }

  // Header box
  doc.setFillColor(31, 41, 55);
  doc.rect(0, yPos, pageWidth, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  setFont(doc, "bold");
  doc.text("TRAINER PAYMENT STATEMENT", margin, yPos + 12);

  doc.setFontSize(10);
  setFont(doc, "normal");
  doc.text(termInfo, margin, yPos + 20);
  doc.text(`Generated: ${format(generatedDate, "dd MMMM yyyy")}`, pageWidth - margin, yPos + 20, { align: "right" });

  yPos += 35;

  // Date range
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  setFont(doc, "normal");
  doc.text(`Statement Period: ${format(dateRange.from, "dd MMM yyyy")} - ${format(dateRange.to, "dd MMM yyyy")}`, margin, yPos);
  yPos += 10;

  // Trainer Info Section
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 18, 2, 2, "F");

  doc.setTextColor(31, 41, 55);
  doc.setFontSize(10);
  setFont(doc, "bold");
  doc.text("Trainer Details", margin + 4, yPos + 6);

  setFont(doc, "normal");
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text(`Name: ${trainerName}`, margin + 4, yPos + 12);
  doc.text(`Email: ${trainerEmail}`, margin + 70, yPos + 12);

  yPos += 25;

  // Summary Section
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 22, 2, 2, "F");

  doc.setTextColor(31, 41, 55);
  doc.setFontSize(10);
  setFont(doc, "bold");
  doc.text("Payment Summary", margin + 4, yPos + 6);

  const summaryCol1 = margin + 4;
  const summaryCol2 = margin + 55;
  const summaryCol3 = margin + 110;

  doc.setFontSize(9);
  setFont(doc, "normal");
  doc.setTextColor(75, 85, 99);

  doc.text("Total Commission:", summaryCol1, yPos + 13);
  setFont(doc, "bold");
  doc.setTextColor(31, 41, 55);
  doc.text(`R ${totalCommission.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`, summaryCol1, yPos + 18);

  setFont(doc, "normal");
  doc.setTextColor(75, 85, 99);
  doc.text("Already Paid:", summaryCol2, yPos + 13);
  setFont(doc, "bold");
  doc.setTextColor(22, 163, 74);
  doc.text(`R ${totalPaid.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`, summaryCol2, yPos + 18);

  setFont(doc, "normal");
  doc.setTextColor(75, 85, 99);
  doc.text("Outstanding:", summaryCol3, yPos + 13);
  setFont(doc, "bold");
  doc.setTextColor(outstanding > 0 ? 220 : 31, outstanding > 0 ? 38 : 41, outstanding > 0 ? 38 : 55);
  doc.text(`R ${outstanding.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`, summaryCol3, yPos + 18);

  yPos += 30;

  // Class Details Header
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(11);
  setFont(doc, "bold");
  doc.text("Class Details", margin, yPos);
  yPos += 6;

  // Process each class
  for (const classSchedule of classes) {
    const handlers = classSchedule.handlers || [];
    const handlerCount = handlers.length || classSchedule.bookingsCount;
    const classTotal = handlers.reduce((sum, h) => sum + (h.commissionAmount || 0), 0) || classSchedule.commissionAmount;
    const hasUnpaid = classSchedule.paymentStatus !== "paid";
    
    // Calculate required space for this class
    const classHeaderHeight = 12;
    const tableRowHeight = 6;
    const tableHeaderHeight = 7;
    const totalRowHeight = 7;
    const requiredHeight = classHeaderHeight + tableHeaderHeight + (handlers.length * tableRowHeight) + totalRowHeight + 8;
    
    checkPageBreak(requiredHeight);

    // Class header bar
    doc.setFillColor(31, 78, 80); // primary color
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 10, 1, 1, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    setFont(doc, "bold");
    doc.text(`${classSchedule.className}`, margin + 3, yPos + 6.5);
    
    setFont(doc, "normal");
    doc.setFontSize(8);
    const classNameWidth = doc.getTextWidth(classSchedule.className);
    doc.text(`${classSchedule.classDate} • ${handlerCount} handler${handlerCount !== 1 ? 's' : ''}`, margin + 3 + classNameWidth + 5, yPos + 6.5);

    // Class total on right
    doc.setFontSize(9);
    setFont(doc, "bold");
    doc.text(`R ${classTotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`, pageWidth - margin - 25, yPos + 6.5, { align: "right" });

    // Status badge
    const statusText = hasUnpaid ? "Unpaid" : "Paid";
    const badgeX = pageWidth - margin - 3;
    doc.setFillColor(hasUnpaid ? 254 : 220, hasUnpaid ? 226 : 252, hasUnpaid ? 226 : 231);
    doc.roundedRect(badgeX - 12, yPos + 2, 12, 6, 1, 1, "F");
    doc.setTextColor(hasUnpaid ? 185 : 22, hasUnpaid ? 28 : 101, hasUnpaid ? 28 : 52);
    doc.setFontSize(6);
    doc.text(statusText, badgeX - 6, yPos + 6, { align: "center" });

    yPos += 12;

    if (handlers.length > 0) {
      // Handler table for this class
      const handlerData = handlers.map((handler) => [
        handler.handlerName,
        `${handler.dogName || 'Unknown'}${handler.dogBreed ? ` (${handler.dogBreed})` : ''}`,
        handler.handlerEmail || '-',
        `R ${(handler.courseFee || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`,
        `R ${(handler.commissionAmount || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Handler", "Dog", "Email", "Course Fee", "Commission"]],
        body: handlerData,
        margin: { left: margin, right: margin },
        styles: {
          font: fontName,
          fontSize: 8,
          textColor: [55, 65, 81],
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [243, 244, 246],
          textColor: [107, 114, 128],
          fontStyle: "bold",
          fontSize: 7,
        },
        bodyStyles: {
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255],
        },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 40 },
          2: { cellWidth: 55 },
          3: { cellWidth: 25, halign: "right" },
          4: { cellWidth: 25, halign: "right" },
        },
        didParseCell: (data) => {
          data.cell.styles.font = fontName;
          // Color commission column green
          if (data.section === "body" && data.column.index === 4) {
            data.cell.styles.textColor = [22, 163, 74];
            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      yPos = (doc as any).lastAutoTable.finalY;

      // Class totals row
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, yPos, pageWidth - margin * 2, 7, "F");
      
      doc.setFontSize(8);
      setFont(doc, "bold");
      doc.setTextColor(75, 85, 99);
      doc.text("Class Totals", margin + 3, yPos + 5);
      
      const courseFeeTotal = handlers.reduce((sum, h) => sum + (h.courseFee || 0), 0);
      doc.text(`R ${courseFeeTotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`, pageWidth - margin - 28, yPos + 5, { align: "right" });
      
      doc.setTextColor(22, 163, 74);
      doc.text(`R ${classTotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`, pageWidth - margin - 3, yPos + 5, { align: "right" });

      yPos += 12;
    } else {
      yPos += 5;
    }
  }

  // Grand Total
  checkPageBreak(20);
  yPos += 3;
  
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 12, 2, 2, "F");
  
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(11);
  setFont(doc, "bold");
  doc.text("Grand Total Commission", margin + 5, yPos + 8);
  
  doc.setTextColor(22, 163, 74);
  doc.setFontSize(14);
  doc.text(`R ${totalCommission.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`, pageWidth - margin - 5, yPos + 8, { align: "right" });

  // Footer on last page
  const footerY = pageHeight - 15;
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(7);
  setFont(doc, "normal");
  doc.text(
    "This is an automatically generated statement. Please contact the administrator for any queries.",
    pageWidth / 2,
    footerY,
    { align: "center" }
  );
  const branchDisplay = branchName.charAt(0).toUpperCase() + branchName.slice(1);
  doc.text(`McKaynine ${branchDisplay} Training Centre`, pageWidth / 2, footerY + 4, { align: "center" });

  return doc.output("dataurlstring");
}

export function downloadTrainerStatementPDF(dataUrl: string, trainerName: string, termInfo: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `Statement_${trainerName.replace(/\s+/g, "_")}_${termInfo.replace(/\s+/g, "_")}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
