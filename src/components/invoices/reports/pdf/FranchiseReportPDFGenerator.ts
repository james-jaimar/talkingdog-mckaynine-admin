
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { FranchiseReportData } from '@/hooks/useFranchiseClassesData';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
  }
}

export class FranchiseReportPDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  private formatCurrency(amount: number): string {
    return `R ${amount.toFixed(2)}`;
  }

  private addHeader(termLabel: string) {
    // Company header with better styling
    this.doc.setFillColor(249, 250, 251); // Light gray background
    this.doc.rect(0, 0, this.pageWidth, 65, 'F');
    
    // Company name
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(31, 41, 55); // Dark gray
    this.doc.text('McKaynine Training Centre', this.margin, 25);

    // Report title
    this.doc.setFontSize(18);
    this.doc.setTextColor(59, 130, 246); // Blue
    this.doc.text('Franchise Classes Report', this.margin, 38);

    // Term and date info
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(75, 85, 99); // Gray
    this.doc.text(`Term: ${termLabel}`, this.margin, 50);
    this.doc.text(`Generated: ${new Date().toLocaleDateString('en-ZA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, this.margin, 58);

    // Add a subtle border line
    this.doc.setDrawColor(229, 231, 235);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, 65, this.pageWidth - this.margin, 65);
  }

  private addSummaryCards(reportTotals: any, startY: number): number {
    const cardWidth = (this.pageWidth - 55) / 4;
    const cardHeight = 32;
    let currentY = startY + 15;

    const cards = [
      { 
        title: 'Total Revenue', 
        value: this.formatCurrency(reportTotals.totalRevenue), 
        bgColor: [59, 130, 246], // Blue
        lightBg: [239, 246, 255]
      },
      { 
        title: 'Franchise Fees', 
        value: this.formatCurrency(reportTotals.totalFranchiseFees), 
        bgColor: [34, 197, 94], // Green
        lightBg: [240, 253, 244]
      },
      { 
        title: 'Admin Fees', 
        value: this.formatCurrency(reportTotals.totalAdminFees), 
        bgColor: [249, 115, 22], // Orange
        lightBg: [255, 247, 237]
      },
      { 
        title: 'McKaynine Commission', 
        value: this.formatCurrency(reportTotals.totalMckaynineCommission), 
        bgColor: [168, 85, 247], // Purple
        lightBg: [250, 245, 255]
      }
    ];

    cards.forEach((card, index) => {
      const x = this.margin + (index * (cardWidth + 2.5));
      
      // Card shadow effect
      this.doc.setFillColor(0, 0, 0, 0.1);
      this.doc.roundedRect(x + 1, currentY + 1, cardWidth, cardHeight, 3, 3, 'F');
      
      // Card background - light color
      this.doc.setFillColor(card.lightBg[0], card.lightBg[1], card.lightBg[2]);
      this.doc.roundedRect(x, currentY, cardWidth, cardHeight, 3, 3, 'F');
      
      // Card border
      this.doc.setDrawColor(card.bgColor[0], card.bgColor[1], card.bgColor[2]);
      this.doc.setLineWidth(0.8);
      this.doc.roundedRect(x, currentY, cardWidth, cardHeight, 3, 3, 'S');
      
      // Title
      this.doc.setTextColor(card.bgColor[0], card.bgColor[1], card.bgColor[2]);
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(card.title, x + 4, currentY + 8);
      
      // Value
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(card.value, x + 4, currentY + 20);
      
      // Small accent line
      this.doc.setFillColor(card.bgColor[0], card.bgColor[1], card.bgColor[2]);
      this.doc.rect(x + 4, currentY + 24, cardWidth - 8, 1, 'F');
    });

    this.doc.setTextColor(0, 0, 0); // Reset text color
    return currentY + cardHeight + 20;
  }

  private addClassSection(classGroup: any, startY: number): number {
    let currentY = startY + 10;

    // Check if we need a new page
    if (currentY > this.pageHeight - 80) {
      this.doc.addPage();
      currentY = 30;
    }

    // Class header with enhanced styling
    const headerHeight = 28;
    
    // Header shadow
    this.doc.setFillColor(0, 0, 0, 0.05);
    this.doc.roundedRect(this.margin + 1, currentY - 3, this.pageWidth - 42, headerHeight, 4, 4, 'F');
    
    // Header background - blue gradient effect
    this.doc.setFillColor(239, 246, 255);
    this.doc.roundedRect(this.margin, currentY - 4, this.pageWidth - 40, headerHeight, 4, 4, 'F');
    
    // Header border
    this.doc.setDrawColor(59, 130, 246);
    this.doc.setLineWidth(1);
    this.doc.roundedRect(this.margin, currentY - 4, this.pageWidth - 40, headerHeight, 4, 4, 'S');
    
    // Class name
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(30, 64, 175); // Dark blue
    this.doc.text(`${classGroup.className}`, this.margin + 6, currentY + 6);
    
    // Class type badge
    this.doc.setFillColor(59, 130, 246);
    this.doc.roundedRect(this.margin + 6 + this.doc.getTextWidth(classGroup.className) + 5, currentY - 1, 
                        this.doc.getTextWidth(classGroup.classType) + 8, 10, 2, 2, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(classGroup.classType, this.margin + 10 + this.doc.getTextWidth(classGroup.className) + 5, currentY + 5);
    
    // Course details
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(75, 85, 99);
    this.doc.text(`Course Fee: ${this.formatCurrency(classGroup.courseFee)} • ${classGroup.handlers.length} handlers enrolled`, 
                  this.margin + 6, currentY + 17);
    
    this.doc.setTextColor(0, 0, 0); // Reset text color
    currentY += headerHeight + 8;

    // Enhanced handlers table
    const tableData = classGroup.handlers.map((handler: any) => [
      handler.clientName,
      `${handler.dogName}\n(${handler.dogBreed})`,
      `${handler.attendanceCount}/${handler.totalClasses}`,
      handler.paymentStatus === 'paid' ? 'Paid' : 'Unpaid',
      this.formatCurrency(handler.invoiceAmount),
      this.formatCurrency(handler.franchiseFee),
      this.formatCurrency(handler.adminFee),
      this.formatCurrency(handler.mckaynineCommission)
    ]);

    this.doc.autoTable({
      startY: currentY,
      head: [['Handler', 'Dog', 'Attendance', 'Payment', 'Invoice Amount', 'Franchise Fee', 'Admin Fee', 'Commission']],
      body: tableData,
      margin: { left: this.margin, right: this.margin },
      styles: { 
        fontSize: 8,
        cellPadding: 4,
        lineColor: [229, 231, 235],
        lineWidth: 0.3
      },
      headStyles: { 
        fillColor: [31, 41, 55], // Dark gray
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      columnStyles: {
        0: { cellWidth: 28, fontStyle: 'bold' },
        1: { cellWidth: 25 },
        2: { halign: 'center', cellWidth: 18 },
        3: { halign: 'center', cellWidth: 16 },
        4: { halign: 'right', cellWidth: 22, fontStyle: 'bold' },
        5: { halign: 'right', cellWidth: 20 },
        6: { halign: 'right', cellWidth: 18 },
        7: { halign: 'right', cellWidth: 22, fontStyle: 'bold' }
      },
      alternateRowStyles: { 
        fillColor: [248, 250, 252] // Very light blue-gray
      },
      didParseCell: (data: any) => {
        // Style payment status cells
        if (data.column.index === 3) {
          if (data.cell.text[0] === 'Paid') {
            data.cell.styles.fillColor = [220, 252, 231]; // Light green
            data.cell.styles.textColor = [21, 128, 61]; // Dark green
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.fillColor = [254, 226, 226]; // Light red
            data.cell.styles.textColor = [185, 28, 28]; // Dark red
            data.cell.styles.fontStyle = 'bold';
          }
        }
        
        // Highlight currency columns
        if ([4, 7].includes(data.column.index)) {
          data.cell.styles.textColor = [59, 130, 246]; // Blue
        }
      }
    });

    currentY = (this.doc as any).lastAutoTable.finalY + 8;

    // Enhanced class totals box
    const totalsBoxWidth = 80;
    const totalsBoxHeight = 25;
    const totalsX = this.pageWidth - this.margin - totalsBoxWidth;
    
    // Totals box shadow
    this.doc.setFillColor(0, 0, 0, 0.1);
    this.doc.roundedRect(totalsX + 1, currentY + 1, totalsBoxWidth, totalsBoxHeight, 3, 3, 'F');
    
    // Totals box background
    this.doc.setFillColor(250, 250, 250);
    this.doc.roundedRect(totalsX, currentY, totalsBoxWidth, totalsBoxHeight, 3, 3, 'F');
    
    // Totals box border
    this.doc.setDrawColor(59, 130, 246);
    this.doc.setLineWidth(0.8);
    this.doc.roundedRect(totalsX, currentY, totalsBoxWidth, totalsBoxHeight, 3, 3, 'S');

    const totalsData = [
      ['Revenue:', this.formatCurrency(classGroup.classTotals.totalRevenue)],
      ['Franchise:', this.formatCurrency(classGroup.classTotals.totalFranchiseFees)],
      ['Admin:', this.formatCurrency(classGroup.classTotals.totalAdminFees)],
      ['Commission:', this.formatCurrency(classGroup.classTotals.totalMckaynineCommission)]
    ];

    this.doc.autoTable({
      startY: currentY + 2,
      body: totalsData,
      margin: { left: totalsX + 3, right: this.margin },
      styles: { 
        fontSize: 8,
        cellPadding: 1.5,
        lineWidth: 0
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 20, textColor: [75, 85, 99] },
        1: { halign: 'right', fontStyle: 'bold', cellWidth: 25, textColor: [59, 130, 246] }
      },
      didDrawPage: () => {
        // Remove default table styling
      }
    });

    return (this.doc as any).lastAutoTable.finalY + 20;
  }

  async generateReport(reportData: FranchiseReportData, termLabel: string): Promise<Blob> {
    this.addHeader(termLabel);
    
    let currentY = 75;

    // Add summary cards
    currentY = this.addSummaryCards(reportData.reportTotals, currentY);

    // Add each class section
    reportData.classes.forEach((classGroup, index) => {
      currentY = this.addClassSection(classGroup, currentY);
    });

    // Add footer
    const pageCount = this.doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setTextColor(156, 163, 175);
      this.doc.text(`Page ${i} of ${pageCount}`, this.pageWidth - this.margin - 15, this.pageHeight - 10);
      this.doc.text('McKaynine Training Centre - Franchise Report', this.margin, this.pageHeight - 10);
    }

    // Convert to blob
    const pdfOutput = this.doc.output('blob');
    return pdfOutput;
  }
}
