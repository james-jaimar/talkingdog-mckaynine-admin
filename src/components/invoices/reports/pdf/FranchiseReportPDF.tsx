
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { FranchiseReportData } from '@/hooks/useFranchiseClassesData';
import { addEmbeddedFonts, setFont } from '../../pdf/utils/embeddedFonts';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
  }
}

export class FranchiseReportPDF {
  private doc: jsPDF;
  private pageWidth: number;
  private margin: number = 20;
  private fontsLoaded: boolean = false;

  constructor() {
    this.doc = new jsPDF({ 
      orientation: 'p', 
      unit: 'mm', 
      format: 'a4',
      compress: true,
      putOnlyUsedFonts: true
    });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
  }

  private async ensureFontsLoaded(): Promise<void> {
    if (!this.fontsLoaded) {
      await addEmbeddedFonts(this.doc);
      this.fontsLoaded = true;
    }
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  }

  private addHeader(termLabel: string) {
    // Company header
    this.doc.setFontSize(20);
    setFont(this.doc, 'bold');
    this.doc.text('McKaynine Training Centre', this.margin, 25);

    this.doc.setFontSize(16);
    this.doc.text('Franchise Classes Report', this.margin, 35);

    this.doc.setFontSize(12);
    setFont(this.doc, 'normal');
    this.doc.text(`Term: ${termLabel}`, this.margin, 45);
    this.doc.text(`Generated: ${new Date().toLocaleDateString()}`, this.margin, 52);

    // Add a line separator
    this.doc.line(this.margin, 58, this.pageWidth - this.margin, 58);
  }

  private addClassSection(classGroup: any, startY: number): number {
    let currentY = startY + 10;

    // Class header
    this.doc.setFontSize(14);
    setFont(this.doc, 'bold');
    this.doc.text(`${classGroup.className} (${classGroup.classType})`, this.margin, currentY);
    
    this.doc.setFontSize(10);
    setFont(this.doc, 'normal');
    this.doc.text(`Course Fee: ${this.formatCurrency(classGroup.courseFee)}`, this.margin, currentY + 6);
    
    currentY += 15;

    // Handlers table
    const tableData = classGroup.handlers.map((handler: any) => [
      handler.clientName,
      `${handler.dogName} (${handler.dogBreed})`,
      `${handler.attendanceCount}/${handler.totalClasses}`,
      handler.paymentStatus,
      this.formatCurrency(handler.invoiceAmount),
      this.formatCurrency(handler.franchiseFee),
      this.formatCurrency(handler.adminFee),
      this.formatCurrency(handler.mckaynineCommission)
    ]);

    this.doc.autoTable({
      startY: currentY,
      head: [['Handler', 'Dog', 'Attendance', 'Payment', 'Price', 'Franchise Fee', 'Admin Fee', 'McKaynine Commission']],
      body: tableData,
      margin: { left: this.margin, right: this.margin },
      styles: { fontSize: 8, font: 'Roboto' },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
      columnStyles: {
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' }
      }
    });

    currentY = (this.doc as any).lastAutoTable.finalY + 5;

    // Class totals
    this.doc.setFontSize(10);
    setFont(this.doc, 'bold');
    
    const totalsY = currentY + 5;
    this.doc.text('Class Totals:', this.margin, totalsY);
    
    const totalsData = [
      ['Total Revenue', this.formatCurrency(classGroup.classTotals.totalRevenue)],
      ['Franchise Fees', this.formatCurrency(classGroup.classTotals.totalFranchiseFees)],
      ['Admin Fees', this.formatCurrency(classGroup.classTotals.totalAdminFees)],
      ['McKaynine Commission', this.formatCurrency(classGroup.classTotals.totalMckaynineCommission)]
    ];

    this.doc.autoTable({
      startY: totalsY + 5,
      body: totalsData,
      margin: { left: this.pageWidth * 0.6, right: this.margin },
      styles: { fontSize: 9, font: 'Roboto' },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right', fontStyle: 'bold' }
      },
      theme: 'plain'
    });

    return (this.doc as any).lastAutoTable.finalY + 15;
  }

  private addReportSummary(reportTotals: any, startY: number) {
    // Add summary section
    this.doc.setFontSize(16);
    setFont(this.doc, 'bold');
    this.doc.text('Report Summary', this.margin, startY);

    const summaryData = [
      ['Total Handlers', reportTotals.totalHandlers.toString()],
      ['Total Revenue', this.formatCurrency(reportTotals.totalRevenue)],
      ['Total Franchise Fees', this.formatCurrency(reportTotals.totalFranchiseFees)],
      ['Total Admin Fees', this.formatCurrency(reportTotals.totalAdminFees)],
      ['Total McKaynine Commission', this.formatCurrency(reportTotals.totalMckaynineCommission)]
    ];

    this.doc.autoTable({
      startY: startY + 10,
      body: summaryData,
      margin: { left: this.margin, right: this.margin },
      styles: { 
        fontSize: 12,
        fillColor: [245, 245, 245],
        font: 'Roboto'
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right', fontStyle: 'bold' }
      }
    });
  }

  async generateReport(reportData: FranchiseReportData, termLabel: string): Promise<Blob> {
    // Ensure fonts are loaded before generating
    await this.ensureFontsLoaded();
    
    this.addHeader(termLabel);
    
    let currentY = 70;

    // Add each class section
    reportData.classes.forEach((classGroup, index) => {
      // Check if we need a new page
      if (currentY > 250) {
        this.doc.addPage();
        currentY = 20;
      }

      currentY = this.addClassSection(classGroup, currentY);
    });

    // Add report summary
    if (currentY > 200) {
      this.doc.addPage();
      currentY = 20;
    }
    
    this.addReportSummary(reportData.reportTotals, currentY);

    // Convert to blob
    const pdfOutput = this.doc.output('blob');
    return pdfOutput;
  }
}
