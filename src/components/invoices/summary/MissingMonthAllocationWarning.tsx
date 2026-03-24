import { useState } from "react";
import { Invoice } from "@/hooks/invoices/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";
import { AllocateToMonthDialog } from "../table/AllocateToMonthDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface MissingMonthAllocationWarningProps {
  invoices: Invoice[];
}

export function MissingMonthAllocationWarning({ invoices }: MissingMonthAllocationWarningProps) {
  const [dismissed, setDismissed] = useState(false);
  const [allocateDialogOpen, setAllocateDialogOpen] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const queryClient = useQueryClient();

  // Filter invoices without franchise_report_month
  const unallocatedInvoices = invoices.filter(
    (invoice) => !invoice.franchise_report_month
  );

  // Don't show if no unallocated invoices or dismissed
  if (unallocatedInvoices.length === 0 || dismissed) {
    return null;
  }

  const handleAllocate = async (franchiseMonth: string | null) => {
    if (!franchiseMonth) {
      setAllocateDialogOpen(false);
      return;
    }

    setIsAllocating(true);
    try {
      const invoiceIds = unallocatedInvoices.map((inv) => inv.id);
      
      // Resolve term_id from the franchise month
      let termId: string | null = null;
      if (franchiseMonth) {
        const { data } = await supabase.rpc('get_term_id_for_month', { month_str: franchiseMonth });
        termId = data;
      }

      const { error } = await supabase
        .from("invoices")
        .update({ 
          franchise_report_month: franchiseMonth,
          ...(termId ? { term_id: termId } : {})
        })
        .in("id", invoiceIds);

      if (error) throw error;

      toast.success(
        `Allocated ${unallocatedInvoices.length} invoice(s) to ${franchiseMonth}`
      );
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setAllocateDialogOpen(false);
    } catch (error) {
      console.error("Failed to allocate invoices:", error);
      toast.error("Failed to allocate invoices");
    } finally {
      setIsAllocating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  };

  return (
    <>
      <Alert variant="warning" className="mb-4 relative">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="pr-8">
          Unallocated Invoices Found ({unallocatedInvoices.length} invoice
          {unallocatedInvoices.length !== 1 ? "s" : ""})
        </AlertTitle>
        <AlertDescription>
          <p className="mb-2">
            The following invoices are missing a franchise report month and will
            be excluded from financial reports:
          </p>
          <ul className="list-disc list-inside mb-3 text-sm">
            {unallocatedInvoices.slice(0, 5).map((invoice) => (
              <li key={invoice.id}>
                <span className="font-medium">{invoice.invoice_number}</span>
                {invoice.client && (
                  <span>
                    {" "}
                    ({invoice.client.first_name} {invoice.client.last_name})
                  </span>
                )}
                <span className="text-muted-foreground">
                  {" "}
                  - {formatCurrency(invoice.total)}
                </span>
              </li>
            ))}
            {unallocatedInvoices.length > 5 && (
              <li className="text-muted-foreground">
                ...and {unallocatedInvoices.length - 5} more
              </li>
            )}
          </ul>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setAllocateDialogOpen(true)}>
              Allocate Now
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
            >
              Dismiss
            </Button>
          </div>
        </AlertDescription>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </Alert>

      <AllocateToMonthDialog
        open={allocateDialogOpen}
        onOpenChange={setAllocateDialogOpen}
        selectedCount={unallocatedInvoices.length}
        onConfirm={handleAllocate}
        isLoading={isAllocating}
      />
    </>
  );
}
