
import React, { useMemo } from 'react';
import { formatCurrency } from '@/lib/formatters';
import { Invoice } from '@/hooks/invoices/types';

interface InvoiceSummaryProps {
  invoice: Invoice;
}

export function InvoiceSummary({ invoice }: InvoiceSummaryProps) {
  // Calculate the correct subtotal from invoice items if available
  const calculatedSubtotal = useMemo(() => {
    if (invoice.items && invoice.items.length > 0) {
      return invoice.items.reduce((sum, item) => {
        const itemAmount = item.amount || (item.quantity * item.unit_price);
        return sum + itemAmount;
      }, 0);
    }
    return invoice.subtotal;
  }, [invoice]);

  // Log if there's a discrepancy between stored and calculated subtotal
  // This helps with debugging, but doesn't affect the displayed values
  useMemo(() => {
    if (Math.abs(calculatedSubtotal - invoice.subtotal) > 0.01) {
      console.warn(`Warning: Calculated subtotal (${calculatedSubtotal}) doesn't match invoice subtotal (${invoice.subtotal})`);
    }
  }, [calculatedSubtotal, invoice.subtotal]);
  
  // Format the discount display label
  const renderDiscountLabel = () => {
    if (invoice.discount_type === 'percentage') {
      return (
        <span className="flex items-center">
          Discount <span className="font-medium ml-1">({invoice.original_discount_amount || invoice.discount_amount}%)</span>
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
      
      {(invoice.monetary_discount || invoice.discount_amount > 0) && (
        <div className="flex justify-between text-red-600">
          {renderDiscountLabel()}
          <span className="font-medium">
            -{formatCurrency(invoice.monetary_discount || invoice.discount_amount)}
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
