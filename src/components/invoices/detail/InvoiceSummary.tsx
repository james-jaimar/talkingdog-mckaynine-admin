
import React from 'react';
import { formatCurrency } from '@/lib/formatters';
import { Invoice } from '@/hooks/invoices/types';

interface InvoiceSummaryProps {
  invoice: Invoice;
}

export function InvoiceSummary({ invoice }: InvoiceSummaryProps) {
  // Calculate the actual monetary discount amount
  const calculateDiscountAmount = () => {
    if (invoice.discount_type === 'percentage') {
      return (invoice.subtotal * invoice.discount_amount / 100);
    }
    return invoice.discount_amount;
  };
  
  // Format the discount display label with percentage or fixed amount indicator
  const formatDiscountLabel = () => {
    if (invoice.discount_type === 'percentage') {
      return (
        <span>
          Discount <span className="font-medium">({invoice.discount_amount}%)</span>:
        </span>
      );
    }
    return <span>Discount (Fixed):</span>;
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Subtotal:</span>
        <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
      </div>
      
      {invoice.discount_amount > 0 && (
        <div className="flex justify-between text-red-600">
          {formatDiscountLabel()}
          <span className="font-medium">
            -{formatCurrency(calculateDiscountAmount())}
          </span>
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
