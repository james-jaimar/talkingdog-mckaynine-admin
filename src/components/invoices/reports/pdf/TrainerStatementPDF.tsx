import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

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
}: TrainerStatementPDFProps): Promise<string> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Header
  doc.setFillColor(31, 41, 55); // gray-800
  doc.rect(0, 0, pageWidth, 45, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("TRAINER PAYMENT STATEMENT", margin, 25);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(termInfo, margin, 35);
  doc.text(`Generated: ${format(generatedDate, "dd MMMM yyyy")}`, pageWidth - margin, 35, { align: "right" });

  yPos = 55;

  // Date range section
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  doc.text(`Statement Period: ${format(dateRange.from, "dd MMM yyyy")} - ${format(dateRange.to, "dd MMM yyyy")}`, margin, yPos);
  yPos += 12;

  // Trainer Info Section
  doc.setFillColor(249, 250, 251); // gray-50
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 25, 3, 3, "F");

  doc.setTextColor(31, 41, 55);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Trainer Details", margin + 5, yPos + 8);

  doc.setFont("helvetica", "normal");
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
  doc.setFont("helvetica", "bold");
  doc.text("Payment Summary", margin + 5, yPos + 8);

  const summaryCol1 = margin + 5;
  const summaryCol2 = margin + 60;
  const summaryCol3 = margin + 115;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(75, 85, 99);

  // Total Commission
  doc.text("Total Commission:", summaryCol1, yPos + 18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(31, 41, 55);
  doc.text(`R ${totalCommission.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`, summaryCol1, yPos + 25);

  // Already Paid
  doc.setFont("helvetica", "normal");
  doc.setTextColor(75, 85, 99);
  doc.text("Already Paid:", summaryCol2, yPos + 18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(22, 163, 74); // green-600
  doc.text(`R ${totalPaid.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`, summaryCol2, yPos + 25);

  // Outstanding
  doc.setFont("helvetica", "normal");
  doc.setTextColor(75, 85, 99);
  doc.text("Outstanding:", summaryCol3, yPos + 18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(outstanding > 0 ? 220 : 31, outstanding > 0 ? 38 : 41, outstanding > 0 ? 38 : 55); // red or gray
  doc.text(`R ${outstanding.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`, summaryCol3, yPos + 25);

  yPos += 45;

  // Classes Table
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
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
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [55, 65, 81],
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
  doc.setFont("helvetica", "bold");
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
  doc.setFont("helvetica", "normal");
  doc.text(
    "This is an automatically generated statement. Please contact the administrator for any queries.",
    pageWidth / 2,
    footerY,
    { align: "center" }
  );
  doc.text("McKaynine Training Centre", pageWidth / 2, footerY + 5, { align: "center" });

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
