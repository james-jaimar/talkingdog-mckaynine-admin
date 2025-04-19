
import { Invoice } from '@/hooks/invoices/types';
import { formatCurrency } from '@/lib/formatters';

export function addInvoiceSummary(doc: any, invoice: Invoice, startY: number): number {
  const { subtotal, tax_rate, tax_amount, total, monetary_discount, discount_type, original_discount_amount, discount_amount } = invoice;
  
  // Calculate available width
  const pageWidth = doc.internal.pageSize.getWidth();
  const rightColumnWidth = 60;
  
  // Calculate positions
  const labelX = pageWidth - rightColumnWidth - 50;
  const valueX = pageWidth - rightColumnWidth;
  
  let currentY = startY + 10;
  
  // Line before summary
  doc.setLineWidth(0.1);
  doc.line(labelX - 10, currentY - 5, valueX + 30, currentY - 5);
  currentY += 10;  // Increased spacing
  
  // Subtotal
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.text('Subtotal:', labelX, currentY);
  doc.text(formatCurrency(subtotal), valueX, currentY, { align: 'right' });
  currentY += 8;  // Slightly reduced vertical spacing
  
  // Discount (if applicable)
  if (monetary_discount > 0) {
    // Format the discount label based on type
    const discountLabel = discount_type === 'percentage'
      ? `Discount (${original_discount_amount || discount_amount}%):`
      : 'Discount:';
    
    doc.setTextColor(220, 53, 69); // Red color for discount
    doc.text(discountLabel, labelX, currentY);
    doc.text(`-${formatCurrency(monetary_discount)}`, valueX, currentY, { align: 'right' });
    doc.setTextColor(0, 0, 0); // Reset to black
    currentY += 8;
  }
  
  // Tax
  doc.text(`Tax (${tax_rate}%):`, labelX, currentY);
  doc.text(formatCurrency(tax_amount), valueX, currentY, { align: 'right' });
  currentY += 10;  // Increased spacing
  
  // Line before total
  doc.setLineWidth(0.1);
  doc.line(labelX - 10, currentY, valueX + 30, currentY);
  currentY += 6;
  
  // Total
  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.text('Total:', labelX, currentY + 2);
  doc.text(formatCurrency(total), valueX, currentY + 2, { align: 'right' });
  
  return currentY + 10;
}
