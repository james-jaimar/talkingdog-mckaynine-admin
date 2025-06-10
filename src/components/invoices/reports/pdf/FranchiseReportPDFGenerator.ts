
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
  private margin: number = 20;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
  }

  private formatCurrency(amount: number): string {
    return `R ${amount.toFixed(2)}`;
  }

  private addHeader(termLabel: string) {
    // Company header
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('McKaynine Training Centre', this.margin, 25);

    this.doc.setFontSize(16);
    this.doc.text('Franchise Classes Report', this.margin, 35);

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Term: ${termLabel}`, this.margin, 45);
    this.doc.text(`Generated: ${new Date().toLocaleDateString()}`, this.margin, 52);

    // Add a line separator
    this.doc.line(this.margin, 58, this.pageWidth - this.margin, 58);
  }

  private addSummaryCards(reportTotals: any, startY: number): number {
    const cardWidth = (this.pageWidth - 60) / 4;
    const cardHeight = 25;
    let currentY = startY + 10;

    const cards = [
      { title: 'Total Revenue', value: this.formatCurrency(reportTotals.totalRevenue), color: [59, 130, 246] },
      { title: 'Franchise Fees', value: this.formatCurrency(reportTotals.totalFranchiseFees), color: [34, 197, 94] },
      { title: 'Admin Fees', value: this.formatCurrency(reportTotals.totalAdminFees), color: [249, 115, 22] },
      { title: 'McKaynine Commission', value: this.formatCurrency(reportTotals.totalMckaynineCommission), color: [168, 85, 247] }
    ];

    cards.forEach((card, index) => {
      const x = this.margin + (index * (cardWidth + 5));
      
      // Card background
      this.doc.setFillColor(card.color[0], card.color[1], card.color[2]);
      this.doc.setDrawColor(200, 200, 200);
      this.doc.rect(x, currentY, cardWidth, cardHeight, 'FD');
      
      // Card text
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(card.title, x + 3, currentY + 8);
      
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(card.value, x + 3, currentY + 18);
    });

    this.doc.setTextColor(0, 0, 0); // Reset text color
    return currentY + cardHeight + 15;
  }

  private addClassSection(classGroup: any, startY: number): number {
    let currentY = startY + 10;

    // Class header with blue background
    this.doc.setFillColor(239, 246, 255);
    this.doc.setDrawColor(59, 130, 246);
    this.doc.rect(this.margin, currentY - 5, this.pageWidth - 40, 20, 'FD');
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(30, 64, 175);
    this.doc.text(`${classGroup.className} (${classGroup.classType})`, this.margin + 5, currentY + 5);
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Course Fee: ${this.formatCurrency(classGroup.courseFee)} • ${classGroup.handlers.length} handlers`, this.margin + 5, currentY + 12);
    
    this.doc.setTextColor(0, 0, 0); // Reset text color
    currentY += 25;

    // Handlers table
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
        cellPadding: 3
      },
      headStyles: { 
        fillColor: [240, 240, 240], 
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      columnStyles: {
        1: { cellWidth: 25 },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' }
      },
      alternateRowStyles: { fillColor: [249, 249, 249] }
    });

    currentY = (this.doc as any).lastAutoTable.finalY + 5;

    // Class totals in a small table
    const totalsData = [
      ['Revenue:', this.formatCurrency(classGroup.classTotals.totalRevenue)],
      ['Franchise:', this.formatCurrency(classGroup.classTotals.totalFranchiseFees)],
      ['Admin:', this.formatCurrency(classGroup.classTotals.totalAdminFees)],
      ['Commission:', this.formatCurrency(classGroup.classTotals.totalMckaynineCommission)]
    ];

    this.doc.autoTable({
      startY: currentY + 5,
      body: totalsData,
      margin: { left: this.pageWidth * 0.6, right: this.margin },
      styles: { 
        fontSize: 9,
        cellPadding: 2
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 25 },
        1: { halign: 'right', fontStyle: 'bold', cellWidth: 25 }
      },
      theme: 'grid'
    });

    return (this.doc as any).lastAutoTable.finalY + 15;
  }

  async generateReport(reportData: FranchiseReportData, termLabel: string): Promise<Blob> {
    this.addHeader(termLabel);
    
    let currentY = 70;

    // Add summary cards
    currentY = this.addSummaryCards(reportData.reportTotals, currentY);

    // Add each class section
    reportData.classes.forEach((classGroup, index) => {
      // Check if we need a new page
      if (currentY > 220) {
        this.doc.addPage();
        currentY = 20;
      }

      currentY = this.addClassSection(classGroup, currentY);
    });

    // Convert to blob
    const pdfOutput = this.doc.output('blob');
    return pdfOutput;
  }
}
