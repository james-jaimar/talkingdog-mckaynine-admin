
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Invoice } from "@/types/invoice";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash, Mail, CheckCircle, BanIcon } from "lucide-react";
import { useInvoices } from "@/hooks/useInvoices";

interface InvoiceTableActionsProps {
  invoice: Invoice;
}

export function InvoiceTableActions({ invoice }: InvoiceTableActionsProps) {
  const navigate = useNavigate();
  const { deleteInvoice, markAsPaid, markAsSent, cancelInvoice } = useInvoices();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const handleViewInvoice = (id: string) => {
    navigate(`/invoices/${id}`);
  };

  const handleEditInvoice = (id: string) => {
    navigate(`/invoices/${id}/edit`);
  };

  const handleDeleteInvoice = (id: string) => {
    // We just set the ID - the actual deletion is handled by the parent component's dialog
    setSelectedInvoiceId(id);
    return id; // Return ID for parent component to use
  };

  const handleMarkAsPaid = async (id: string) => {
    await markAsPaid.mutateAsync(id);
  };

  const handleMarkAsSent = async (id: string) => {
    await markAsSent.mutateAsync(id);
  };

  const handleCancelInvoice = async (id: string) => {
    await cancelInvoice.mutateAsync(id);
  };

  const handleEmailInvoice = (invoice: Invoice) => {
    // We just return the invoice - the actual email dialog is handled by the parent component
    return invoice;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleViewInvoice(invoice.id)}>
          <Eye className="mr-2 h-4 w-4" />
          View
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleEmailInvoice(invoice)}>
          <Mail className="mr-2 h-4 w-4" />
          Send by Email
        </DropdownMenuItem>
        
        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
          <DropdownMenuItem onClick={() => handleEditInvoice(invoice.id)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        )}
        
        {invoice.status === 'draft' && (
          <DropdownMenuItem onClick={() => handleMarkAsSent(invoice.id)}>
            <Mail className="mr-2 h-4 w-4" />
            Mark as Sent
          </DropdownMenuItem>
        )}
        
        {(invoice.status === 'sent' || invoice.status === 'overdue') && (
          <DropdownMenuItem onClick={() => handleMarkAsPaid(invoice.id)}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark as Paid
          </DropdownMenuItem>
        )}
        
        {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
          <DropdownMenuItem onClick={() => handleCancelInvoice(invoice.id)}>
            <BanIcon className="mr-2 h-4 w-4" />
            Cancel
          </DropdownMenuItem>
        )}
        
        {invoice.status !== 'paid' && (
          <DropdownMenuItem 
            onClick={() => handleDeleteInvoice(invoice.id)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
