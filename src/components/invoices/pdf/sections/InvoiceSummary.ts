
import { Invoice } from '@/hooks/invoices/types';
import { formatCurrency } from '@/lib/formatters';

export function addInvoiceSummary(doc: any, invoice: Invoice, startY: number): number {
  const { subtotal, tax_rate, tax_amount, total, monetary_discount, discount_type, original_discount_amount, discount_amount } = invoice;
  
  // Calculate positions - align with the rightmost column of the items table
  const pageWidth = doc.internal.pageSize.getWidth();
  const rightEdge = pageWidth - 14; // Align with table's right edge
  const labelX = rightEdge - 80; // Labels start position
  const valueX = rightEdge - 14; // Values end position
  
  let currentY = startY + 5;
  
  // Add horizontal line before summary
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(labelX - 20, currentY, rightEdge, currentY);
  currentY += 8;
  
  // Subtotal
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.text('Subtotal:', labelX, currentY);
  doc.text(formatCurrency(subtotal), valueX, currentY, { align: 'right' });
  currentY += 6;
  
  // Discount (if applicable)
  if (monetary_discount && monetary_discount > 0) {
    const discountLabel = discount_type === 'percentage'
      ? `Discount (${original_discount_amount || discount_amount}%):`
      : 'Discount:';
    
    doc.text(discountLabel, labelX, currentY);
    doc.text(`-${formatCurrency(monetary_discount)}`, valueX, currentY, { align: 'right' });
    currentY += 6;
  }
  
  // Tax
  doc.text(`Tax (${tax_rate}%):`, labelX, currentY);
  doc.text(formatCurrency(tax_amount), valueX, currentY, { align: 'right' });
  currentY += 8;
  
  // Line before total
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(labelX - 20, currentY, rightEdge, currentY);
  currentY += 8;
  
  // Total
  doc.setFont(undefined, 'bold');
  doc.text('Total:', labelX, currentY);
  doc.text(formatCurrency(total), valueX, currentY, { align: 'right' });
  
  return currentY + 10;
}
