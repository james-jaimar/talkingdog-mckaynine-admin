
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash, 
  Send, 
  Ban, 
  Check, 
  ArrowUpDown,
  FileSpreadsheet
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Invoice } from "@/types/invoice";
import { useDeleteInvoice, useMarkInvoiceAsPaid, useMarkInvoiceAsSent, useCancelInvoice } from "@/hooks/useInvoices";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface InvoiceTableActionsProps {
  invoice: Invoice;
  onOpenTransferDialog?: (invoice: Invoice) => void;
}

export function InvoiceTableActions({ invoice, onOpenTransferDialog }: InvoiceTableActionsProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Mutations
  const deleteInvoice = useDeleteInvoice();
  const markAsPaid = useMarkInvoiceAsPaid();
  const markAsSent = useMarkInvoiceAsSent();
  const cancelInvoice = useCancelInvoice();

  const handleView = () => navigate(`/invoices/${invoice.id}`);
  const handleEdit = () => navigate(`/invoices/${invoice.id}/edit`);
  
  const handleMarkAsPaid = () => {
    if (invoice.status !== 'paid') {
      markAsPaid.mutate(invoice.id, {
        onSuccess: () => {
          toast({
            title: "Invoice marked as paid",
            description: `Invoice ${invoice.invoice_number} has been marked as paid.`,
          });
        }
      });
    }
  };

  const handleMarkAsSent = () => {
    if (invoice.status !== 'sent' && invoice.status !== 'paid') {
      markAsSent.mutate(invoice.id, {
        onSuccess: () => {
          toast({
            title: "Invoice marked as sent",
            description: `Invoice ${invoice.invoice_number} status updated to sent.`,
          });
        }
      });
    }
  };

  const handleCancel = () => {
    if (invoice.status !== 'cancelled') {
      cancelInvoice.mutate(invoice.id, {
        onSuccess: () => {
          toast({
            title: "Invoice cancelled",
            description: `Invoice ${invoice.invoice_number} has been cancelled.`,
          });
        }
      });
    }
  };

  const handleDeleteConfirm = () => {
    deleteInvoice.mutate(invoice.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        toast({
          title: "Invoice deleted",
          description: `Invoice ${invoice.invoice_number} has been deleted.`,
        });
      }
    });
  };

  const handleTransfer = () => {
    if (onOpenTransferDialog) {
      onOpenTransferDialog(invoice);
    }
  };

  const isPending = 
    markAsPaid.isPending || 
    markAsSent.isPending || 
    cancelInvoice.isPending || 
    deleteInvoice.isPending;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleView} disabled={isPending}>
            <Eye className="mr-2 h-4 w-4" /> View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEdit} disabled={isPending || invoice.status === 'paid'}>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Status Actions</DropdownMenuLabel>
          
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
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Advanced</DropdownMenuLabel>
          
          <DropdownMenuItem 
            onClick={handleTransfer}
            disabled={isPending || !onOpenTransferDialog}
            className={onOpenTransferDialog ? '' : 'opacity-50'}
          >
            <ArrowUpDown className="mr-2 h-4 w-4" /> Transfer Invoice
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isPending}
            className="text-red-600 focus:text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" /> Delete Invoice
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete invoice {invoice.invoice_number}
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteInvoice.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={deleteInvoice.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteInvoice.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
