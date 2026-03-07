import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useClassTypes, ClassType } from "@/hooks/useClassTypes";
import { useBranch } from "@/context/BranchContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, ArrowUp, ArrowDown, Edit, Loader2 } from "lucide-react";

export function ClassTypesManager() {
  const { classTypes, isLoading } = useClassTypes(true); // include inactive
  const { currentBranch } = useBranch();
  const queryClient = useQueryClient();
  const [editingType, setEditingType] = useState<ClassType | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['class-types'] });

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const maxOrder = classTypes.length > 0 ? Math.max(...classTypes.map(ct => ct.display_order)) : 0;
    const { data: inserted, error } = await supabase.from('class_types').insert({
      name: newName.trim(),
      display_order: maxOrder + 1,
    }).select('id').single();
    if (error) {
      setSaving(false);
      toast.error(error.message.includes('duplicate') ? "A class type with that name already exists" : error.message);
      return;
    }
    // Seed branch_class_types for ALL branches
    const { data: branches } = await supabase.from('branches').select('id');
    if (branches && inserted) {
      const rows = branches.map(b => ({
        branch_id: b.id,
        class_type_id: inserted.id,
        is_active: false,
      }));
      await supabase.from('branch_class_types').insert(rows);
    }
    setSaving(false);
    toast.success(`"${newName.trim()}" added`);
    setNewName("");
    setShowAddDialog(false);
    invalidate();
  };

  const handleToggleActive = async (ct: ClassType) => {
    if (!currentBranch) return;
    // Upsert into branch_class_types
    const { error } = await supabase
      .from('branch_class_types')
      .upsert({
        branch_id: currentBranch.id,
        class_type_id: ct.id,
        is_active: !ct.is_active,
      }, { onConflict: 'branch_id,class_type_id' });
    if (error) { toast.error(error.message); return; }
    toast.success(`"${ct.name}" ${ct.is_active ? 'deactivated' : 'activated'} for ${currentBranch.name}`);
    invalidate();
  };

  const handleReorder = async (ct: ClassType, direction: 'up' | 'down') => {
    const sorted = [...classTypes].sort((a, b) => a.display_order - b.display_order);
    const idx = sorted.findIndex(c => c.id === ct.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const other = sorted[swapIdx];
    await Promise.all([
      supabase.from('class_types').update({ display_order: other.display_order }).eq('id', ct.id),
      supabase.from('class_types').update({ display_order: ct.display_order }).eq('id', other.id),
    ]);
    invalidate();
  };

  const handleEditSave = async () => {
    if (!editingType || !editName.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from('class_types')
      .update({ name: editName.trim() })
      .eq('id', editingType.id);
    setSaving(false);
    if (error) {
      toast.error(error.message.includes('duplicate') ? "A class type with that name already exists" : error.message);
      return;
    }
    toast.success(`Renamed to "${editName.trim()}"`);
    setEditingType(null);
    invalidate();
  };

  const handleNextClassChange = async (ct: ClassType, nextClassType: string | null) => {
    const { error } = await supabase
      .from('class_types')
      .update({ next_class_type: nextClassType })
      .eq('id', ct.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Updated progression for "${ct.name}"`);
    invalidate();
  };

  if (isLoading) return <div className="flex items-center gap-2 p-4"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>;

  const sorted = [...classTypes].sort((a, b) => a.display_order - b.display_order);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Class Types</CardTitle>
          <CardDescription>
            {currentBranch 
              ? `Toggle active class types for ${currentBranch.name}. Names and order are shared across all branches.`
              : 'Manage the types of classes available across all branches'}
          </CardDescription>
        </div>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Type
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Order</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-[80px] text-center">Active</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((ct, idx) => (
              <TableRow key={ct.id} className={!ct.is_active ? 'opacity-50' : ''}>
                <TableCell className="font-mono text-sm">{ct.display_order}</TableCell>
                <TableCell className="font-medium">{ct.name}</TableCell>
                <TableCell className="text-center">
                  <Switch checked={ct.is_active} onCheckedChange={() => handleToggleActive(ct)} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === 0} onClick={() => handleReorder(ct, 'up')}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === sorted.length - 1} onClick={() => handleReorder(ct, 'down')}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingType(ct); setEditName(ct.name); }}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Class Type</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g., Agility" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving || !newName.trim()}>
              {saving ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingType} onOpenChange={(open) => !open && setEditingType(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Class Type</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingType(null)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={saving || !editName.trim()}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
