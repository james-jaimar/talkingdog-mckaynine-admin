import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Package, Plus, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { useStarterKitInventory } from "@/hooks/useStarterKitInventory";
import { AddStockModal } from "./AddStockModal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

export const StarterKitsReport = () => {
  const [addStockOpen, setAddStockOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);

  const {
    batches,
    allocations,
    totalStock,
    isLowStock,
    isLoading,
    addStock,
    isAddingStock,
    deleteStock,
    isDeletingStock,
  } = useStarterKitInventory();

  const handleAddStock = (data: {
    quantity_added: number;
    purchase_date: string;
    unit_cost?: number | null;
    notes?: string | null;
  }) => {
    addStock(data);
    setAddStockOpen(false);
  };

  const handleDeleteClick = (batchId: string) => {
    setBatchToDelete(batchId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (batchToDelete) {
      deleteStock(batchToDelete);
      setDeleteDialogOpen(false);
      setBatchToDelete(null);
    }
  };

  // Calculate allocations this month
  const now = new Date();
  const thisMonthAllocations = allocations.filter((a) => {
    const allocDate = new Date(a.allocated_at);
    return (
      allocDate.getMonth() === now.getMonth() &&
      allocDate.getFullYear() === now.getFullYear()
    );
  }).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Low Stock Warning */}
      {isLowStock && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Low Stock Warning</AlertTitle>
          <AlertDescription>
            You have only {totalStock} starter kit{totalStock !== 1 ? "s" : ""} remaining. 
            Consider ordering more from Shannon soon.
          </AlertDescription>
        </Alert>
      )}

      {/* Stock Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Starter Kit Inventory
          </CardTitle>
          <Button onClick={() => setAddStockOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Stock
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{totalStock}</div>
              <div className="text-sm text-muted-foreground">Total Kits in Stock</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{thisMonthAllocations}</div>
              <div className="text-sm text-muted-foreground">Allocated This Month</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{batches.length}</div>
              <div className="text-sm text-muted-foreground">Active Batches</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Batches Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Batches</CardTitle>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No stock batches yet. Add your first batch to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Added</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell>
                      {format(new Date(batch.purchase_date), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-right">{batch.quantity_added}</TableCell>
                    <TableCell className="text-right">
                      {batch.quantity_remaining === 0 ? (
                        <Badge variant="secondary">Depleted</Badge>
                      ) : (
                        <span className={batch.quantity_remaining < 3 ? "text-destructive font-medium" : ""}>
                          {batch.quantity_remaining}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {batch.unit_cost ? `R${batch.unit_cost.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {batch.notes || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {batch.quantity_remaining === batch.quantity_added ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(batch.id)}
                          disabled={isDeletingStock}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Allocations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Allocations</CardTitle>
        </CardHeader>
        <CardContent>
          {allocations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No allocations yet. Kits will be automatically allocated when handlers enroll with enrollment fees.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Handler</TableHead>
                  <TableHead>Dog</TableHead>
                  <TableHead>Branch</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocations.slice(0, 20).map((allocation) => (
                  <TableRow key={allocation.id}>
                    <TableCell>
                      {format(new Date(allocation.allocated_at), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      {allocation.handler
                        ? `${allocation.handler.first_name} ${allocation.handler.last_name}`
                        : "-"}
                    </TableCell>
                    <TableCell>{allocation.dog_name || "-"}</TableCell>
                    <TableCell>
                      {allocation.branch?.name || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Stock Modal */}
      <AddStockModal
        open={addStockOpen}
        onOpenChange={setAddStockOpen}
        onSubmit={handleAddStock}
        isLoading={isAddingStock}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stock Batch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this stock batch? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
