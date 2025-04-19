
import React from 'react';
import { formatCurrency } from '@/lib/formatters';
import { Invoice } from '@/hooks/invoices/types';

interface InvoiceSummaryProps {
  invoice: Invoice;
}

export function InvoiceSummary({ invoice }: InvoiceSummaryProps) {
  // For percentage discounts, display the original percentage value, not calculated from amount
  // This ensures we show what was entered (e.g., 25%) rather than a derived value
  let discountDisplay = '';
  
  if (invoice.discount_type === 'percentage') {
    // In the database we store the calculated amount, not the percentage
    // So we need to calculate back to get the original percentage
    // But we'll cap it at 100% to prevent unreasonable values
    const calculatedPercentage = Math.min(
      (invoice.discount_amount / invoice.subtotal) * 100, 
      100
    ).toFixed(1);
    discountDisplay = `(${calculatedPercentage}%)`;
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Subtotal:</span>
        <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
      </div>
      
      {invoice.discount_amount > 0 && (
        <div className="flex justify-between text-red-600">
          <span>
            Discount {invoice.discount_type === 'percentage' ? discountDisplay : ''}:
          </span>
          <span className="font-medium">-{formatCurrency(invoice.discount_amount)}</span>
        </div>
      )}
      
      <div className="flex justify-between">
        <span className="text-muted-foreground">Tax ({invoice.tax_rate}%):</span>
        <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
      </div>
      
      <div className="h-px bg-border my-2"></div>
      
      <div className="flex justify-between font-bold">
        <span>Total:</span>
        <span>{formatCurrency(invoice.total)}</span>
      </div>
    </div>
  );
}
