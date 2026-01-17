import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useBranch } from "@/context/BranchContext";

interface BulkPreviewHandler {
  id: string;
  name: string;
  email: string;
}

interface BulkResult {
  summary: {
    total: number;
    created: number;
    skipped: number;
    failed: number;
  };
  results: Array<{
    handlerId: string;
    email: string;
    name: string;
    success: boolean;
    error?: string;
    skipped?: boolean;
    skipReason?: string;
  }>;
}

export function useBulkHandlerAccounts() {
  const { toast } = useToast();
  const { currentBranch } = useBranch();

  // Preview what accounts would be created (dry run)
  const preview = useQuery({
    queryKey: ['bulk-handler-preview', currentBranch?.id],
    queryFn: async (): Promise<BulkPreviewHandler[]> => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke('handler-account-bulk', {
        method: 'POST',
        body: { 
          operation: 'create_all_accounts',
          branchId: currentBranch?.id,
          dryRun: true
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw new Error(error.message || 'Failed to preview');
      if (!data?.success) throw new Error(data?.error || 'Preview failed');
      
      return data.handlers || [];
    },
    enabled: false, // Only run when explicitly called
    staleTime: 0,
  });

  // Execute bulk account creation
  const createAllAccounts = useMutation({
    mutationFn: async (): Promise<BulkResult> => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke('handler-account-bulk', {
        method: 'POST',
        body: { 
          operation: 'create_all_accounts',
          branchId: currentBranch?.id,
          dryRun: false
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw new Error(error.message || 'Failed to create accounts');
      if (!data?.success) throw new Error(data?.error || 'Bulk creation failed');
      
      return data;
    },
    onSuccess: (data) => {
      toast({ 
        title: "Bulk Account Creation Complete", 
        description: `Created: ${data.summary.created}, Skipped: ${data.summary.skipped}, Failed: ${data.summary.failed}`
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk creation failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return {
    preview,
    createAllAccounts,
  };
}
