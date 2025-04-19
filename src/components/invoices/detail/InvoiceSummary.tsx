
import React from 'react';
import { formatCurrency } from '@/lib/formatters';
import { Invoice } from '@/hooks/invoices/types';

interface InvoiceSummaryProps {
  invoice: Invoice;
}

export function InvoiceSummary({ invoice }: InvoiceSummaryProps) {
  // For percentage discounts, we need to correctly display the percentage
  // rather than calculate it from the discount amount
  const displayDiscountValue = () => {
    if (invoice.discount_type === 'percentage' && invoice.discount_amount > 0) {
      // When viewing an invoice with percentage discount, we need to show
      // the stored percentage value, which is in the discount_amount field
      // This is because for percentage discounts:
      // - When stored: discount_amount = actual percentage (e.g., 10 for 10%)
      // - The actual monetary value is calculated during invoice creation/update
      return `(${invoice.discount_amount}%)`;
    }
    return '';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Subtotal:</span>
        <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
      </div>
      
      {invoice.discount_amount > 0 && (
        <div className="flex justify-between text-red-600">
          <span>
            Discount {displayDiscountValue()}:
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
