
import { TableRow, TableCell } from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { FileText, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

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
  onViewDetails?: (paymentId: string) => void;
}

export function TrainerPaymentHistoryRow({ payment, index, onViewDetails }: TrainerPaymentHistoryRowProps) {
  const isEven = index % 2 === 0;
  const navigate = useNavigate();
  const [isCheckingDocument, setIsCheckingDocument] = useState(false);
  
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

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(payment.id);
    }
  };
  
  const handleViewDocument = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click from triggering
    
    if (!payment.document_url) {
      toast.error("No document available");
      return;
    }
    
    setIsCheckingDocument(true);
    
    try {
      // Open document in new tab
      window.open(payment.document_url, '_blank', 'noopener,noreferrer');
      
      // Briefly wait to ensure the new tab has time to open
      setTimeout(() => {
        setIsCheckingDocument(false);
      }, 500);
    } catch (error) {
      console.error("Error opening document:", error);
      toast.error("Could not open document. The document might be private or not accessible.");
      setIsCheckingDocument(false);
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
            onClick={handleViewDocument}
            aria-label="View payment document"
            disabled={isCheckingDocument}
          >
            <FileText className="h-4 w-4" />
            View
          </Button>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={handleViewDetails}
          aria-label="View payment details"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
