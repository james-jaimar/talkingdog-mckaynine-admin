
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export function useAdminSetup() {
  const [adminSetupAttempted, setAdminSetupAttempted] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set a user as admin
  const { mutate: setUserAsAdmin, isPending: isSettingAdmin } = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', userId)
        .select();
      
      if (error) {
        console.error("Error setting user as admin:", error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Admin set up",
        description: "User has been set as admin successfully.",
      });
      setAdminSetupAttempted(true);
      queryClient.invalidateQueries({ queryKey: ['users-admin'] });
    },
    onError: (error) => {
      toast({
        title: "Admin setup failed",
        description: error.message || "Failed to set user as admin.",
        variant: "destructive",
      });
      setAdminSetupAttempted(true);
    },
  });

  return {
    setUserAsAdmin,
    isSettingAdmin,
    adminSetupAttempted
  };
}
