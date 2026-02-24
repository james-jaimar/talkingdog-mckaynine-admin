import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Download, Loader2, Upload } from "lucide-react";
import { MonthSelector } from "@/components/invoices/reports/MonthSelector";
import { useBusinessTransactions, useTransactionCategories, useTransactionMutations, type BusinessTransaction, type TransactionFormData } from "@/hooks/useBusinessTransactions";
import { TransactionTable } from "./TransactionTable";
import { TransactionDialog } from "./TransactionDialog";
import { BookkeepingSummary } from "./BookkeepingSummary";
import { toast } from "sonner";
import { format, startOfMonth } from "date-fns";
import { Badge } from "@/components/ui/badge";
import Papa from "papaparse";
import { useBranch } from "@/context/BranchContext";
import { supabase } from "@/integrations/supabase/client";

export function BookkeepingTab() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [innerTab, setInnerTab] = useState<'expenses' | 'income' | 'summary'>('expenses');
  const [showDialog, setShowDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<BusinessTransaction | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [importing, setImporting] = useState(false);

  const { currentBranch } = useBranch();

  const transactionType = innerTab === 'summary' ? undefined : innerTab === 'expenses' ? 'expense' : 'income';

  const { data: transactions = [], isLoading } = useBusinessTransactions({
    month: selectedMonth,
    year: selectedYear,
    type: transactionType,
    category: categoryFilter || undefined,
  });

  const { data: expenseCategories = [] } = useTransactionCategories('expense');
  const { data: incomeCategories = [] } = useTransactionCategories('income');
  const activeCategories = innerTab === 'expenses' ? expenseCategories : incomeCategories;

  const { createTransaction, updateTransaction, deleteTransaction } = useTransactionMutations();

  const monthLabel = format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy');

  const handleSave = async (data: TransactionFormData) => {
    if (editingTransaction) {
      await updateTransaction.mutateAsync({ id: editingTransaction.id, ...data });
      toast.success("Transaction updated");
    } else {
      await createTransaction.mutateAsync(data);
      toast.success("Transaction added");
    }
  };

  const handleEdit = (transaction: BusinessTransaction) => {
    setEditingTransaction(transaction);
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction.mutateAsync(id);
      toast.success("Transaction deleted");
    } catch {
      toast.error("Failed to delete transaction");
    }
  };

  const handleAddNew = () => {
    setEditingTransaction(null);
    setShowDialog(true);
  };

  const handleCsvImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !currentBranch?.id) return;

      setImporting(true);
      try {
        const text = await file.text();
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });

        if (result.errors.length > 0) {
          toast.error(`CSV parsing error: ${result.errors[0].message}`);
          return;
        }

        const { data: user } = await supabase.auth.getUser();
        const rows = result.data as Record<string, string>[];

        const inserts = rows
          .filter(row => row.Date && row.Description && row.Amount)
          .map(row => ({
            branch_id: currentBranch.id,
            type: (innerTab === 'income' ? 'income' : 'expense') as 'expense' | 'income',
            date: row.Date,
            description: row.Description,
            amount: parseFloat(row.Amount) || 0,
            category: row.Category || (innerTab === 'income' ? 'Other Income' : 'Supplies'),
            vendor_or_source: row.Vendor || null,
            payment_method: row['Payment Method'] || null,
            reference: row.Reference || null,
            notes: row.Notes || null,
            created_by: user?.user?.id || null,
          }));

        if (inserts.length === 0) {
          toast.error("No valid rows found. CSV needs: Date, Description, Amount columns.");
          return;
        }

        const { error } = await supabase
          .from('business_transactions')
          .insert(inserts);

        if (error) throw error;

        toast.success(`Imported ${inserts.length} transactions`);
        // Invalidate to refetch
        createTransaction.reset();
      } catch (err) {
        console.error('CSV import error:', err);
        toast.error("Failed to import CSV");
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  const handleExportCsv = () => {
    if (transactions.length === 0) {
      toast.error("No transactions to export");
      return;
    }

    const csv = Papa.unparse(transactions.map(t => ({
      Date: t.date,
      Description: t.description,
      Amount: t.amount,
      Category: t.category,
      Vendor: t.vendor_or_source || '',
      'Payment Method': t.payment_method || '',
      Reference: t.reference || '',
      Notes: t.notes || '',
    })));

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${innerTab}-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Bookkeeping - {monthLabel}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <MonthSelector
                month={selectedMonth}
                year={selectedYear}
                onMonthChange={setSelectedMonth}
                onYearChange={setSelectedYear}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={innerTab} onValueChange={(v) => { setInnerTab(v as any); setCategoryFilter(''); }}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <TabsList>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                <TabsTrigger value="income">Other Income</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>

              {innerTab !== 'summary' && (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={handleAddNew}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add {innerTab === 'expenses' ? 'Expense' : 'Income'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCsvImport} disabled={importing}>
                    {importing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                    Import CSV
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleExportCsv}>
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              )}
            </div>

            {/* Category filters */}
            {innerTab !== 'summary' && activeCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                <Badge
                  variant={categoryFilter === '' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setCategoryFilter('')}
                >
                  All
                </Badge>
                {activeCategories.map(cat => (
                  <Badge
                    key={cat.id}
                    variant={categoryFilter === cat.name ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setCategoryFilter(categoryFilter === cat.name ? '' : cat.name)}
                  >
                    {cat.name}
                  </Badge>
                ))}
              </div>
            )}

            <TabsContent value="expenses" className="mt-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <TransactionTable
                  transactions={transactions}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
            </TabsContent>

            <TabsContent value="income" className="mt-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <TransactionTable
                  transactions={transactions}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
            </TabsContent>

            <TabsContent value="summary" className="mt-0">
              <BookkeepingSummary month={selectedMonth} year={selectedYear} monthLabel={monthLabel} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <TransactionDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        type={innerTab === 'income' ? 'income' : 'expense'}
        transaction={editingTransaction}
        onSave={handleSave}
      />
    </div>
  );
}
