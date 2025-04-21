
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Eye, Edit } from "lucide-react";
import { Invoice } from "@/types/invoice";
import { useNavigate } from "react-router-dom";

interface InvoiceBasicActionsProps {
  invoice: Invoice;
  isPending: boolean;
  onCloseDropdown: () => void;
}

export function InvoiceBasicActions({ invoice, isPending, onCloseDropdown }: InvoiceBasicActionsProps) {
  const navigate = useNavigate();

  const handleView = () => {
    onCloseDropdown();
    // Fixed navigation path to ensure it goes to the invoice detail view
    navigate(`/invoices/${invoice.id}`);
    console.log("Navigating to invoice detail:", invoice.id);
  };

  const handleEdit = () => {
    onCloseDropdown();
    navigate(`/invoices/${invoice.id}/edit`);
  };

  return (
    <>
      <DropdownMenuItem onClick={handleView} disabled={isPending}>
        <Eye className="mr-2 h-4 w-4" /> View
      </DropdownMenuItem>
      <DropdownMenuItem onClick={handleEdit} disabled={isPending || invoice.status === 'paid'}>
        <Edit className="mr-2 h-4 w-4" /> Edit
      </DropdownMenuItem>
    </>
  );
}
