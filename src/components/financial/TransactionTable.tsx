import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import type { BusinessTransaction } from "@/hooks/useBusinessTransactions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TransactionTableProps {
  transactions: BusinessTransaction[];
  onEdit: (transaction: BusinessTransaction) => void;
  onDelete: (id: string) => void;
}

export function TransactionTable({ transactions, onEdit, onDelete }: TransactionTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const total = transactions.reduce((sum, t) => sum + t.amount, 0);

  if (transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-muted-foreground">No transactions found for this period.</p>
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full overflow-auto max-h-[600px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t, index) => (
              <TableRow key={t.id} isEven={index % 2 === 1}>
                <TableCell className="whitespace-nowrap text-sm">
                  {format(new Date(t.date), 'dd MMM yy')}
                </TableCell>
                <TableCell className="text-sm">{t.vendor_or_source || '—'}</TableCell>
                <TableCell className="text-sm max-w-[250px] truncate">{t.description}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{t.category}</Badge>
                </TableCell>
                <TableCell className="text-right font-medium whitespace-nowrap">
                  {formatCurrency(t.amount)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(t)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(t.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} className="font-bold">Total</TableCell>
              <TableCell className="text-right font-bold">{formatCurrency(total)}</TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) onDelete(deleteId);
                setDeleteId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
