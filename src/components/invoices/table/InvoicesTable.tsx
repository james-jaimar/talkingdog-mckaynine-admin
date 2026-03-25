
import { useState, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { Loader2, Calculator, GitBranch } from "lucide-react";
import { InvoiceTableActions } from "./InvoiceTableActions";
import { BulkActionsToolbar } from "./BulkActionsToolbar";
import { AllocateToMonthDialog } from "./AllocateToMonthDialog";
import { useBranch } from "@/context/BranchContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface InvoicesTableProps {
  invoices: Invoice[];
  isLoading: boolean;
  searchTerm: string;
  currentMonthLabel?: string;
  onDeleteInvoice?: (id: string) => void;
  onEmailInvoice?: (invoice: Invoice) => void;
  onTransferInvoice?: (invoice: Invoice) => void;
  onBulkMarkAsPaid?: (invoices: Invoice[]) => Promise<void>;
}

export function InvoicesTable({ 
  invoices, 
  isLoading, 
  searchTerm, 
  currentMonthLabel = "All Invoices",
  onDeleteInvoice,
  onEmailInvoice,
  onTransferInvoice,
  onBulkMarkAsPaid
}: InvoicesTableProps) {
  const { currentBranch } = useBranch();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
  const [allocateDialogOpen, setAllocateDialogOpen] = useState(false);
  
  // Calculate how many selected invoices are unpaid (draft, sent or overdue)
  const selectedUnpaidCount = useMemo(() => {
    return invoices.filter(inv => selectedIds.has(inv.id) && (inv.status === 'draft' || inv.status === 'sent' || inv.status === 'overdue')).length;
  }, [invoices, selectedIds]);
  
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

  // Get color classes for franchise month badges based on relative month
  const getFranchiseMonthBadgeClasses = (franchiseMonth: string) => {
    const now = new Date();
    const currentMonthStr = format(now, "yyyy-MM");
    const nextMonthStr = format(addMonths(now, 1), "yyyy-MM");
    const prevMonthStr = format(subMonths(now, 1), "yyyy-MM");
    const prev2MonthStr = format(subMonths(now, 2), "yyyy-MM");
    const prev3MonthStr = format(subMonths(now, 3), "yyyy-MM");

    if (franchiseMonth === currentMonthStr) {
      return "bg-blue-50 text-blue-700 border-blue-200";
    } else if (franchiseMonth === nextMonthStr) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    } else if (franchiseMonth === prevMonthStr) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    } else if (franchiseMonth === prev2MonthStr) {
      return "bg-orange-50 text-orange-700 border-orange-200";
    } else if (franchiseMonth === prev3MonthStr) {
      return "bg-red-50 text-red-700 border-red-200";
    } else if (franchiseMonth > currentMonthStr) {
      // Future months beyond next month
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    } else {
      // Older months
      return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

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
  
  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(invoices.map(inv => inv.id)));
    } else {
      setSelectedIds(new Set());
    }
  };
  
  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };
  
  const handleBulkMarkAsPaid = async () => {
    if (!onBulkMarkAsPaid) return;
    
    const unpaidInvoices = invoices.filter(
      inv => selectedIds.has(inv.id) && (inv.status === 'draft' || inv.status === 'sent' || inv.status === 'overdue')
    );
    
    if (unpaidInvoices.length === 0) return;
    
    setIsBulkActionLoading(true);
    try {
      await onBulkMarkAsPaid(unpaidInvoices);
      setSelectedIds(new Set()); // Clear selection after success
    } finally {
      setIsBulkActionLoading(false);
    }
  };
  
  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleAllocateToMonth = async (franchiseMonth: string | null) => {
    if (selectedIds.size === 0) return;

    setIsBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ franchise_report_month: franchiseMonth })
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['franchise-monthly-data'] });

      const message = franchiseMonth
        ? `${selectedIds.size} invoice(s) allocated to ${franchiseMonth}`
        : `Cleared franchise allocation for ${selectedIds.size} invoice(s)`;
      toast.success(message);

      setSelectedIds(new Set());
      setAllocateDialogOpen(false);
    } catch (error: any) {
      console.error('Error allocating invoices:', error);
      toast.error('Failed to allocate invoices: ' + error.message);
    } finally {
      setIsBulkActionLoading(false);
    }
  };
  
  const isAllSelected = invoices.length > 0 && selectedIds.size === invoices.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < invoices.length;
  
  // Helper function to properly display discount info
  const renderDiscountCell = (invoice: Invoice) => {
    if (!invoice.monetary_discount || invoice.monetary_discount <= 0) {
      return null;
    }
    
    // For percentage discounts, show the original percentage value
    if (invoice.discount_type === 'percentage') {
      const percentValue = invoice.original_discount_amount !== null && invoice.original_discount_amount !== undefined 
        ? invoice.original_discount_amount 
        : invoice.discount_amount || 0;
        
      return (
        <span className="text-red-600">
          R {invoice.monetary_discount.toFixed(2)} ({percentValue}%)
        </span>
      );
    }
    
    // For fixed discounts, just show the amount
    return <span className="text-red-600">R {invoice.monetary_discount.toFixed(2)}</span>;
  };
  
  return (
    <div>
      <AllocateToMonthDialog
        open={allocateDialogOpen}
        onOpenChange={setAllocateDialogOpen}
        selectedCount={selectedIds.size}
        onConfirm={handleAllocateToMonth}
        isLoading={isBulkActionLoading}
      />

      <BulkActionsToolbar
        selectedCount={selectedIds.size}
        unpaidCount={selectedUnpaidCount}
        onMarkAsPaid={handleBulkMarkAsPaid}
        onAllocateToMonth={() => setAllocateDialogOpen(true)}
        onClearSelection={handleClearSelection}
        isLoading={isBulkActionLoading}
      />
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={isAllSelected}
                  // @ts-ignore - indeterminate is a valid prop
                  indeterminate={isSomeSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all invoices"
                />
              </TableHead>
              <TableHead>Invoice Number</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Franchise Month</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-500 mr-2" />
                    <span>Loading invoices{currentBranch ? ` for ${currentBranch.name}...` : '...'}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
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
                <TableRow key={invoice.id} className={selectedIds.has(invoice.id) ? "bg-muted/50" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(invoice.id)}
                      onCheckedChange={(checked) => handleSelectOne(invoice.id, !!checked)}
                      aria-label={`Select invoice ${invoice.invoice_number}`}
                    />
                  </TableCell>
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
                  <TableCell>
                    {(() => {
                      const displayMonth = invoice.franchise_report_month || format(new Date(invoice.issued_date), "yyyy-MM");
                      return (
                        <Badge 
                          variant="outline" 
                          className={getFranchiseMonthBadgeClasses(displayMonth)}
                        >
                          {format(new Date(displayMonth + '-01'), "MMM yyyy")}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>R {invoice.total.toFixed(2)}</TableCell>
                  <TableCell>
                    {renderDiscountCell(invoice)}
                  </TableCell>
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
                <TableCell></TableCell>
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
                    <div className="font-medium text-green-600">R {totals.paidAmount.toFixed(2)}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Total</div>
                    <div className="font-medium">R {totals.totalAmount.toFixed(2)}</div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Outstanding</div>
                    <div className="font-medium text-amber-600">R {totals.outstandingAmount.toFixed(2)}</div>
                  </div>
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}
