
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateAccountParams {
  assistantId: string;
  email: string;
  password: string;
}

interface ResetPasswordParams {
  assistantId: string;
  password: string;
}

interface RemoveAccountParams {
  assistantId: string;
}

async function invokeAssistantAccount(operation: string, data: Record<string, unknown>) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    throw new Error("Not authenticated");
  }
  
  const { data: result, error } = await supabase.functions.invoke('assistant-account', {
    method: 'POST',
    body: { operation, ...data },
    headers: {
      Authorization: `Bearer ${session.access_token}`
    }
  });
  
  if (error) {
    throw new Error(error.message || 'Operation failed');
  }
  
  if (result?.error) {
    throw new Error(result.error);
  }
  
  return result;
}

export function useCreateAssistantAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assistantId, email, password }: CreateAccountParams) => {
      return invokeAssistantAccount('create_account', { assistantId, email, password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assistants"] });
      toast.success("Login account created successfully");
    },
    onError: (error: Error) => {
      console.error("Error creating assistant account:", error);
      toast.error("Failed to create account: " + error.message);
    },
  });
}

export function useResetAssistantPassword() {
  return useMutation({
    mutationFn: async ({ assistantId, password }: ResetPasswordParams) => {
      return invokeAssistantAccount('reset_password', { assistantId, password });
    },
    onSuccess: () => {
      toast.success("Password reset successfully");
    },
    onError: (error: Error) => {
      console.error("Error resetting password:", error);
      toast.error("Failed to reset password: " + error.message);
    },
  });
}

export function useRemoveAssistantAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assistantId }: RemoveAccountParams) => {
      return invokeAssistantAccount('remove_account', { assistantId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assistants"] });
      toast.success("Login account removed successfully");
    },
    onError: (error: Error) => {
      console.error("Error removing assistant account:", error);
      toast.error("Failed to remove account: " + error.message);
    },
  });
}

// Helper function to generate a secure password
export function generateSecurePassword(length = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  
  const allChars = lowercase + uppercase + numbers + special;
  
  // Ensure at least one of each type
  let password = '';
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
