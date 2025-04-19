
import React from 'react';
import { formatCurrency } from '@/lib/formatters';
import { Invoice } from '@/hooks/invoices/types';

interface InvoiceSummaryProps {
  invoice: Invoice;
}

export function InvoiceSummary({ invoice }: InvoiceSummaryProps) {
  // Format the discount display label
  const renderDiscountLabel = () => {
    if (invoice.discount_type === 'percentage') {
      return (
        <span className="flex items-center">
          Discount <span className="font-medium ml-1">({invoice.original_discount_amount}%)</span>
        </span>
      );
    }
    return <span>Discount (Fixed)</span>;
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Subtotal:</span>
        <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
      </div>
      
      {invoice.monetary_discount > 0 && (
        <div className="flex justify-between text-red-600">
          {renderDiscountLabel()}
          <span className="font-medium">
            -{formatCurrency(invoice.monetary_discount)}
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
