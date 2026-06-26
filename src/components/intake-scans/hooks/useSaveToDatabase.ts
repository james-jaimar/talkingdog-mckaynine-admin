import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExtractedData, ScanProcessingJob } from "../types";
import { toast } from "sonner";
import { saveEnrollmentSubmission } from "@/lib/enrollments/saveEnrollmentSubmission";

export function useSaveToDatabase() {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async ({ job, extractedData }: { job: ScanProcessingJob; extractedData: ExtractedData }) => {
      const result = await saveEnrollmentSubmission(extractedData);

      const { error: jobUpdateError } = await supabase
        .from("scan_processing_jobs")
        .update({
          status: "saved",
          matched_client_id: result.clientId,
          created_dog_ids: result.dogIds,
          enrollment_ids: result.enrollmentIds,
        })
        .eq("id", job.id);

      if (jobUpdateError) console.warn("Job status update failed (data still saved):", jobUpdateError);
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["scan-processing-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["handlers"] });
      toast.success(`Saved: 1 handler, ${result.dogIds.length} dog(s), ${result.enrollmentIds.length} enrollment(s)`);
    },
    onError: (error: any) => {
      console.error("Save error:", error);
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  return {
    saveToDatabase: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
}
