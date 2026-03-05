import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranchOptions } from "@/components/classes/hooks/utils/branch-fetcher";
import { useBranch } from "@/context/BranchContext";
import { useEmailTemplates, EmailTemplate } from "@/hooks/useEmailTemplates";
import { toast } from "sonner";

interface CopyTemplateToBranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: EmailTemplate | null;
}

export function CopyTemplateToBranchDialog({ open, onOpenChange, template }: CopyTemplateToBranchDialogProps) {
  const [targetBranchId, setTargetBranchId] = useState<string>("");
  const { branches, isLoadingBranches } = useBranchOptions();
  const { currentBranch } = useBranch();
  const { copyToBranch } = useEmailTemplates();

  const availableBranches = branches.filter(b => b.value !== currentBranch?.id);

  const handleCopy = async () => {
    if (!template || !targetBranchId) return;

    const targetBranch = branches.find(b => b.value === targetBranchId);
    await copyToBranch.mutateAsync({ templateId: template.id, targetBranchId });
    toast.success(`Template copied to ${targetBranch?.label || "target branch"}`);
    setTargetBranchId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Copy Template to Branch</DialogTitle>
          <DialogDescription>
            Copy "{template?.name}" to another branch.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Select value={targetBranchId} onValueChange={setTargetBranchId} disabled={isLoadingBranches}>
            <SelectTrigger>
              <SelectValue placeholder="Select target branch" />
            </SelectTrigger>
            <SelectContent>
              {availableBranches.map(branch => (
                <SelectItem key={branch.value} value={branch.value}>
                  {branch.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCopy} disabled={!targetBranchId || copyToBranch.isPending}>
            {copyToBranch.isPending ? "Copying..." : "Copy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
