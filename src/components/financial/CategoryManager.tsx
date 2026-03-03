import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useAllTransactionCategories, useCategoryMutations, type TransactionCategory } from "@/hooks/useBusinessTransactions";
import { CategoryDialog } from "./CategoryDialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function CategoryManager() {
  const { data: categories = [], isLoading } = useAllTransactionCategories();
  const { createCategory, updateCategory, deleteCategory } = useCategoryMutations();
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<TransactionCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TransactionCategory | null>(null);

  const handleSave = async (data: { name: string; type: string; sort_order: number }) => {
    if (editing) {
      await updateCategory.mutateAsync({ id: editing.id, ...data });
      toast.success("Category updated");
    } else {
      await createCategory.mutateAsync(data);
      toast.success("Category created");
    }
  };

  const handleEdit = (cat: TransactionCategory) => {
    setEditing(cat);
    setShowDialog(true);
  };

  const handleAddNew = () => {
    setEditing(null);
    setShowDialog(true);
  };

  const handleToggleActive = async (cat: TransactionCategory) => {
    await updateCategory.mutateAsync({ id: cat.id, is_active: !cat.is_active });
    toast.success(cat.is_active ? "Category deactivated" : "Category activated");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      // Check if category is in use
      const { count, error: countError } = await supabase
        .from('business_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('category', deleteTarget.name);

      if (countError) throw countError;

      if (count && count > 0) {
        toast.error(`Cannot delete "${deleteTarget.name}" — it's used by ${count} transaction(s). Deactivate it instead.`);
        setDeleteTarget(null);
        return;
      }

      await deleteCategory.mutateAsync(deleteTarget.id);
      toast.success("Category deleted");
    } catch (err) {
      toast.error("Failed to delete category");
    }
    setDeleteTarget(null);
  };

  const typeBadgeVariant = (type: string) => {
    if (type === 'expense') return 'destructive' as const;
    if (type === 'income') return 'default' as const;
    return 'secondary' as const;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{categories.length} categories</p>
        <Button size="sm" onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-1" />
          Add Category
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-center">Sort Order</TableHead>
            <TableHead className="text-center">Active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((cat) => (
            <TableRow key={cat.id} className={!cat.is_active ? "opacity-50" : ""}>
              <TableCell className="font-medium">{cat.name}</TableCell>
              <TableCell>
                <Badge variant={typeBadgeVariant(cat.type)}>{cat.type}</Badge>
              </TableCell>
              <TableCell className="text-center">{cat.sort_order}</TableCell>
              <TableCell className="text-center">
                <Switch checked={cat.is_active} onCheckedChange={() => handleToggleActive(cat)} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(cat)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(cat)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {categories.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                No categories yet. Add one to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <CategoryDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        category={editing}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category. If transactions use this category, deletion will be blocked — deactivate it instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
