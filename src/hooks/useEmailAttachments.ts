import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";
import { toast } from "sonner";

export interface EmailAttachment {
  id: string;
  branch_id: string;
  name: string;
  file_path: string;
  file_type: string | null;
  class_type: string | null;
  created_at: string;
  updated_at: string;
}

export function useEmailAttachments() {
  const { currentBranch } = useBranch();
  const queryClient = useQueryClient();

  const attachmentsQuery = useQuery({
    queryKey: ["email-attachments", currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch?.id) return [];
      
      const { data, error } = await supabase
        .from("email_attachments")
        .select("*")
        .eq("branch_id", currentBranch.id)
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data as EmailAttachment[];
    },
    enabled: !!currentBranch?.id,
  });

  const uploadAttachment = useMutation({
    mutationFn: async ({ file, name, classType }: { file: File; name: string; classType?: string }) => {
      if (!currentBranch?.id) throw new Error("No branch selected");
      
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `email-attachments/${currentBranch.id}/${fileName}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("email-attachments")
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from("email-attachments")
        .getPublicUrl(filePath);
      
      // Save metadata to database
      const { data, error } = await supabase
        .from("email_attachments")
        .insert({
          branch_id: currentBranch.id,
          name,
          file_path: filePath,
          file_type: file.type || fileExt,
          class_type: classType || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-attachments"] });
      toast.success("Attachment uploaded successfully");
    },
    onError: (error: any) => {
      console.error("Upload error:", error);
      toast.error(`Failed to upload: ${error.message}`);
    },
  });

  const deleteAttachment = useMutation({
    mutationFn: async (attachment: EmailAttachment) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("email-attachments")
        .remove([attachment.file_path]);
      
      if (storageError) {
        console.error("Storage delete error:", storageError);
        // Continue anyway - the file might already be gone
      }
      
      // Delete from database
      const { error } = await supabase
        .from("email_attachments")
        .delete()
        .eq("id", attachment.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-attachments"] });
      toast.success("Attachment deleted");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const getAttachmentUrl = (attachment: EmailAttachment): string => {
    const { data } = supabase.storage
      .from("email-attachments")
      .getPublicUrl(attachment.file_path);
    return data.publicUrl;
  };

  return {
    attachments: attachmentsQuery.data || [],
    isLoading: attachmentsQuery.isLoading,
    error: attachmentsQuery.error,
    uploadAttachment,
    deleteAttachment,
    getAttachmentUrl,
    refetch: attachmentsQuery.refetch,
  };
}
