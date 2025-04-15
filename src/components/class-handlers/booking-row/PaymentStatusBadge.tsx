
import { FileText, CheckCircle, AlertTriangle, Ban, Clock } from "lucide-react";
import { ExtendedBadge } from "@/components/ui/badge-variants";
import { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PaymentStatusBadgeProps {
  invoiceData: any;
  isLoadingInvoice: boolean;
}

export function PaymentStatusBadge({ invoiceData, isLoadingInvoice }: PaymentStatusBadgeProps) {
  // Determine payment status display with improved logic
  const paymentStatus = useMemo(() => {
    if (isLoadingInvoice) return { 
      status: 'loading', 
      display: 'Loading...', 
      icon: Clock 
    };
    
    if (!invoiceData) return { 
      status: 'not-invoiced', 
      display: 'Not Invoiced', 
      icon: AlertTriangle 
    };
    
    // Enhanced detection of paid status
    if (invoiceData.isPaid || invoiceData.invoices.payment_received) {
      return { 
        status: 'paid', 
        display: 'Paid', 
        badge: 'success', 
        icon: CheckCircle 
      };
    }
    
    if (invoiceData.invoices.status === 'cancelled') {
      return { 
        status: 'cancelled', 
        display: 'Cancelled', 
        badge: 'destructive', 
        icon: Ban 
      };
    }
    
    if (invoiceData.invoices.status === 'sent') {
      return { 
        status: 'invoiced', 
        display: 'Invoice Sent', 
        badge: 'warning', 
        icon: FileText 
      };
    }
    
    return { 
      status: 'pending', 
      display: 'Pending Payment', 
      badge: 'secondary', 
      icon: Clock 
    };
  }, [invoiceData, isLoadingInvoice]);

  // Get badge variant based on payment status
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'cancelled': return 'destructive';
      case 'invoiced': return 'warning';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  if (isLoadingInvoice) {
    return <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>;
  }

  const Icon = paymentStatus.icon || FileText;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center">
            <Icon className="h-4 w-4 mr-1.5 text-gray-500" />
            <ExtendedBadge variant={getBadgeVariant(paymentStatus.status) as any} className="font-normal">
              {paymentStatus.display}
            </ExtendedBadge>
          </div>
        </TooltipTrigger>
        {invoiceData && invoiceData.invoices && (
          <TooltipContent>
            <p>Invoice: {invoiceData.invoices.invoice_number || 'Unknown'}</p>
            <p>Status: {paymentStatus.display}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
