
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { FranchiseReportData } from '@/hooks/useFranchiseClassesData';
import { addEmbeddedFonts, setFont } from '../../pdf/utils/embeddedFonts';

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
  private fontsLoaded: boolean = false;

  constructor() {
    this.doc = new jsPDF({ 
      orientation: 'l', // Landscape for more columns
      unit: 'mm', 
      format: 'a4',
      compress: true,
      putOnlyUsedFonts: true
    });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  private async ensureFontsLoaded(): Promise<void> {
    if (!this.fontsLoaded) {
      await addEmbeddedFonts(this.doc);
      this.fontsLoaded = true;
    }
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
    setFont(this.doc, 'bold');
    this.doc.setTextColor(31, 41, 55);
    this.doc.text('McKaynine Training Centre', this.margin, 14);

    // Report title
    this.doc.setFontSize(12);
    this.doc.setTextColor(59, 130, 246);
    this.doc.text('Franchise Classes Report', this.margin, 22);

    // Term and date info
    this.doc.setFontSize(8);
    setFont(this.doc, 'normal');
    this.doc.setTextColor(75, 85, 99);
    this.doc.text(`Term: ${termLabel}`, this.margin, 29);
    this.doc.text(`Generated: ${new Date().toLocaleDateString('en-ZA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, this.pageWidth - this.margin - 50, 29);

    // Clean separator line
    this.doc.setDrawColor(229, 231, 235);
    this.doc.setLineWidth(0.2);
    this.doc.line(this.margin, 35, this.pageWidth - this.margin, 35);
  }

  private addSummaryCards(reportTotals: any, startY: number): number {
    const cardWidth = (this.pageWidth - 40) / 4;
    const cardHeight = 18;
    let currentY = startY + 6;

    const cards = [
      { 
        title: 'Course Fees', 
        subtitle: '',
        value: this.formatCurrency(reportTotals.totalCourseFees), 
        bgColor: [239, 246, 255],
        textColor: [59, 130, 246]
      },
      { 
        title: 'Enrollment Fees', 
        subtitle: 'Starter Kits',
        value: this.formatCurrency(reportTotals.totalEnrollmentFees || 0), 
        bgColor: [236, 254, 255],
        textColor: [6, 182, 212]
      },
      { 
        title: 'Franchise Fees', 
        subtitle: '15% of course fees',
        value: this.formatCurrency(reportTotals.totalFranchiseFees), 
        bgColor: [240, 253, 244],
        textColor: [34, 197, 94]
      },
      { 
        title: 'Total', 
        subtitle: '',
        value: this.formatCurrency(reportTotals.totalAmount), 
        bgColor: [250, 245, 255],
        textColor: [168, 85, 247]
      }
    ];

    cards.forEach((card, index) => {
      const x = this.margin + (index * (cardWidth + 2));
      
      // Card background
      this.doc.setFillColor(card.bgColor[0], card.bgColor[1], card.bgColor[2]);
      this.doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
      
      // Card border
      this.doc.setDrawColor(card.textColor[0], card.textColor[1], card.textColor[2]);
      this.doc.setLineWidth(0.2);
      this.doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.5, 1.5, 'S');
      
      // Title text
      this.doc.setTextColor(card.textColor[0], card.textColor[1], card.textColor[2]);
      this.doc.setFontSize(7);
      setFont(this.doc, 'bold');
      this.doc.text(card.title, x + 3, currentY + 5);
      
      // Subtitle text (if any)
      if (card.subtitle) {
        this.doc.setFontSize(5);
        setFont(this.doc, 'normal');
        this.doc.text(card.subtitle, x + 3, currentY + 9);
      }
      
      // Value text
      this.doc.setFontSize(10);
      setFont(this.doc, 'bold');
      this.doc.text(card.value, x + 3, currentY + (card.subtitle ? 15 : 13));
    });

    this.doc.setTextColor(0, 0, 0);
    return currentY + cardHeight + 8;
  }

  private addClassSection(classGroup: any, startY: number): number {
    let currentY = startY + 5;

    // Check if we need a new page
    if (currentY > this.pageHeight - 60) {
      this.doc.addPage();
      currentY = 20;
    }

    const cardX = this.margin;
    const cardWidth = this.pageWidth - 30;
    
    // Step 1: Calculate header height
    const headerHeight = 12;
    
    // Step 2: Add class header with blue background
    this.doc.setFillColor(59, 130, 246);
    this.doc.roundedRect(cardX, currentY, cardWidth, headerHeight, 2, 2, 'F');
    
    // Class name in white text
    this.doc.setFontSize(10);
    setFont(this.doc, 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(classGroup.className, cardX + 4, currentY + 5);
    
    // Class type and handler count
    this.doc.setFontSize(7);
    setFont(this.doc, 'normal');
    this.doc.text(`${classGroup.classType} • ${classGroup.handlers.length} handlers`, 
                  cardX + 4, currentY + 9);
    
    // Class totals on right side
    this.doc.text(`Total: ${this.formatCurrency(classGroup.classTotals.totalAmount)} | Franchise Fee: ${this.formatCurrency(classGroup.classTotals.totalFranchiseFees)}`,
                  cardX + cardWidth - 80, currentY + 7);
    
    currentY += headerHeight;
    
    // Step 3: Prepare table data with new columns
    const tableData = classGroup.handlers.map((handler: any) => [
      handler.clientName,
      `${handler.dogName} (${handler.dogBreed})`,
      handler.clientEmail,
      this.formatCurrency(handler.courseFeeAmount),
      handler.enrollmentFeeAmount > 0 ? this.formatCurrency(handler.enrollmentFeeAmount) : '-',
      this.formatCurrency(handler.franchiseFee),
      this.formatCurrency(handler.totalAmount)
    ]);

    // Step 4: Calculate available table width
    const tableMargin = 2;
    const availableTableWidth = cardWidth - (tableMargin * 2);

    // Step 5: Add table with new column structure
    this.doc.autoTable({
      startY: currentY,
      head: [['Handler', 'Dog', 'Email', 'Course Fee', 'Enrollment Fee', 'Franchise Fee', 'Total']],
      body: tableData,
      margin: { left: cardX + tableMargin, right: this.margin + tableMargin },
      tableWidth: availableTableWidth,
      styles: { 
        fontSize: 7,
        cellPadding: 2,
        lineColor: [229, 231, 235],
        lineWidth: 0.1,
        overflow: 'linebreak',
        font: 'Roboto'
      },
      headStyles: { 
        fillColor: [249, 250, 251],
        textColor: [75, 85, 99],
        fontStyle: 'bold',
        fontSize: 7
      },
      columnStyles: {
        0: { cellWidth: 'auto', fontStyle: 'bold', minCellWidth: 35 }, // Handler
        1: { cellWidth: 'auto', minCellWidth: 40 }, // Dog
        2: { cellWidth: 'auto', minCellWidth: 55 }, // Email
        3: { halign: 'right', cellWidth: 25 }, // Course Fee
        4: { halign: 'right', cellWidth: 25 }, // Enrollment Fee
        5: { halign: 'right', cellWidth: 25, textColor: [34, 197, 94] }, // Franchise Fee (green)
        6: { halign: 'right', cellWidth: 25, fontStyle: 'bold' } // Total
      },
      alternateRowStyles: { 
        fillColor: [248, 250, 252]
      },
      didParseCell: (data: any) => {
        // Highlight franchise fee column
        if (data.column.index === 5 && data.section === 'body') {
          data.cell.styles.textColor = [34, 197, 94];
          data.cell.styles.fontStyle = 'bold';
        }
      },
      didDrawPage: (data: any) => {
        this.doc.setTextColor(0, 0, 0);
      }
    });

    // Step 6: Get table end position
    const tableEndY = (this.doc as any).lastAutoTable.finalY || currentY + 20;
    
    // Step 7: Add totals footer
    const totalsHeight = 10;
    this.doc.setFillColor(249, 250, 251);
    this.doc.rect(cardX, tableEndY, cardWidth, totalsHeight, 'F');
    
    // Totals content
    this.doc.setFontSize(7);
    setFont(this.doc, 'bold');
    this.doc.setTextColor(75, 85, 99);
    this.doc.text('Class Totals:', cardX + 4, tableEndY + 6);

    // Right-aligned totals
    const totals = [
      { label: 'Course Fees:', value: this.formatCurrency(classGroup.classTotals.totalCourseFees) },
      { label: 'Enrollment Fees:', value: this.formatCurrency(classGroup.classTotals.totalEnrollmentFees) },
      { label: 'Franchise Fee:', value: this.formatCurrency(classGroup.classTotals.totalFranchiseFees), highlight: true },
      { label: 'Total:', value: this.formatCurrency(classGroup.classTotals.totalAmount) }
    ];

    let totalX = cardX + cardWidth - 4;
    
    totals.reverse().forEach((total) => {
      // Value
      if (total.highlight) {
        this.doc.setTextColor(34, 197, 94);
      } else {
        this.doc.setTextColor(59, 130, 246);
      }
      setFont(this.doc, 'bold');
      const valueWidth = this.doc.getTextWidth(total.value);
      this.doc.text(total.value, totalX - valueWidth, tableEndY + 6);
      
      // Label
      this.doc.setTextColor(75, 85, 99);
      setFont(this.doc, 'normal');
      const labelWidth = this.doc.getTextWidth(total.label);
      this.doc.text(total.label, totalX - valueWidth - labelWidth - 2, tableEndY + 6);
      
      totalX -= (valueWidth + labelWidth + 15);
    });

    const cardEndY = tableEndY + totalsHeight;
    
    // Step 8: Draw card outline
    this.doc.setDrawColor(229, 231, 235);
    this.doc.setLineWidth(0.2);
    this.doc.roundedRect(cardX, currentY - headerHeight, cardWidth, cardEndY - (currentY - headerHeight), 2, 2, 'S');

    this.doc.setTextColor(0, 0, 0);
    return cardEndY + 8;
  }

  async generateReport(reportData: FranchiseReportData, termLabel: string): Promise<Blob> {
    await this.ensureFontsLoaded();
    
    this.addHeader(termLabel);
    
    let currentY = 40;

    // Add summary cards
    currentY = this.addSummaryCards(reportData.reportTotals, currentY);

    // Add each class section
    reportData.classes.forEach((classGroup, index) => {
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
