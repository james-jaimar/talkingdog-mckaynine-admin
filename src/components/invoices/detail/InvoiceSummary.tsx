
import React from 'react';
import { formatCurrency } from '@/lib/formatters';
import { Invoice } from '@/hooks/invoices/types';
import { calculateInvoiceTotals } from "@/lib/invoiceMath";

interface InvoiceSummaryProps {
  invoice: Invoice;
}

export function InvoiceSummary({ invoice }: InvoiceSummaryProps) {
  // Calculate totals using canonical helper
  const itemsInput = (invoice.items || []).map(item => ({
    quantity: item.quantity,
    unit_price: item.unit_price,
  }));

  const {
    subtotal,
    monetaryDiscount,
    discountType,
    discountAmount,
    taxRate,
    tax,
    total,
  } = calculateInvoiceTotals({
    items: itemsInput,
    discountType: invoice.discount_type as "fixed" | "percentage",
    discountAmount: invoice.discount_type === "percentage"
      ? invoice.original_discount_amount ?? invoice.discount_amount
      : invoice.discount_amount,
    taxRate: invoice.tax_rate,
  });

  // Label: Show (N%) or (Fixed)
  const renderDiscountLabel = () => {
    if (discountType === 'percentage') {
      return (
        <span className="flex items-center">
          Discount <span className="font-medium ml-1">({discountAmount}%)</span>
        </span>
      );
    }
    return <span>Discount (Fixed)</span>;
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Subtotal:</span>
        <span className="font-medium">{formatCurrency(subtotal)}</span>
      </div>
      
      {monetaryDiscount > 0 && (
        <div className="flex justify-between text-red-600">
          {renderDiscountLabel()}
          <span className="font-medium">
            -{formatCurrency(monetaryDiscount)}
          </span>
        </div>
      )}
      
      <div className="flex justify-between">
        <span className="text-muted-foreground">Tax ({taxRate}%):</span>
        <span className="font-medium">{formatCurrency(tax)}</span>
      </div>
      
      <div className="h-px bg-border my-2"></div>
      
      <div className="flex justify-between font-bold">
        <span>Total:</span>
        <span>{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
