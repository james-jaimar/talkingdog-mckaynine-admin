
import React, { useEffect } from 'react';
import { formatCurrency } from '@/lib/formatters';
import { Invoice } from '@/hooks/invoices/types';
import { calculateInvoiceTotals } from "@/lib/invoiceMath";

interface InvoiceSummaryProps {
  invoice: Invoice;
}

export function InvoiceSummary({ invoice }: InvoiceSummaryProps) {
  // Log the raw invoice received
  useEffect(() => {
    console.log("InvoiceSummary received invoice:", {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      items: invoice.items?.length || 0,
      discount_type: invoice.discount_type,
      discount_amount: invoice.discount_amount,
      original_discount_amount: invoice.original_discount_amount,
      monetary_discount: invoice.monetary_discount,
      subtotal: invoice.subtotal,
      tax_rate: invoice.tax_rate,
      tax_amount: invoice.tax_amount,
      total: invoice.total
    });
  }, [invoice]);

  // Calculate totals using canonical helper
  const itemsInput = (invoice.items || []).map(item => ({
    quantity: item.quantity,
    unit_price: item.unit_price,
  }));

  // Use the appropriate discount amount based on the discount type
  const discountAmountToUse = invoice.discount_type === "percentage" 
    ? invoice.original_discount_amount ?? invoice.discount_amount 
    : invoice.discount_amount;

  const totals = calculateInvoiceTotals({
    items: itemsInput,
    discountType: invoice.discount_type as "fixed" | "percentage",
    discountAmount: discountAmountToUse || 0,
    taxRate: invoice.tax_rate || 0,
  });

  // Log the calculated results for comparison
  useEffect(() => {
    console.log("InvoiceSummary calculated totals:", totals);
    
    // Check if our calculation matches the saved invoice total
    if (Math.abs(totals.total - invoice.total) > 0.01) {
      console.warn(`Warning: Calculated total (${totals.total}) differs from saved invoice total (${invoice.total})`);
    }
  }, [totals, invoice.total]);

  // Label: Show (N%) or (Fixed) 
  const renderDiscountLabel = () => {
    if (totals.discountType === 'percentage') {
      return (
        <span className="flex items-center">
          Discount <span className="font-medium ml-1">({totals.discountAmount}%)</span>
        </span>
      );
    }
    return <span>Discount (Fixed)</span>;
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Subtotal:</span>
        <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
      </div>
      
      {totals.monetaryDiscount > 0 && (
        <div className="flex justify-between text-red-600">
          {renderDiscountLabel()}
          <span className="font-medium">
            -{formatCurrency(totals.monetaryDiscount)}
          </span>
        </div>
      )}
      
      <div className="flex justify-between">
        <span className="text-muted-foreground">Tax ({totals.taxRate}%):</span>
        <span className="font-medium">{formatCurrency(totals.tax)}</span>
      </div>
      
      <div className="h-px bg-border my-2"></div>
      
      <div className="flex justify-between font-bold">
        <span>Total:</span>
        <span>{formatCurrency(totals.total)}</span>
      </div>
    </div>
  );
}
