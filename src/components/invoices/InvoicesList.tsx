
import { useState, useEffect } from "react";
import { Invoice } from "@/types/invoice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { InvoicesTable } from "./table/InvoicesTable";
import { SearchInvoices } from "./SearchInvoices";
import { DeleteInvoiceDialog } from "./dialogs/DeleteInvoiceDialog";
import { EmailInvoiceDialog } from "./dialogs/EmailInvoiceDialog";

interface InvoicesListProps {
  invoices: Invoice[];
  isLoading: boolean;
  currentMonthLabel?: string;
}

export function InvoicesList({ 
  invoices, 
  isLoading, 
  currentMonthLabel = "All Invoices" 
}: InvoicesListProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Add effect to refresh data when component mounts
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
  }, [queryClient]);

  // Filter invoices by search term
  const filteredInvoices = invoices.filter(
    invoice => 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.client?.first_name && invoice.client.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (invoice.client?.last_name && invoice.client.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (invoice.client?.email && invoice.client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // These handlers connect the action buttons to the dialogs
  const handleDeleteRequest = (id: string) => {
    setSelectedInvoiceId(id);
    setDeleteDialogOpen(true);
  };

  const handleEmailRequest = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setEmailDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Invoices {currentMonthLabel && `- ${currentMonthLabel}`}</CardTitle>
            <CardDescription>
              Manage client invoices and payments
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <SearchInvoices 
            searchTerm={searchTerm} 
            onSearchChange={setSearchTerm} 
          />

          <InvoicesTable 
            invoices={filteredInvoices}
            isLoading={isLoading}
            searchTerm={searchTerm}
            currentMonthLabel={currentMonthLabel}
          />
        </CardContent>
      </Card>

      <DeleteInvoiceDialog 
        open={deleteDialogOpen} 
        onOpenChange={setDeleteDialogOpen} 
        selectedInvoiceId={selectedInvoiceId} 
      />

      <EmailInvoiceDialog 
        open={emailDialogOpen} 
        onOpenChange={setEmailDialogOpen}
        selectedInvoice={selectedInvoice}
      />
    </>
  );
}
