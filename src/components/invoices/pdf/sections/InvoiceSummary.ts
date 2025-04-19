
import { Invoice } from '@/hooks/invoices/types';
import { formatCurrency } from '@/lib/formatters';

export function addInvoiceSummary(doc: any, invoice: Invoice, startY: number): number {
  const { subtotal, tax_rate, tax_amount, discount_amount, discount_type, total, original_discount_percentage } = invoice;
  const columnPositions = {
    label: 120,
    value: 170
  };
  
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
  currentY += 5;
  
  // Subtotal
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.text('Subtotal:', labelX, currentY);
  doc.text(formatCurrency(subtotal), valueX, currentY, { align: 'right' });
  currentY += 6;
  
  // Discount (if applicable)
  if (discount_amount > 0) {
    // Get the correct percentage display for percentage discounts
    let discountLabel = 'Discount:';
    
    if (discount_type === 'percentage') {
      // Use the original percentage if available, otherwise calculate an approximation
      const displayPercentage = original_discount_percentage || 
        Math.min((discount_amount / subtotal * 100), 100).toFixed(1);
      discountLabel = `Discount (${displayPercentage}%):`;
    }
      
    doc.setTextColor(220, 53, 69); // Red color for discount
    doc.text(discountLabel, labelX, currentY);
    doc.text(`-${formatCurrency(discount_amount)}`, valueX, currentY, { align: 'right' });
    doc.setTextColor(0, 0, 0); // Reset to black
    currentY += 6;
  }
  
  // Tax
  doc.text(`Tax (${tax_rate}%):`, labelX, currentY);
  doc.text(formatCurrency(tax_amount), valueX, currentY, { align: 'right' });
  currentY += 6;
  
  // Line before total
  doc.setLineWidth(0.1);
  doc.line(labelX - 10, currentY, valueX + 30, currentY);
  currentY += 4;
  
  // Total
  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.text('Total:', labelX, currentY + 2);
  doc.text(formatCurrency(total), valueX, currentY + 2, { align: 'right' });
  
  return currentY + 10;
}
