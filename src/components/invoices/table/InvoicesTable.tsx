
import { useState } from "react";
import { Invoice } from "@/types/invoice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, Calculator, GitBranch } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { InvoiceTableActions } from "./InvoiceTableActions";
import { useBranch } from "@/context/BranchContext";

interface InvoicesTableProps {
  invoices: Invoice[];
  isLoading: boolean;
  searchTerm: string;
  currentMonthLabel?: string;
  onDeleteInvoice?: (id: string) => void;
  onEmailInvoice?: (invoice: Invoice) => void;
  onTransferInvoice?: (invoice: Invoice) => void;
}

export function InvoicesTable({ 
  invoices, 
  isLoading, 
  searchTerm, 
  currentMonthLabel = "All Invoices",
  onDeleteInvoice,
  onEmailInvoice,
  onTransferInvoice
}: InvoicesTableProps) {
  const { currentBranch } = useBranch();
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'sent':
        return <Badge variant="secondary">Sent</Badge>;
      case 'paid':
        return <Badge variant="default" className="bg-green-600">Paid</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-200 text-gray-700">Cancelled</Badge>;
      default:
        return null;
    }
  };

  // Calculate totals for table footer
  const calculateInvoiceTotals = () => {
    const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const paidAmount = invoices.reduce((sum, invoice) => 
      invoice.status === 'paid' ? sum + invoice.total : sum, 0);
    const outstandingAmount = invoices.reduce((sum, invoice) => 
      (invoice.status === 'sent' || invoice.status === 'overdue') ? sum + invoice.total : sum, 0);
    
    return {
      totalAmount,
      paidAmount,
      outstandingAmount,
      invoiceCount: invoices.length
    };
  };
  
  const totals = calculateInvoiceTotals();

  // Handle opening the transfer dialog via the action menu
  const handleTransferInvoice = (invoice: Invoice) => {
    if (onTransferInvoice) {
      onTransferInvoice(invoice);
    }
  };
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice Number</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                <div className="flex justify-center items-center">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-500 mr-2" />
                  <span>Loading invoices{currentBranch ? ` for ${currentBranch.name}...` : '...'}</span>
                </div>
              </TableCell>
            </TableRow>
          ) : invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                {searchTerm ? (
                  "No invoices match your search."
                ) : currentBranch ? (
                  `No invoices found for ${currentBranch.name}.`
                ) : (
                  "No invoices found."
                )}
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                <TableCell>
                  {invoice.client ? (
                    <div>
                      <div>{invoice.client.first_name} {invoice.client.last_name}</div>
                      <div className="text-sm text-muted-foreground">{invoice.client.email}</div>
                    </div>
                  ) : (
                    "Unknown Client"
                  )}
                </TableCell>
                <TableCell>{format(new Date(invoice.issued_date), "PP")}</TableCell>
                <TableCell>{format(new Date(invoice.due_date), "PP")}</TableCell>
                <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                <TableCell>{formatCurrency(invoice.total)}</TableCell>
                <TableCell className="text-right">
                  <InvoiceTableActions 
                    invoice={invoice} 
                    onOpenTransferDialog={handleTransferInvoice}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        
        {!isLoading && invoices.length > 0 && (
          <TableFooter className="bg-muted/50">
            <TableRow className="border-t-2 border-primary/20">
              <TableCell colSpan={2} className="font-medium">
                <div className="flex items-center">
                  <Calculator className="h-4 w-4 mr-2 text-muted-foreground" />
                  Summary ({totals.invoiceCount} invoices)
                  {currentBranch && (
                    <span className="inline-flex items-center ml-2 text-xs text-muted-foreground">
                      <GitBranch className="h-3 w-3 mr-1" />
                      {currentBranch.name}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell colSpan={2}></TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Paid</div>
                  <div className="font-medium text-green-600">{formatCurrency(totals.paidAmount)}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="font-medium">{formatCurrency(totals.totalAmount)}</div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Outstanding</div>
                  <div className="font-medium text-amber-600">{formatCurrency(totals.outstandingAmount)}</div>
                </div>
              </TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
