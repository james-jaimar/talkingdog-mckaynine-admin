import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useExtraction() {
  const extractMutation = useMutation({
    mutationFn: async ({ file_url, job_id }: { file_url: string; job_id: string }) => {
      const { data, error } = await supabase.functions.invoke('extract-enrollment-scan', {
        body: { file_url, job_id }
      });
      
      if (error) throw error;
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data;
    },
    onError: (error) => {
      console.error('Extraction error:', error);
      toast.error(`Extraction failed: ${error.message}`);
    }
  });

  return {
    extract: extractMutation.mutateAsync,
    isExtracting: extractMutation.isPending
  };
}
