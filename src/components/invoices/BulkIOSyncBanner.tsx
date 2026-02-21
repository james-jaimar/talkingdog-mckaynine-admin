
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";
import { syncInvoiceToIO } from "@/hooks/invoices/useIOSync";
import { AlertTriangle, CloudUpload, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { format, parse } from "date-fns";

interface UnsyncedInvoice {
  id: string;
  invoice_number: string;
  status: string;
  issued_date: string;
  franchise_report_month: string | null;
}

interface SyncResult {
  invoiceNumber: string;
  invoiceSuccess: boolean;
  paymentSuccess: boolean | null;
  error?: string;
}

interface MonthGroup {
  key: string; // "YYYY-MM"
  label: string; // "February 2026"
  invoices: UnsyncedInvoice[];
}

function getEffectiveMonth(inv: UnsyncedInvoice): string {
  if (inv.franchise_report_month) return inv.franchise_report_month;
  // Extract YYYY-MM from issued_date
  const d = new Date(inv.issued_date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(key: string): string {
  try {
    const date = parse(key, "yyyy-MM", new Date());
    return format(date, "MMMM yyyy");
  } catch {
    return key;
  }
}

export function BulkIOSyncBanner() {
  const { currentBranch } = useBranch();
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [syncingTotal, setSyncingTotal] = useState(0);
  const [results, setResults] = useState<SyncResult[]>([]);
  const [currentInvoice, setCurrentInvoice] = useState<string>("");
  const [syncingMonthLabel, setSyncingMonthLabel] = useState("");

  const { data: unsyncedInvoices = [], refetch } = useQuery({
    queryKey: ["unsynced-invoices", currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch?.id) return [];
      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, status, issued_date, franchise_report_month")
        .eq("branch_id", currentBranch.id)
        .is("io_document_id", null)
        .not("status", "in", '("draft","cancelled")')
        .gte("issued_date", "2026-01-01")
        .order("issued_date", { ascending: true });

      if (error) {
        console.error("Error fetching unsynced invoices:", error);
        return [];
      }
      return (data || []) as UnsyncedInvoice[];
    },
    enabled: !!currentBranch?.id,
    staleTime: 30 * 1000,
  });

  // Group invoices by effective month, sorted newest first
  const monthGroups = useMemo<MonthGroup[]>(() => {
    const map = new Map<string, UnsyncedInvoice[]>();
    for (const inv of unsyncedInvoices) {
      const key = getEffectiveMonth(inv);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(inv);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0])) // newest first
      .map(([key, invoices]) => ({
        key,
        label: formatMonthLabel(key),
        invoices,
      }));
  }, [unsyncedInvoices]);

  const handleSyncMonth = async (group: MonthGroup) => {
    setSyncing(true);
    setDialogOpen(true);
    setResults([]);
    setProgress(0);
    setCurrentIndex(0);
    setSyncingTotal(group.invoices.length);
    setSyncingMonthLabel(group.label);

    const total = group.invoices.length;

    for (let i = 0; i < total; i++) {
      const inv = group.invoices[i];
      setCurrentIndex(i + 1);
      setCurrentInvoice(inv.invoice_number);
      setProgress(Math.round((i / total) * 100));

      const result: SyncResult = {
        invoiceNumber: inv.invoice_number,
        invoiceSuccess: false,
        paymentSuccess: null,
      };

      const invoiceResult = await syncInvoiceToIO(inv.id, "invoice");
      result.invoiceSuccess = invoiceResult.success || !!invoiceResult.skipped;

      if (!result.invoiceSuccess) {
        result.error = invoiceResult.error;
      }

      if (result.invoiceSuccess && inv.status === "paid") {
        const paymentResult = await syncInvoiceToIO(inv.id, "payment");
        result.paymentSuccess = paymentResult.success || !!paymentResult.skipped;
        if (!result.paymentSuccess) {
          result.error = paymentResult.error;
        }
      }

      setResults((prev) => [...prev, result]);
    }

    setProgress(100);
    setSyncing(false);

    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    refetch();
  };

  if (unsyncedInvoices.length === 0) return null;

  const successCount = results.filter((r) => r.invoiceSuccess).length;
  const failCount = results.filter((r) => !r.invoiceSuccess).length;
  const isDone = results.length === syncingTotal && !syncing;

  return (
    <>
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4 mb-4 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            {unsyncedInvoices.length} invoice{unsyncedInvoices.length !== 1 ? "s" : ""} not synced to InvoicesOnline
          </p>
        </div>
        <div className="space-y-2">
          {monthGroups.map((group) => (
            <div
              key={group.key}
              className="flex items-center justify-between gap-3 rounded-md bg-amber-100/50 dark:bg-amber-900/20 px-3 py-2"
            >
              <span className="text-sm text-amber-800 dark:text-amber-200">
                {group.label}: <strong>{group.invoices.length}</strong> invoice{group.invoices.length !== 1 ? "s" : ""}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSyncMonth(group)}
                disabled={syncing}
                className="shrink-0"
              >
                <CloudUpload className="mr-2 h-4 w-4" />
                Sync
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => !syncing && setDialogOpen(open)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {syncing ? `Syncing ${syncingMonthLabel}...` : isDone ? "Sync Complete" : "Bulk IO Sync"}
            </DialogTitle>
            <DialogDescription>
              {syncing
                ? `Processing ${currentIndex} of ${syncingTotal}`
                : isDone
                ? `${successCount} succeeded, ${failCount} failed`
                : "Ready to sync"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Progress value={progress} className="h-2" />

            {syncing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{currentInvoice}</span>
              </div>
            )}

            {results.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-1 text-sm">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {r.invoiceSuccess ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                    )}
                    <span className="truncate">{r.invoiceNumber}</span>
                    {r.paymentSuccess === true && (
                      <span className="text-xs text-muted-foreground">+ payment</span>
                    )}
                    {r.paymentSuccess === false && (
                      <span className="text-xs text-red-600">payment failed</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isDone && (
              <Button onClick={() => setDialogOpen(false)} className="w-full">
                Close
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
