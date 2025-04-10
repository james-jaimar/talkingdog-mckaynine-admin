
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
import { useIsMobile } from "@/hooks/useIsMobile";

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
  const isMobile = useIsMobile();
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
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4">
          <div>
            <CardTitle className="text-lg sm:text-xl">
              Invoices {currentMonthLabel && `- ${currentMonthLabel}`}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Manage client invoices and payments
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-4">
          <SearchInvoices 
            searchTerm={searchTerm} 
            onSearchChange={setSearchTerm} 
          />

          <div className={`mt-3 ${isMobile ? 'overflow-auto -mx-3 px-3' : ''}`}>
            <InvoicesTable 
              invoices={filteredInvoices}
              isLoading={isLoading}
              searchTerm={searchTerm}
              currentMonthLabel={currentMonthLabel}
            />
          </div>
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
