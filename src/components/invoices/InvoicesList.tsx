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
import { EmailInvoicePreviewDialog } from "./dialogs/EmailInvoicePreviewDialog";
import { EmailInvoiceProgressDialog } from "./dialogs/EmailInvoiceProgressDialog";
import { TransferInvoiceDialog } from "./dialogs/TransferInvoiceDialog";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useBranch } from "@/context/BranchContext";
import { useMarkInvoiceAsPaid } from "@/hooks/invoices/status";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GitBranch, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

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
  const { currentBranch } = useBranch();
  const markAsPaidMutation = useMarkInvoiceAsPaid();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [emailProgressOpen, setEmailProgressOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [preparedPdfBase64, setPreparedPdfBase64] = useState<string | null>(null);
  const [duplicateInvoiceNumbers, setDuplicateInvoiceNumbers] = useState<string[]>([]);

  // Add effect to refresh data when component mounts or branch changes
  useEffect(() => {
    if (currentBranch) {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  }, [queryClient, currentBranch]);

  // Check for duplicate invoice numbers when invoices change
  useEffect(() => {
    if (invoices && invoices.length > 0) {
      const invoiceNumberCounts = new Map<string, number>();
      const duplicates: string[] = [];

      // Count occurrences of each invoice number
      invoices.forEach(invoice => {
        const currentCount = invoiceNumberCounts.get(invoice.invoice_number) || 0;
        invoiceNumberCounts.set(invoice.invoice_number, currentCount + 1);
      });

      // Check for duplicates
      invoiceNumberCounts.forEach((count, invoiceNumber) => {
        if (count > 1) {
          duplicates.push(invoiceNumber);
        }
      });

      setDuplicateInvoiceNumbers(duplicates);
    } else {
      setDuplicateInvoiceNumbers([]);
    }
  }, [invoices]);

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
    setPreparedPdfBase64(null);
    setEmailProgressOpen(true);
  };

  const handlePdfReady = (pdfBase64: string) => {
    setPreparedPdfBase64(pdfBase64);
    setEmailProgressOpen(false);
    setEmailDialogOpen(true);
  };

  const handlePdfError = (error: string) => {
    setEmailProgressOpen(false);
    toast.error("Failed to prepare invoice PDF: " + error);
  };

  const handleTransferRequest = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setTransferDialogOpen(true);
  };

  // Bulk mark as paid handler
  const handleBulkMarkAsPaid = async (invoicesToMark: Invoice[]) => {
    try {
      // Mark each invoice as paid sequentially
      for (const invoice of invoicesToMark) {
        await markAsPaidMutation.mutateAsync(invoice.id);
      }
      toast.success(`${invoicesToMark.length} invoice(s) marked as paid`);
    } catch (error) {
      console.error("Error bulk marking invoices as paid:", error);
      toast.error("Failed to mark some invoices as paid");
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4">
          <div>
            <CardTitle className="text-lg sm:text-xl">
              Invoices {currentMonthLabel && `- ${currentMonthLabel}`}
              {currentBranch && <span className="text-sm font-normal ml-2 text-muted-foreground">({currentBranch.name})</span>}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Manage client invoices and payments
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-4">
          {!currentBranch ? (
            <Alert className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
              <GitBranch className="h-4 w-4" />
              <AlertDescription>
                Please select a branch to view invoices
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {duplicateInvoiceNumbers.length > 0 && (
                <Alert className="mb-4 bg-red-50 text-red-800 border-red-200">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Warning: Duplicate invoice numbers detected: {duplicateInvoiceNumbers.join(', ')}. 
                    Please contact your system administrator to resolve this issue.
                  </AlertDescription>
                </Alert>
              )}
              
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
                  onDeleteInvoice={handleDeleteRequest}
                  onEmailInvoice={handleEmailRequest}
                  onTransferInvoice={handleTransferRequest}
                  onBulkMarkAsPaid={handleBulkMarkAsPaid}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <DeleteInvoiceDialog 
        open={deleteDialogOpen} 
        onOpenChange={setDeleteDialogOpen} 
        selectedInvoiceId={selectedInvoiceId} 
      />

      <EmailInvoicePreviewDialog 
        open={emailDialogOpen} 
        onOpenChange={setEmailDialogOpen}
        selectedInvoice={selectedInvoice}
      />

      <TransferInvoiceDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        invoice={selectedInvoice}
      />
    </>
  );
}
