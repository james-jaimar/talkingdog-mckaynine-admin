
import { useState } from "react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { Invoice } from "@/types/invoice";
import { useDeleteInvoice } from "@/hooks/useInvoices";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { InvoiceBasicActions } from "./actions/InvoiceBasicActions";
import { InvoiceStatusActions } from "./actions/InvoiceStatusActions";
import { InvoiceAdvancedActions } from "./actions/InvoiceAdvancedActions";

interface InvoiceTableActionsProps {
  invoice: Invoice;
  onOpenTransferDialog?: (invoice: Invoice) => void;
}

export function InvoiceTableActions({ invoice, onOpenTransferDialog }: InvoiceTableActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const deleteInvoice = useDeleteInvoice();
  const isPending = deleteInvoice.isPending;

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false);
    deleteInvoice.mutate(invoice.id);
  };

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-popover">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          
          <InvoiceBasicActions 
            invoice={invoice}
            isPending={isPending}
            onCloseDropdown={() => setDropdownOpen(false)}
          />
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Status Actions</DropdownMenuLabel>
          
          <InvoiceStatusActions 
            invoice={invoice}
            isPending={isPending}
            onCloseDropdown={() => setDropdownOpen(false)}
          />
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Advanced</DropdownMenuLabel>
          
          <InvoiceAdvancedActions 
            invoice={invoice}
            isPending={isPending}
            onCloseDropdown={() => setDropdownOpen(false)}
            onOpenTransferDialog={onOpenTransferDialog}
            onOpenDeleteDialog={() => setDeleteDialogOpen(true)}
          />
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
