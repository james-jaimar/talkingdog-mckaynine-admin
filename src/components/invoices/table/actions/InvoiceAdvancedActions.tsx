
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ArrowUpDown, Trash } from "lucide-react";
import { Invoice } from "@/types/invoice";

interface InvoiceAdvancedActionsProps {
  invoice: Invoice;
  isPending: boolean;
  onCloseDropdown: () => void;
  onOpenTransferDialog?: (invoice: Invoice) => void;
  onOpenDeleteDialog: () => void;
}

export function InvoiceAdvancedActions({ 
  invoice, 
  isPending, 
  onCloseDropdown,
  onOpenTransferDialog,
  onOpenDeleteDialog 
}: InvoiceAdvancedActionsProps) {
  const handleTransfer = () => {
    onCloseDropdown();
    if (onOpenTransferDialog) {
      onOpenTransferDialog(invoice);
    }
  };

  return (
    <>
      <DropdownMenuItem 
        onClick={handleTransfer}
        disabled={isPending || !onOpenTransferDialog}
        className={onOpenTransferDialog ? '' : 'opacity-50'}
      >
        <ArrowUpDown className="mr-2 h-4 w-4" /> Transfer Invoice
      </DropdownMenuItem>
      
      <DropdownMenuItem 
        onClick={() => {
          onCloseDropdown();
          onOpenDeleteDialog();
        }}
        disabled={isPending}
        className="text-red-600 focus:text-red-600"
      >
        <Trash className="mr-2 h-4 w-4" /> Delete Invoice
      </DropdownMenuItem>
    </>
  );
}
