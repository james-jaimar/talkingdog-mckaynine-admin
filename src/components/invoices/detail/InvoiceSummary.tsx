
import React from 'react';
import { formatCurrency } from '@/lib/formatters';
import { Invoice } from '@/hooks/invoices/types';

interface InvoiceSummaryProps {
  invoice: Invoice;
}

export function InvoiceSummary({ invoice }: InvoiceSummaryProps) {
  // For percentage discounts, we need to show the original percentage value
  let discountDisplay = '';
  
  if (invoice.discount_type === 'percentage') {
    // Calculate percentage from amount relative to subtotal
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
