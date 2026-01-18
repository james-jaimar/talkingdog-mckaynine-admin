import { useState, useEffect } from "react";
import { useBranch } from "@/context/BranchContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { GitBranch, Loader2 } from "lucide-react";

interface MultiBranchSelectorProps {
  handlerId: string;
}

export function MultiBranchSelector({ handlerId }: MultiBranchSelectorProps) {
  const { branches } = useBranch();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBranches, setSelectedBranches] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  // Fetch current branch associations
  useEffect(() => {
    const fetchBranchAssociations = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('client_branches')
          .select('branch_id')
          .eq('client_id', handlerId);

        if (error) throw error;

        setSelectedBranches(new Set(data?.map(cb => cb.branch_id) || []));
      } catch (error: any) {
        console.error('Error fetching branch associations:', error);
        toast({
          title: "Error",
          description: "Failed to load branch associations",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (handlerId) {
      fetchBranchAssociations();
    }
  }, [handlerId, toast]);

  const handleBranchToggle = async (branchId: string, checked: boolean) => {
    setIsSaving(branchId);
    
    try {
      if (checked) {
        // Add branch association
        const { error } = await supabase
          .from('client_branches')
          .insert({ client_id: handlerId, branch_id: branchId });

        if (error) {
          // Ignore duplicate key error
          if (error.code !== '23505') {
            throw error;
          }
        }

        setSelectedBranches(prev => new Set([...prev, branchId]));
      } else {
        // Prevent removing all branches - at least one must remain
        if (selectedBranches.size <= 1) {
          toast({
            title: "Cannot remove",
            description: "Handler must belong to at least one branch",
            variant: "destructive",
          });
          return;
        }

        // Remove branch association
        const { error } = await supabase
          .from('client_branches')
          .delete()
          .eq('client_id', handlerId)
          .eq('branch_id', branchId);

        if (error) throw error;

        setSelectedBranches(prev => {
          const next = new Set(prev);
          next.delete(branchId);
          return next;
        });
      }

      toast({
        title: "Updated",
        description: `Branch ${checked ? 'added' : 'removed'} successfully`,
      });

      // Refresh handler data
      queryClient.invalidateQueries({ queryKey: ['client', handlerId] });
      queryClient.invalidateQueries({ queryKey: ['available-handlers'] });
    } catch (error: any) {
      console.error('Error updating branch:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update branch",
        variant: "destructive",
      });
    } finally {
      setIsSaving(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading branches...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-muted-foreground text-sm flex items-center gap-2">
        <GitBranch className="h-4 w-4" />
        Branch Access
      </h3>
      <div className="space-y-2 pl-6">
        {branches.map((branch) => (
          <div key={branch.id} className="flex items-center gap-2">
            <Checkbox
              id={`branch-${branch.id}`}
              checked={selectedBranches.has(branch.id)}
              onCheckedChange={(checked) => handleBranchToggle(branch.id, !!checked)}
              disabled={isSaving === branch.id}
            />
            <label
              htmlFor={`branch-${branch.id}`}
              className="text-sm cursor-pointer flex items-center gap-2"
            >
              {branch.name}
              {isSaving === branch.id && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
            </label>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground pl-6">
        Handler will appear in selected branches for class enrollment
      </p>
    </div>
  );
}
