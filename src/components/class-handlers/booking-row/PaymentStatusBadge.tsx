
import { FileText } from "lucide-react";
import { ExtendedBadge } from "@/components/ui/badge-variants";
import { useMemo } from "react";

interface PaymentStatusBadgeProps {
  invoiceData: any;
  isLoadingInvoice: boolean;
}

export function PaymentStatusBadge({ invoiceData, isLoadingInvoice }: PaymentStatusBadgeProps) {
  // Determine payment status display
  const paymentStatus = useMemo(() => {
    if (isLoadingInvoice) return { status: 'loading', display: 'Loading...' };
    
    if (!invoiceData) return { status: 'not-invoiced', display: 'Not Invoiced' };
    
    const invoice = invoiceData.invoices;
    
    if (invoice.payment_received) return { status: 'paid', display: 'Paid', badge: 'success' };
    
    if (invoice.status === 'cancelled') return { status: 'cancelled', display: 'Cancelled', badge: 'destructive' };
    
    if (invoice.status === 'sent') return { status: 'invoiced', display: 'Invoice Sent', badge: 'warning' };
    
    return { status: 'pending', display: 'Pending Payment', badge: 'secondary' };
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

  return (
    <div className="flex items-center">
      {invoiceData && (
        <FileText className="h-4 w-4 mr-1.5 text-gray-500" />
      )}
      <ExtendedBadge variant={getBadgeVariant(paymentStatus.status) as any} className="font-normal">
        {paymentStatus.display}
      </ExtendedBadge>
    </div>
  );
}
