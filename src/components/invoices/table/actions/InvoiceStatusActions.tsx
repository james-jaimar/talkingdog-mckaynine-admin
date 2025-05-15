
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Check, Send, Ban } from "lucide-react";
import { Invoice, InvoiceStatus } from "@/hooks/invoices/types";
import { 
  useMarkInvoiceAsPaid, 
  useMarkInvoiceAsSent, 
  useCancelInvoice 
} from "@/hooks/invoices/status";

interface InvoiceStatusActionsProps {
  invoice: Invoice;
  isPending: boolean;
  onCloseDropdown: () => void;
}

export function InvoiceStatusActions({ invoice, isPending, onCloseDropdown }: InvoiceStatusActionsProps) {
  const markAsPaidMutation = useMarkInvoiceAsPaid();
  const markAsSentMutation = useMarkInvoiceAsSent();
  const cancelInvoiceMutation = useCancelInvoice();

  const handleMarkAsPaid = async () => {
    onCloseDropdown();
    if (invoice.status !== 'paid') {
      await markAsPaidMutation.markAsPaid(invoice);
    }
  };

  const handleMarkAsSent = async () => {
    onCloseDropdown();
    if (invoice.status !== 'sent' && invoice.status !== 'paid') {
      await markAsSentMutation.markAsSent(invoice);
    }
  };

  const handleCancel = async () => {
    onCloseDropdown();
    if (invoice.status !== 'cancelled') {
      await cancelInvoiceMutation.cancelInvoice(invoice);
    }
  };

  return (
    <>
      <DropdownMenuItem 
        onClick={handleMarkAsPaid}
        disabled={isPending || invoice.status === 'paid' || invoice.status === 'cancelled'}
      >
        <Check className="mr-2 h-4 w-4 text-green-600" /> Mark as Paid
      </DropdownMenuItem>
      
      <DropdownMenuItem 
        onClick={handleMarkAsSent}
        disabled={isPending || invoice.status === 'sent' || invoice.status === 'paid' || invoice.status === 'cancelled'}
      >
        <Send className="mr-2 h-4 w-4 text-blue-600" /> Mark as Sent
      </DropdownMenuItem>
      
      <DropdownMenuItem 
        onClick={handleCancel}
        disabled={isPending || invoice.status === 'cancelled' || invoice.status === 'paid'}
      >
        <Ban className="mr-2 h-4 w-4 text-red-600" /> Cancel Invoice
      </DropdownMenuItem>
    </>
  );
}
