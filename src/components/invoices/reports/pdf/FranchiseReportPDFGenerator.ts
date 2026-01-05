
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
    this.doc = new jsPDF({ 
      orientation: 'p', 
      unit: 'mm', 
      format: 'a4',
      compress: true,
      putOnlyUsedFonts: true
    });
    this.doc.setFont("helvetica", "normal");
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  private formatCurrency(amount: number): string {
    return `R ${amount.toFixed(2)}`;
  }

  private addHeader(termLabel: string) {
    // Clean header with proper spacing
    this.doc.setFillColor(249, 250, 251);
    this.doc.rect(0, 0, this.pageWidth, 35, 'F');
    
    // Company name
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(31, 41, 55);
    this.doc.text('McKaynine Training Centre', this.margin, 14);

    // Report title
    this.doc.setFontSize(12);
    this.doc.setTextColor(59, 130, 246);
    this.doc.text('Franchise Classes Report', this.margin, 22);

    // Term and date info
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(75, 85, 99);
    this.doc.text(`Term: ${termLabel}`, this.margin, 29);
    this.doc.text(`Generated: ${new Date().toLocaleDateString('en-ZA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, this.pageWidth - this.margin - 40, 29);

    // Clean separator line
    this.doc.setDrawColor(229, 231, 235);
    this.doc.setLineWidth(0.2);
    this.doc.line(this.margin, 35, this.pageWidth - this.margin, 35);
  }

  private addSummaryCards(reportTotals: any, startY: number): number {
    const cardWidth = (this.pageWidth - 40) / 4;
    const cardHeight = 16;
    let currentY = startY + 6;

    const cards = [
      { 
        title: 'Total Revenue', 
        value: this.formatCurrency(reportTotals.totalRevenue), 
        bgColor: [239, 246, 255],
        textColor: [59, 130, 246]
      },
      { 
        title: 'Franchise Fees', 
        value: this.formatCurrency(reportTotals.totalFranchiseFees), 
        bgColor: [240, 253, 244],
        textColor: [34, 197, 94]
      },
      { 
        title: 'Admin Fees', 
        value: this.formatCurrency(reportTotals.totalAdminFees), 
        bgColor: [255, 247, 237],
        textColor: [249, 115, 22]
      },
      { 
        title: 'McKaynine Commission', 
        value: this.formatCurrency(reportTotals.totalMckaynineCommission), 
        bgColor: [250, 245, 255],
        textColor: [168, 85, 247]
      }
    ];

    cards.forEach((card, index) => {
      const x = this.margin + (index * (cardWidth + 1));
      
      // Card background
      this.doc.setFillColor(card.bgColor[0], card.bgColor[1], card.bgColor[2]);
      this.doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
      
      // Card border
      this.doc.setDrawColor(card.textColor[0], card.textColor[1], card.textColor[2]);
      this.doc.setLineWidth(0.2);
      this.doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.5, 1.5, 'S');
      
      // Title text
      this.doc.setTextColor(card.textColor[0], card.textColor[1], card.textColor[2]);
      this.doc.setFontSize(6);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(card.title, x + 2, currentY + 4);
      
      // Value text
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(card.value, x + 2, currentY + 10);
    });

    this.doc.setTextColor(0, 0, 0);
    return currentY + cardHeight + 8;
  }

  private addClassSection(classGroup: any, startY: number): number {
    let currentY = startY + 5;

    // Check if we need a new page
    if (currentY > this.pageHeight - 80) {
      this.doc.addPage();
      currentY = 20;
    }

    const cardX = this.margin;
    const cardWidth = this.pageWidth - 30;
    
    // Step 1: Calculate header height
    const headerHeight = 14;
    
    // Step 2: Add class header with blue background
    this.doc.setFillColor(59, 130, 246);
    this.doc.roundedRect(cardX, currentY, cardWidth, headerHeight, 2, 2, 'F');
    
    // Class name in white text
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(classGroup.className, cardX + 4, currentY + 6);
    
    // Class type badge
    const classNameWidth = this.doc.getTextWidth(classGroup.className);
    const badgeX = cardX + 6 + classNameWidth;
    this.doc.setFillColor(255, 255, 255, 0.2);
    this.doc.roundedRect(badgeX, currentY + 3, this.doc.getTextWidth(classGroup.classType) + 4, 6, 1, 1, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(6);
    this.doc.text(classGroup.classType, badgeX + 2, currentY + 7);
    
    // Course details in smaller white text
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Course Fee: ${this.formatCurrency(classGroup.courseFee)} • ${classGroup.handlers.length} handlers enrolled`, 
                  cardX + 4, currentY + 11);
    
    currentY += headerHeight;
    
    // Step 3: Prepare table data
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

    // Step 4: Calculate available table width
    const tableMargin = 2;
    const availableTableWidth = cardWidth - (tableMargin * 2);

    // Step 5: Add table with percentage-based column widths
    this.doc.autoTable({
      startY: currentY,
      head: [['Handler', 'Dog', 'Attendance', 'Payment', 'Invoice Amount', 'Franchise Fee', 'Admin Fee', 'Commission']],
      body: tableData,
      margin: { left: cardX + tableMargin, right: this.margin + tableMargin },
      tableWidth: availableTableWidth,
      styles: { 
        fontSize: 6,
        cellPadding: 1.5,
        lineColor: [229, 231, 235],
        lineWidth: 0.1,
        overflow: 'linebreak'
      },
      headStyles: { 
        fillColor: [249, 250, 251],
        textColor: [75, 85, 99],
        fontStyle: 'bold',
        fontSize: 6
      },
      columnStyles: {
        0: { cellWidth: 'auto', fontStyle: 'bold', minCellWidth: 20 }, // Handler - auto width with min
        1: { cellWidth: 'auto', minCellWidth: 18 }, // Dog - auto width with min
        2: { halign: 'center', cellWidth: 'auto', minCellWidth: 12 }, // Attendance - centered, auto width
        3: { halign: 'center', cellWidth: 'auto', minCellWidth: 10 }, // Payment - centered, auto width
        4: { halign: 'right', cellWidth: 'auto', fontStyle: 'bold', minCellWidth: 16 }, // Invoice Amount - right aligned, bold
        5: { halign: 'right', cellWidth: 'auto', minCellWidth: 14 }, // Franchise Fee - right aligned
        6: { halign: 'right', cellWidth: 'auto', minCellWidth: 12 }, // Admin Fee - right aligned
        7: { halign: 'right', cellWidth: 'auto', fontStyle: 'bold', minCellWidth: 16 } // Commission - right aligned, bold
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
        
        // Highlight key currency columns
        if ([4, 7].includes(data.column.index)) {
          data.cell.styles.textColor = [59, 130, 246];
        }
      },
      didDrawPage: (data: any) => {
        // Reset text color after table
        this.doc.setTextColor(0, 0, 0);
      }
    });

    // Step 6: Get table end position and ensure proper positioning
    const tableEndY = (this.doc as any).lastAutoTable.finalY || currentY + 20;
    
    // Step 7: Add totals footer with proper positioning
    const totalsHeight = 12;
    this.doc.setFillColor(249, 250, 251);
    this.doc.rect(cardX, tableEndY, cardWidth, totalsHeight, 'F');
    
    // Totals content - left aligned label
    this.doc.setFontSize(6);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(75, 85, 99);
    this.doc.text('Class Totals:', cardX + 4, tableEndY + 7);

    // Right-aligned totals with improved spacing
    const totals = [
      { label: 'Revenue:', value: this.formatCurrency(classGroup.classTotals.totalRevenue) },
      { label: 'Franchise:', value: this.formatCurrency(classGroup.classTotals.totalFranchiseFees) },
      { label: 'Admin:', value: this.formatCurrency(classGroup.classTotals.totalAdminFees) },
      { label: 'Commission:', value: this.formatCurrency(classGroup.classTotals.totalMckaynineCommission) }
    ];

    let totalX = cardX + cardWidth - 4;
    
    // Draw totals from right to left with consistent spacing
    totals.reverse().forEach((total, index) => {
      // Value in blue
      this.doc.setTextColor(59, 130, 246);
      this.doc.setFont('helvetica', 'bold');
      const valueWidth = this.doc.getTextWidth(total.value);
      this.doc.text(total.value, totalX - valueWidth, tableEndY + 7);
      
      // Label in gray
      this.doc.setTextColor(75, 85, 99);
      this.doc.setFont('helvetica', 'normal');
      const labelWidth = this.doc.getTextWidth(total.label);
      this.doc.text(total.label, totalX - valueWidth - labelWidth - 2, tableEndY + 7);
      
      // Move position for next total (consistent spacing)
      totalX -= (valueWidth + labelWidth + 12);
    });

    const cardEndY = tableEndY + totalsHeight;
    
    // Step 8: Draw complete card outline (removed blue left border)
    this.doc.setDrawColor(229, 231, 235);
    this.doc.setLineWidth(0.2);
    this.doc.roundedRect(cardX, currentY - headerHeight, cardWidth, cardEndY - (currentY - headerHeight), 2, 2, 'S');

    // Reset text color
    this.doc.setTextColor(0, 0, 0);
    return cardEndY + 8;
  }

  async generateReport(reportData: FranchiseReportData, termLabel: string): Promise<Blob> {
    this.addHeader(termLabel);
    
    let currentY = 40;

    // Add summary cards
    currentY = this.addSummaryCards(reportData.reportTotals, currentY);

    // Add each class section with better page break handling
    reportData.classes.forEach((classGroup, index) => {
      // Add extra spacing between classes
      if (index > 0) {
        currentY += 3;
      }
      
      currentY = this.addClassSection(classGroup, currentY);
    });

    // Add footer to all pages
    const pageCount = this.doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(6);
      this.doc.setTextColor(156, 163, 175);
      this.doc.text(`Page ${i} of ${pageCount}`, this.pageWidth - this.margin - 10, this.pageHeight - 6);
      this.doc.text('McKaynine Training Centre - Franchise Report', this.margin, this.pageHeight - 6);
    }

    return this.doc.output('blob');
  }
}
