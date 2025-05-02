
import { TableRow, TableCell } from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface TrainerPaymentHistoryRowProps {
  payment: {
    id: string;
    trainer_name: string;
    payment_date: string;
    amount: number;
    payment_method: string;
    transaction_id?: string;
    document_url?: string;
    document_name?: string;
    notes?: string;
  };
  index: number;
}

export function TrainerPaymentHistoryRow({ payment, index }: TrainerPaymentHistoryRowProps) {
  const isEven = index % 2 === 0;
  
  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'bank_transfer': return 'Bank Transfer';
      case 'cash': return 'Cash';
      case 'check': return 'Check';
      default: return method || 'Other';
    }
  };
  
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch (e) {
      return dateStr;
    }
  };
  
  return (
    <TableRow isEven={isEven}>
      <TableCell>{payment.trainer_name}</TableCell>
      <TableCell>{formatDate(payment.payment_date)}</TableCell>
      <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
      <TableCell>{formatPaymentMethod(payment.payment_method)}</TableCell>
      <TableCell>
        {payment.document_url ? (
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 px-2 gap-1"
            onClick={() => window.open(payment.document_url, '_blank')}
          >
            <FileText className="h-4 w-4" />
            View
          </Button>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
      <TableCell>
        <button
          onClick={() => {/* View details */}}
          className="text-blue-600 hover:text-blue-800 text-sm ml-2"
        >
          Details
        </button>
      </TableCell>
    </TableRow>
  );
}
