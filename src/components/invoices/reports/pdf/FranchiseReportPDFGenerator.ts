
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
    // Clean, minimal header
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
      
      // Card background (clean rounded rectangle)
      this.doc.setFillColor(card.bgColor[0], card.bgColor[1], card.bgColor[2]);
      this.doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
      
      // Subtle border
      this.doc.setDrawColor(card.textColor[0], card.textColor[1], card.textColor[2]);
      this.doc.setLineWidth(0.2);
      this.doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.5, 1.5, 'S');
      
      // Title
      this.doc.setTextColor(card.textColor[0], card.textColor[1], card.textColor[2]);
      this.doc.setFontSize(6);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(card.title, x + 2, currentY + 4);
      
      // Value
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
    if (currentY > this.pageHeight - 50) {
      this.doc.addPage();
      currentY = 20;
    }

    // Class card container (like the web version)
    const cardWidth = this.pageWidth - 30;
    const cardX = this.margin;
    
    // Card shadow (very subtle)
    this.doc.setFillColor(0, 0, 0, 0.02);
    this.doc.roundedRect(cardX + 0.5, currentY + 0.5, cardWidth, 0, 2, 2, 'F');
    
    // Card background
    this.doc.setFillColor(255, 255, 255);
    this.doc.roundedRect(cardX, currentY, cardWidth, 0, 2, 2, 'F');
    
    // Blue left border (like web version)
    this.doc.setFillColor(59, 130, 246);
    this.doc.rect(cardX, currentY, 2, 0, 'F');
    
    // Card border
    this.doc.setDrawColor(229, 231, 235);
    this.doc.setLineWidth(0.2);
    this.doc.roundedRect(cardX, currentY, cardWidth, 0, 2, 2, 'S');

    // Class header (blue background like web)
    const headerHeight = 12;
    this.doc.setFillColor(239, 246, 255);
    this.doc.rect(cardX, currentY, cardWidth, headerHeight, 'F');
    
    // Class name
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(30, 64, 175);
    this.doc.text(`${classGroup.className}`, cardX + 3, currentY + 5);
    
    // Class type badge
    const badgeX = cardX + 3 + this.doc.getTextWidth(classGroup.className) + 2;
    this.doc.setFillColor(59, 130, 246);
    this.doc.roundedRect(badgeX, currentY + 2, this.doc.getTextWidth(classGroup.classType) + 4, 5, 1, 1, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(6);
    this.doc.text(classGroup.classType, badgeX + 2, currentY + 5);
    
    // Course details
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(75, 85, 99);
    this.doc.text(`Course Fee: ${this.formatCurrency(classGroup.courseFee)} • ${classGroup.handlers.length} handlers enrolled`, 
                  cardX + 3, currentY + 9.5);
    
    this.doc.setTextColor(0, 0, 0);
    currentY += headerHeight;

    // Integrated table (part of the card, no separate borders)
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
      margin: { left: cardX, right: this.margin },
      styles: { 
        fontSize: 6,
        cellPadding: 1.5,
        lineColor: [229, 231, 235],
        lineWidth: 0.1,
        lineHeight: 1.1
      },
      headStyles: { 
        fillColor: [249, 250, 251],
        textColor: [75, 85, 99],
        fontStyle: 'bold',
        fontSize: 6,
        cellPadding: 1.5
      },
      columnStyles: {
        0: { cellWidth: 24, fontStyle: 'bold' },
        1: { cellWidth: 20 },
        2: { halign: 'center', cellWidth: 14 },
        3: { halign: 'center', cellWidth: 12 },
        4: { halign: 'right', cellWidth: 18, fontStyle: 'bold' },
        5: { halign: 'right', cellWidth: 16 },
        6: { halign: 'right', cellWidth: 14 },
        7: { halign: 'right', cellWidth: 18, fontStyle: 'bold' }
      },
      alternateRowStyles: { 
        fillColor: [248, 250, 252]
      },
      tableLineColor: [229, 231, 235],
      tableLineWidth: 0.1,
      didParseCell: (data: any) => {
        // Remove outer borders to integrate with card
        if (data.row.index === 0 && data.section === 'head') {
          data.cell.styles.lineWidth = { top: 0, right: 0.1, bottom: 0.1, left: 0 };
        } else if (data.row.index === tableData.length - 1 && data.section === 'body') {
          data.cell.styles.lineWidth = { top: 0.1, right: 0.1, bottom: 0, left: 0 };
        } else {
          data.cell.styles.lineWidth = { top: 0.1, right: 0.1, bottom: 0.1, left: 0 };
        }
        
        // First and last columns get side borders
        if (data.column.index === 0) {
          data.cell.styles.lineWidth.left = 0;
        }
        if (data.column.index === 7) {
          data.cell.styles.lineWidth.right = 0;
        }
        
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
      }
    });

    currentY = (this.doc as any).lastAutoTable.finalY;

    // Clean totals section (integrated with card)
    this.doc.setFillColor(249, 250, 251);
    this.doc.rect(cardX, currentY, cardWidth, 12, 'F');
    
    // Totals labels and values - properly right-justified
    const totals = [
      { label: 'Revenue:', value: this.formatCurrency(classGroup.classTotals.totalRevenue) },
      { label: 'Franchise:', value: this.formatCurrency(classGroup.classTotals.totalFranchiseFees) },
      { label: 'Admin:', value: this.formatCurrency(classGroup.classTotals.totalAdminFees) },
      { label: 'Commission:', value: this.formatCurrency(classGroup.classTotals.totalMckaynineCommission) }
    ];

    this.doc.setFontSize(6);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(75, 85, 99);
    this.doc.text('Class Totals:', cardX + 3, currentY + 4);

    // Right-align the totals values properly
    let totalX = cardX + cardWidth - 3;
    totals.forEach((total, index) => {
      const yPos = currentY + 4 + (index * 2);
      
      // Value (right-aligned)
      this.doc.setTextColor(59, 130, 246);
      const valueWidth = this.doc.getTextWidth(total.value);
      this.doc.text(total.value, totalX - valueWidth, yPos);
      
      // Label (positioned to the left of value)
      this.doc.setTextColor(75, 85, 99);
      const labelWidth = this.doc.getTextWidth(total.label);
      this.doc.text(total.label, totalX - valueWidth - labelWidth - 2, yPos);
      
      // Adjust position for next total
      totalX -= (valueWidth + labelWidth + 8);
    });

    // Complete the card
    currentY += 12;
    
    // Update card height and redraw with proper height
    const cardHeight = currentY - startY - 5;
    this.doc.setFillColor(0, 0, 0, 0.02);
    this.doc.roundedRect(cardX + 0.5, startY + 5.5, cardWidth, cardHeight, 2, 2, 'F');
    
    this.doc.setFillColor(255, 255, 255);
    this.doc.roundedRect(cardX, startY + 5, cardWidth, cardHeight, 2, 2, 'F');
    
    this.doc.setFillColor(59, 130, 246);
    this.doc.rect(cardX, startY + 5, 2, cardHeight, 'F');
    
    this.doc.setDrawColor(229, 231, 235);
    this.doc.setLineWidth(0.2);
    this.doc.roundedRect(cardX, startY + 5, cardWidth, cardHeight, 2, 2, 'S');

    return currentY + 8;
  }

  async generateReport(reportData: FranchiseReportData, termLabel: string): Promise<Blob> {
    this.addHeader(termLabel);
    
    let currentY = 40;

    // Add summary cards
    currentY = this.addSummaryCards(reportData.reportTotals, currentY);

    // Add each class section
    reportData.classes.forEach((classGroup, index) => {
      currentY = this.addClassSection(classGroup, currentY);
    });

    // Clean footer
    const pageCount = this.doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(6);
      this.doc.setTextColor(156, 163, 175);
      this.doc.text(`Page ${i} of ${pageCount}`, this.pageWidth - this.margin - 10, this.pageHeight - 6);
      this.doc.text('McKaynine Training Centre - Franchise Report', this.margin, this.pageHeight - 6);
    }

    // Convert to blob
    const pdfOutput = this.doc.output('blob');
    return pdfOutput;
  }
}
