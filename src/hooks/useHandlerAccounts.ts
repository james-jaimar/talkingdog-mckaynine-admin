import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useBranch } from "@/context/BranchContext";

export interface HandlerAccount {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  auth_user_id: string | null;
  onboarding_status: string;
  created_at: string;
  branch_id?: string | null;
}

export function useHandlerAccounts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentBranch } = useBranch();

  // Fetch handlers with their auth account info
  const { 
    data: handlers = [], 
    isLoading,
    error,
    refetch 
  } = useQuery({
    queryKey: ['handler-accounts', currentBranch?.id],
    queryFn: async () => {
      try {
        let query = supabase
          .from('clients')
          .select(`
            id,
            first_name,
            last_name,
            email,
            phone,
            auth_user_id,
            onboarding_status,
            created_at,
            branch_id
          `)
          .order('first_name', { ascending: true });

        if (currentBranch) {
          query = query.eq('branch_id', currentBranch.id);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        
        return (data || []) as HandlerAccount[];
      } catch (error) {
        console.error("Error fetching handler accounts:", error);
        throw error;
      }
    },
    enabled: !!currentBranch,
    staleTime: 1000 * 60,
  });

  // Create handler account (auth user + link to client)
  const createAccount = useMutation({
    mutationFn: async ({ 
      handlerId, 
      email, 
      password 
    }: { 
      handlerId: string; 
      email: string; 
      password: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      // Create auth user via edge function
      const { data, error } = await supabase.functions.invoke('handler-account', {
        method: 'POST',
        body: { 
          operation: 'create_account',
          handlerId,
          email,
          password
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw new Error(error.message || 'Failed to create account');
      if (!data?.success) throw new Error(data?.error || 'Account creation failed');
      
      return data;
    },
    onSuccess: () => {
      toast({ title: "Account created", description: "Handler login account created successfully" });
      queryClient.invalidateQueries({ queryKey: ['handler-accounts'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create account",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Reset handler password
  const resetPassword = useMutation({
    mutationFn: async ({ 
      authUserId, 
      password 
    }: { 
      authUserId: string; 
      password: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      // Use existing user-role edge function for password reset
      const { data, error } = await supabase.functions.invoke('user-role', {
        method: 'POST',
        body: { 
          operation: 'reset_password',
          userId: authUserId,
          password
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw new Error(error.message || 'Failed to reset password');
      if (!data?.success) throw new Error(data?.error || 'Password reset failed');
      
      return data;
    },
    onSuccess: () => {
      toast({ title: "Password reset", description: "Handler password has been reset successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reset password",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Remove handler account (unlink auth user)
  const removeAccount = useMutation({
    mutationFn: async ({ handlerId }: { handlerId: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke('handler-account', {
        method: 'POST',
        body: { 
          operation: 'remove_account',
          handlerId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw new Error(error.message || 'Failed to remove account');
      if (!data?.success) throw new Error(data?.error || 'Account removal failed');
      
      return data;
    },
    onSuccess: () => {
      toast({ title: "Account removed", description: "Handler login access has been removed" });
      queryClient.invalidateQueries({ queryKey: ['handler-accounts'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove account",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return {
    handlers,
    isLoading,
    error,
    refetch,
    createAccount,
    resetPassword,
    removeAccount,
  };
}
