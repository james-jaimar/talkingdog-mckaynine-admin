import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { addEmbeddedFonts, setFont } from "@/components/invoices/pdf/utils/embeddedFonts";

interface ClassDetail {
  className: string;
  classDate: string;
  bookingsCount: number;
  commissionAmount: number;
  paymentStatus: "paid" | "unpaid" | "partial";
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
  branchName?: string; // "delta" or "randburg"
}

// Logo paths for different branches
const LOGOS: Record<string, string> = {
  delta: "/lovable-uploads/mckaynine_delta_long_2025.jpg",
  randburg: "/lovable-uploads/mckaynine_randburg_long_2025.jpg", // Will need to be uploaded
};

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
  });

  // Add embedded fonts for consistent rendering
  await addEmbeddedFonts(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 15;

  // Add branch logo
  const logoPath = LOGOS[branchName.toLowerCase()] || LOGOS.delta;
  const logoBase64 = await loadImageAsBase64(logoPath);
  
  if (logoBase64) {
    try {
      const logoWidth = 70;
      const logoHeight = 20;
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(logoBase64, "JPEG", logoX, yPos, logoWidth, logoHeight);
      yPos += logoHeight + 10;
    } catch (error) {
      console.error("Error adding logo:", error);
      // Continue without logo
      yPos += 5;
    }
  } else {
    // Fallback to text header
    setFont(doc, "bold");
    doc.setFontSize(16);
    doc.setTextColor(31, 41, 55);
    const branchDisplay = branchName.charAt(0).toUpperCase() + branchName.slice(1);
    doc.text(`McKaynine ${branchDisplay}`, pageWidth / 2, yPos + 5, { align: "center" });
    yPos += 15;
  }

  // Header box
  doc.setFillColor(31, 41, 55); // gray-800
  doc.rect(0, yPos, pageWidth, 35, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  setFont(doc, "bold");
  doc.text("TRAINER PAYMENT STATEMENT", margin, yPos + 15);

  doc.setFontSize(11);
  setFont(doc, "normal");
  doc.text(termInfo, margin, yPos + 25);
  doc.text(`Generated: ${format(generatedDate, "dd MMMM yyyy")}`, pageWidth - margin, yPos + 25, { align: "right" });

  yPos += 45;

  // Date range section
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  setFont(doc, "normal");
  doc.text(`Statement Period: ${format(dateRange.from, "dd MMM yyyy")} - ${format(dateRange.to, "dd MMM yyyy")}`, margin, yPos);
  yPos += 12;

  // Trainer Info Section
  doc.setFillColor(249, 250, 251); // gray-50
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 25, 3, 3, "F");

  doc.setTextColor(31, 41, 55);
  doc.setFontSize(12);
  setFont(doc, "bold");
  doc.text("Trainer Details", margin + 5, yPos + 8);

  setFont(doc, "normal");
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.text(`Name: ${trainerName}`, margin + 5, yPos + 16);
  doc.text(`Email: ${trainerEmail}`, margin + 5, yPos + 22);

  yPos += 35;

  // Summary Section
  doc.setFillColor(239, 246, 255); // blue-50
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 35, 3, 3, "F");

  doc.setTextColor(31, 41, 55);
  doc.setFontSize(12);
  setFont(doc, "bold");
  doc.text("Payment Summary", margin + 5, yPos + 8);

  const summaryCol1 = margin + 5;
  const summaryCol2 = margin + 60;
  const summaryCol3 = margin + 115;

  doc.setFontSize(10);
  setFont(doc, "normal");
  doc.setTextColor(75, 85, 99);

  // Total Commission
  doc.text("Total Commission:", summaryCol1, yPos + 18);
  setFont(doc, "bold");
  doc.setTextColor(31, 41, 55);
  doc.text(`R ${totalCommission.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`, summaryCol1, yPos + 25);

  // Already Paid
  setFont(doc, "normal");
  doc.setTextColor(75, 85, 99);
  doc.text("Already Paid:", summaryCol2, yPos + 18);
  setFont(doc, "bold");
  doc.setTextColor(22, 163, 74); // green-600
  doc.text(`R ${totalPaid.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`, summaryCol2, yPos + 25);

  // Outstanding
  setFont(doc, "normal");
  doc.setTextColor(75, 85, 99);
  doc.text("Outstanding:", summaryCol3, yPos + 18);
  setFont(doc, "bold");
  doc.setTextColor(outstanding > 0 ? 220 : 31, outstanding > 0 ? 38 : 41, outstanding > 0 ? 38 : 55);
  doc.text(`R ${outstanding.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`, summaryCol3, yPos + 25);

  yPos += 45;

  // Classes Table
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(12);
  setFont(doc, "bold");
  doc.text("Classes Breakdown", margin, yPos);
  yPos += 5;

  const tableData = classes.map((cls) => [
    cls.className,
    cls.classDate,
    cls.bookingsCount.toString(),
    `R ${cls.commissionAmount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`,
    cls.paymentStatus === "paid" ? "Paid" : cls.paymentStatus === "partial" ? "Partial" : "Unpaid",
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Class Name", "Date", "Bookings", "Commission", "Status"]],
    body: tableData,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [31, 41, 55],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      font: "Roboto",
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [55, 65, 81],
      font: "Roboto",
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 30 },
      2: { cellWidth: 25, halign: "center" },
      3: { cellWidth: 35, halign: "right" },
      4: { cellWidth: 25, halign: "center" },
    },
    didParseCell: (data) => {
      // Color the status column
      if (data.section === "body" && data.column.index === 4) {
        const status = data.cell.raw as string;
        if (status === "Paid") {
          data.cell.styles.textColor = [22, 163, 74]; // green
        } else if (status === "Unpaid") {
          data.cell.styles.textColor = [220, 38, 38]; // red
        } else {
          data.cell.styles.textColor = [234, 179, 8]; // yellow
        }
      }
    },
  });

  // Get final Y position after table
  const finalY = (doc as any).lastAutoTable.finalY || yPos + 50;

  // Total row
  doc.setFillColor(31, 41, 55);
  doc.rect(margin, finalY + 2, pageWidth - margin * 2, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  setFont(doc, "bold");
  doc.text("TOTAL", margin + 5, finalY + 8);
  doc.text(
    `R ${totalCommission.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`,
    pageWidth - margin - 30,
    finalY + 8,
    { align: "right" }
  );

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(8);
  setFont(doc, "normal");
  doc.text(
    "This is an automatically generated statement. Please contact the administrator for any queries.",
    pageWidth / 2,
    footerY,
    { align: "center" }
  );
  const branchDisplay = branchName.charAt(0).toUpperCase() + branchName.slice(1);
  doc.text(`McKaynine ${branchDisplay} Training Centre`, pageWidth / 2, footerY + 5, { align: "center" });

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
