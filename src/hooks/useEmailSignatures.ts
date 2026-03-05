import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";
import { toast } from "sonner";

export interface EmailSignature {
  id: string;
  branch_id: string;
  name: string;
  title: string;
  phone: string;
  company: string | null;
  email: string;
  website: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type EmailSignatureInput = Omit<EmailSignature, "id" | "branch_id" | "created_at" | "updated_at">;

export function useEmailSignatures() {
  const queryClient = useQueryClient();
  const { currentBranch } = useBranch();
  const branchId = currentBranch?.id;

  const queryKey = ["email-signatures", branchId];

  const { data: signatures = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!branchId) return [];
      const { data, error } = await supabase
        .from("branch_email_signatures")
        .select("*")
        .eq("branch_id", branchId)
        .order("is_default", { ascending: false })
        .order("name");
      if (error) throw error;
      return data as EmailSignature[];
    },
    enabled: !!branchId,
  });

  const createSignature = useMutation({
    mutationFn: async (input: EmailSignatureInput) => {
      if (!branchId) throw new Error("No branch selected");
      const { error } = await supabase
        .from("branch_email_signatures")
        .insert({ ...input, branch_id: branchId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Signature created");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateSignature = useMutation({
    mutationFn: async ({ id, ...input }: Partial<EmailSignatureInput> & { id: string }) => {
      const { error } = await supabase
        .from("branch_email_signatures")
        .update(input)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Signature updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteSignature = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("branch_email_signatures")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Signature deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const setDefault = useMutation({
    mutationFn: async (id: string) => {
      if (!branchId) throw new Error("No branch selected");
      // Unset current defaults for this branch
      await supabase
        .from("branch_email_signatures")
        .update({ is_default: false })
        .eq("branch_id", branchId)
        .eq("is_default", true);
      // Set new default
      const { error } = await supabase
        .from("branch_email_signatures")
        .update({ is_default: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Default signature updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { signatures, isLoading, createSignature, updateSignature, deleteSignature, setDefault };
}
