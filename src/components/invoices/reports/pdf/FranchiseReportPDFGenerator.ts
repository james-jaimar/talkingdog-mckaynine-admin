
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
  private margin: number = 15;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  private formatCurrency(amount: number): string {
    return `R ${amount.toFixed(2)}`;
  }

  private addHeader(termLabel: string) {
    // Compact company header
    this.doc.setFillColor(249, 250, 251);
    this.doc.rect(0, 0, this.pageWidth, 45, 'F');
    
    // Company name - smaller font
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(31, 41, 55);
    this.doc.text('McKaynine Training Centre', this.margin, 18);

    // Report title - smaller font
    this.doc.setFontSize(14);
    this.doc.setTextColor(59, 130, 246);
    this.doc.text('Franchise Classes Report', this.margin, 28);

    // Term and date info - smaller font
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(75, 85, 99);
    this.doc.text(`Term: ${termLabel}`, this.margin, 36);
    this.doc.text(`Generated: ${new Date().toLocaleDateString('en-ZA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, this.margin, 42);

    // Border line
    this.doc.setDrawColor(229, 231, 235);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, 45, this.pageWidth - this.margin, 45);
  }

  private addSummaryCards(reportTotals: any, startY: number): number {
    const cardWidth = (this.pageWidth - 40) / 4;
    const cardHeight = 20; // Reduced from 32
    let currentY = startY + 8; // Reduced spacing

    const cards = [
      { 
        title: 'Total Revenue', 
        value: this.formatCurrency(reportTotals.totalRevenue), 
        bgColor: [59, 130, 246],
        lightBg: [239, 246, 255]
      },
      { 
        title: 'Franchise Fees', 
        value: this.formatCurrency(reportTotals.totalFranchiseFees), 
        bgColor: [34, 197, 94],
        lightBg: [240, 253, 244]
      },
      { 
        title: 'Admin Fees', 
        value: this.formatCurrency(reportTotals.totalAdminFees), 
        bgColor: [249, 115, 22],
        lightBg: [255, 247, 237]
      },
      { 
        title: 'McKaynine Commission', 
        value: this.formatCurrency(reportTotals.totalMckaynineCommission), 
        bgColor: [168, 85, 247],
        lightBg: [250, 245, 255]
      }
    ];

    cards.forEach((card, index) => {
      const x = this.margin + (index * (cardWidth + 1.5)); // Tighter spacing
      
      // Card shadow - smaller
      this.doc.setFillColor(0, 0, 0, 0.08);
      this.doc.roundedRect(x + 0.5, currentY + 0.5, cardWidth, cardHeight, 2, 2, 'F');
      
      // Card background
      this.doc.setFillColor(card.lightBg[0], card.lightBg[1], card.lightBg[2]);
      this.doc.roundedRect(x, currentY, cardWidth, cardHeight, 2, 2, 'F');
      
      // Card border
      this.doc.setDrawColor(card.bgColor[0], card.bgColor[1], card.bgColor[2]);
      this.doc.setLineWidth(0.5);
      this.doc.roundedRect(x, currentY, cardWidth, cardHeight, 2, 2, 'S');
      
      // Title - smaller font
      this.doc.setTextColor(card.bgColor[0], card.bgColor[1], card.bgColor[2]);
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(card.title, x + 2.5, currentY + 5);
      
      // Value - smaller font
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(card.value, x + 2.5, currentY + 13);
    });

    this.doc.setTextColor(0, 0, 0);
    return currentY + cardHeight + 12; // Reduced spacing
  }

  private addClassSection(classGroup: any, startY: number): number {
    let currentY = startY + 6; // Reduced spacing

    // Check if we need a new page
    if (currentY > this.pageHeight - 60) {
      this.doc.addPage();
      currentY = 25;
    }

    // Compact class header
    const headerHeight = 18; // Reduced from 28
    
    // Header shadow - smaller
    this.doc.setFillColor(0, 0, 0, 0.04);
    this.doc.roundedRect(this.margin + 0.5, currentY - 1.5, this.pageWidth - 32, headerHeight, 3, 3, 'F');
    
    // Header background
    this.doc.setFillColor(239, 246, 255);
    this.doc.roundedRect(this.margin, currentY - 2, this.pageWidth - 30, headerHeight, 3, 3, 'F');
    
    // Header border
    this.doc.setDrawColor(59, 130, 246);
    this.doc.setLineWidth(0.6);
    this.doc.roundedRect(this.margin, currentY - 2, this.pageWidth - 30, headerHeight, 3, 3, 'S');
    
    // Class name - smaller font
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(30, 64, 175);
    this.doc.text(`${classGroup.className}`, this.margin + 4, currentY + 4);
    
    // Class type badge - smaller
    this.doc.setFillColor(59, 130, 246);
    this.doc.roundedRect(this.margin + 4 + this.doc.getTextWidth(classGroup.className) + 3, currentY + 0.5, 
                        this.doc.getTextWidth(classGroup.classType) + 6, 7, 1.5, 1.5, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(classGroup.classType, this.margin + 7 + this.doc.getTextWidth(classGroup.className) + 3, currentY + 4.5);
    
    // Course details - smaller font
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(75, 85, 99);
    this.doc.text(`Course Fee: ${this.formatCurrency(classGroup.courseFee)} • ${classGroup.handlers.length} handlers enrolled`, 
                  this.margin + 4, currentY + 12);
    
    this.doc.setTextColor(0, 0, 0);
    currentY += headerHeight + 4; // Reduced spacing

    // Compact handlers table
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
        fontSize: 7, // Reduced from 8
        cellPadding: 2, // Reduced from 4
        lineColor: [229, 231, 235],
        lineWidth: 0.2,
        lineHeight: 1.2 // Tighter line height
      },
      headStyles: { 
        fillColor: [31, 41, 55],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 26, fontStyle: 'bold' }, // Slightly narrower
        1: { cellWidth: 22 },
        2: { halign: 'center', cellWidth: 16 },
        3: { halign: 'center', cellWidth: 14 },
        4: { halign: 'right', cellWidth: 20, fontStyle: 'bold' },
        5: { halign: 'right', cellWidth: 18 },
        6: { halign: 'right', cellWidth: 16 },
        7: { halign: 'right', cellWidth: 20, fontStyle: 'bold' }
      },
      alternateRowStyles: { 
        fillColor: [248, 250, 252]
      },
      didParseCell: (data: any) => {
        // Style payment status cells
        if (data.column.index === 3) {
          if (data.cell.text[0] === 'Paid') {
            data.cell.styles.fillColor = [220, 252, 231];
            data.cell.styles.textColor = [21, 128, 61];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.fillColor = [254, 226, 226];
            data.cell.styles.textColor = [185, 28, 28];
            data.cell.styles.fontStyle = 'bold';
          }
        }
        
        // Highlight currency columns
        if ([4, 7].includes(data.column.index)) {
          data.cell.styles.textColor = [59, 130, 246];
        }
      }
    });

    currentY = (this.doc as any).lastAutoTable.finalY + 4; // Reduced spacing

    // Compact totals box with right-justified values
    const totalsBoxWidth = 70; // Reduced width
    const totalsBoxHeight = 18; // Reduced height
    const totalsX = this.pageWidth - this.margin - totalsBoxWidth;
    
    // Totals box shadow - smaller
    this.doc.setFillColor(0, 0, 0, 0.06);
    this.doc.roundedRect(totalsX + 0.5, currentY + 0.5, totalsBoxWidth, totalsBoxHeight, 2, 2, 'F');
    
    // Totals box background
    this.doc.setFillColor(250, 250, 250);
    this.doc.roundedRect(totalsX, currentY, totalsBoxWidth, totalsBoxHeight, 2, 2, 'F');
    
    // Totals box border
    this.doc.setDrawColor(59, 130, 246);
    this.doc.setLineWidth(0.5);
    this.doc.roundedRect(totalsX, currentY, totalsBoxWidth, totalsBoxHeight, 2, 2, 'S');

    // Manual totals layout for proper right justification
    const totals = [
      { label: 'Revenue:', value: this.formatCurrency(classGroup.classTotals.totalRevenue) },
      { label: 'Franchise:', value: this.formatCurrency(classGroup.classTotals.totalFranchiseFees) },
      { label: 'Admin:', value: this.formatCurrency(classGroup.classTotals.totalAdminFees) },
      { label: 'Commission:', value: this.formatCurrency(classGroup.classTotals.totalMckaynineCommission) }
    ];

    this.doc.setFontSize(7);
    totals.forEach((total, index) => {
      const yPos = currentY + 3 + (index * 3.5); // Tighter spacing
      
      // Label (left-aligned)
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(75, 85, 99);
      this.doc.text(total.label, totalsX + 2, yPos);
      
      // Value (right-aligned within the box)
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(59, 130, 246);
      const valueWidth = this.doc.getTextWidth(total.value);
      this.doc.text(total.value, totalsX + totalsBoxWidth - valueWidth - 2, yPos);
    });

    return currentY + totalsBoxHeight + 12; // Reduced spacing
  }

  async generateReport(reportData: FranchiseReportData, termLabel: string): Promise<Blob> {
    this.addHeader(termLabel);
    
    let currentY = 50; // Reduced from 75

    // Add summary cards
    currentY = this.addSummaryCards(reportData.reportTotals, currentY);

    // Add each class section
    reportData.classes.forEach((classGroup, index) => {
      currentY = this.addClassSection(classGroup, currentY);
    });

    // Add compact footer
    const pageCount = this.doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(7); // Smaller footer
      this.doc.setTextColor(156, 163, 175);
      this.doc.text(`Page ${i} of ${pageCount}`, this.pageWidth - this.margin - 12, this.pageHeight - 8);
      this.doc.text('McKaynine Training Centre - Franchise Report', this.margin, this.pageHeight - 8);
    }

    // Convert to blob
    const pdfOutput = this.doc.output('blob');
    return pdfOutput;
  }
}
