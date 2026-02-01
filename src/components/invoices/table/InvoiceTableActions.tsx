
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
import { EmailInvoiceProgressDialog } from "@/components/invoices/dialogs/EmailInvoiceProgressDialog";
import { EmailInvoicePreviewDialog } from "@/components/invoices/dialogs/EmailInvoicePreviewDialog";
import { toast } from "sonner";

interface InvoiceTableActionsProps {
  invoice: Invoice;
  onOpenTransferDialog?: (invoice: Invoice) => void;
}

export function InvoiceTableActions({ invoice, onOpenTransferDialog }: InvoiceTableActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Email Invoice workflow state - lifted here so dialogs survive dropdown close
  const [emailProgressOpen, setEmailProgressOpen] = useState(false);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [preparedPdfBase64, setPreparedPdfBase64] = useState<string | undefined>(undefined);
  const [selectedInvoiceForEmail, setSelectedInvoiceForEmail] = useState<Invoice | null>(null);
  
  const deleteInvoice = useDeleteInvoice();
  const isPending = deleteInvoice.isPending;

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false);
    deleteInvoice.mutate(invoice.id);
  };

  // Handler for when user clicks "Email Invoice" in the dropdown
  const handleEmailInvoice = (inv: Invoice) => {
    console.log('[InvoiceTableActions] Email Invoice clicked for:', inv.invoice_number);
    setDropdownOpen(false);
    setSelectedInvoiceForEmail(inv);
    setPreparedPdfBase64(undefined);
    setEmailPreviewOpen(false);
    // Defer opening to next tick so dropdown close doesn't interfere
    setTimeout(() => {
      console.log('[InvoiceTableActions] Opening progress dialog');
      setEmailProgressOpen(true);
    }, 0);
  };

  // Handler for when PDF is ready from the progress dialog
  const handlePdfReady = (pdfBase64: string | undefined) => {
    console.log('[InvoiceTableActions] PDF ready, transitioning to preview...');
    setPreparedPdfBase64(pdfBase64);
    setEmailProgressOpen(false);
    // Small delay to ensure state clears before opening new dialog
    setTimeout(() => {
      console.log('[InvoiceTableActions] Opening email preview dialog');
      setEmailPreviewOpen(true);
    }, 100);
  };

  // Handler for errors during PDF preparation
  const handleEmailError = (error: string) => {
    console.error('[InvoiceTableActions] Email preparation error:', error);
    setEmailProgressOpen(false);
    toast.error(`Failed to prepare invoice: ${error}`);
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
            onEmailInvoice={handleEmailInvoice}
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

      {/* Delete Confirmation Dialog */}
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

      {/* Email Invoice Dialogs - OUTSIDE dropdown so they survive dropdown close */}
      {selectedInvoiceForEmail && (
        <>
          <EmailInvoiceProgressDialog
            open={emailProgressOpen}
            onOpenChange={setEmailProgressOpen}
            invoice={selectedInvoiceForEmail}
            onReady={handlePdfReady}
            onError={handleEmailError}
          />

          <EmailInvoicePreviewDialog
            open={emailPreviewOpen}
            onOpenChange={setEmailPreviewOpen}
            selectedInvoice={selectedInvoiceForEmail}
            preparedPdfBase64={preparedPdfBase64}
          />
        </>
      )}
    </>
  );
}
