
import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";

interface PaymentTrackerProps {
  step?: 'processing' | 'pdf' | 'email' | 'database' | 'complete';
  sendEmail?: boolean;
  selectedCount?: number;
  totalCount?: number;
  amount?: number;
}

export function PaymentTracker({ 
  step = 'processing', 
  sendEmail = false,
  selectedCount = 0,
  totalCount = 0,
  amount = 0
}: PaymentTrackerProps) {
  // Show payment summary information
  return (
    <div className="bg-slate-50 p-4 rounded-md border my-4">
      <div className="flex flex-col sm:flex-row justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium text-slate-700">Selected</h3>
          <p className="text-xl font-semibold">{selectedCount} of {totalCount} classes</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-700">Total Amount</h3>
          <p className="text-xl font-semibold text-green-600">{formatCurrency(amount)}</p>
        </div>
      </div>
    </div>
  );
}

// Helper to determine step ordering for comparison
function getStepValue(step: string): number {
  const order = {
    'processing': 1,
    'pdf': 2,
    'email': 3,
    'database': 4,
    'complete': 5,
  };
  return order[step as keyof typeof order] || 0;
}
