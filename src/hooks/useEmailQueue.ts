import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";
import { toast } from "sonner";

export interface QueuedEmail {
  id: string;
  branch_id: string;
  to_email: string;
  subject: string;
  html_content: string;
  from_email: string | null;
  from_name: string | null;
  attachments: any[];
  status: "pending" | "sending" | "sent" | "failed";
  retry_count: number;
  max_retries: number;
  error_message: string | null;
  created_at: string;
  scheduled_for: string;
  sent_at: string | null;
  handler_id: string | null;
  template_id: string | null;
  created_by: string | null;
  // Joined data
  handler?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export interface AddToQueueInput {
  to_email: string;
  subject: string;
  html_content: string;
  from_email?: string;
  from_name?: string;
  attachments?: any[];
  handler_id?: string;
  template_id?: string;
}

export function useEmailQueue() {
  const { currentBranch } = useBranch();
  const queryClient = useQueryClient();

  // Fetch outbox (pending/failed emails)
  const outboxQuery = useQuery({
    queryKey: ["email-queue", "outbox", currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch?.id) return [];

      const { data, error } = await supabase
        .from("email_queue")
        .select(`
          *,
          handler:clients!email_queue_handler_id_fkey(first_name, last_name, email)
        `)
        .eq("branch_id", currentBranch.id)
        .in("status", ["pending", "sending", "failed"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as QueuedEmail[];
    },
    enabled: !!currentBranch?.id,
    staleTime: 60000, // 1 minute - mutations invalidate the query when data changes
    refetchOnWindowFocus: false,
  });

  // Fetch sent emails
  const sentQuery = useQuery({
    queryKey: ["email-queue", "sent", currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch?.id) return [];

      const { data, error } = await supabase
        .from("email_queue")
        .select(`
          *,
          handler:clients!email_queue_handler_id_fkey(first_name, last_name, email)
        `)
        .eq("branch_id", currentBranch.id)
        .eq("status", "sent")
        .order("sent_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as QueuedEmail[];
    },
    enabled: !!currentBranch?.id,
  });

  // Add email to queue
  const addToQueue = useMutation({
    mutationFn: async (input: AddToQueueInput) => {
      if (!currentBranch?.id) throw new Error("No branch selected");

      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("email_queue")
        .insert({
          branch_id: currentBranch.id,
          to_email: input.to_email,
          subject: input.subject,
          html_content: input.html_content,
          from_email: input.from_email,
          from_name: input.from_name,
          attachments: input.attachments || [],
          handler_id: input.handler_id,
          template_id: input.template_id,
          created_by: userData?.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-queue"] });
      toast.success("Email added to queue");
    },
    onError: (error) => {
      console.error("Error adding to queue:", error);
      toast.error("Failed to queue email");
    },
  });

  // Retry a failed email
  const retryEmail = useMutation({
    mutationFn: async (emailId: string) => {
      const { error } = await supabase
        .from("email_queue")
        .update({
          status: "pending",
          retry_count: 0,
          error_message: null,
          scheduled_for: new Date().toISOString(),
        })
        .eq("id", emailId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-queue"] });
      toast.success("Email queued for retry");
    },
    onError: (error) => {
      console.error("Error retrying email:", error);
      toast.error("Failed to retry email");
    },
  });

  // Delete from queue
  const deleteFromQueue = useMutation({
    mutationFn: async (emailId: string) => {
      const { error } = await supabase
        .from("email_queue")
        .delete()
        .eq("id", emailId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-queue"] });
      toast.success("Email removed from queue");
    },
    onError: (error) => {
      console.error("Error deleting from queue:", error);
      toast.error("Failed to delete email");
    },
  });

  // Process queue (trigger edge function)
  const processQueue = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("process-email-queue", {
        body: { limit: 10, delayMs: 2000 },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["email-queue"] });
      if (data.processed > 0) {
        toast.success(`Processed ${data.sent} emails (${data.failed} failed)`);
      } else {
        toast.info("No emails to process");
      }
    },
    onError: (error) => {
      console.error("Error processing queue:", error);
      toast.error("Failed to process queue");
    },
  });

  // Resend a sent email (creates a new queue entry)
  const resendEmail = useMutation({
    mutationFn: async (emailId: string) => {
      // Get the original email
      const { data: original, error: fetchError } = await supabase
        .from("email_queue")
        .select("*")
        .eq("id", emailId)
        .single();

      if (fetchError) throw fetchError;

      const { data: userData } = await supabase.auth.getUser();

      // Create a new queue entry
      const { data, error } = await supabase
        .from("email_queue")
        .insert({
          branch_id: original.branch_id,
          to_email: original.to_email,
          subject: original.subject,
          html_content: original.html_content,
          from_email: original.from_email,
          from_name: original.from_name,
          attachments: original.attachments,
          handler_id: original.handler_id,
          template_id: original.template_id,
          created_by: userData?.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-queue"] });
      toast.success("Email queued for resend");
    },
    onError: (error) => {
      console.error("Error resending email:", error);
      toast.error("Failed to resend email");
    },
  });

  return {
    outbox: outboxQuery.data || [],
    sent: sentQuery.data || [],
    isLoadingOutbox: outboxQuery.isLoading,
    isLoadingSent: sentQuery.isLoading,
    addToQueue,
    retryEmail,
    deleteFromQueue,
    processQueue,
    resendEmail,
    refetchOutbox: outboxQuery.refetch,
    refetchSent: sentQuery.refetch,
  };
}
