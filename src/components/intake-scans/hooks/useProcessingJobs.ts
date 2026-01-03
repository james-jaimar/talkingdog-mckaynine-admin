import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScanProcessingJob, ExtractedData } from "../types";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

export function useProcessingJobs() {
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading, refetch } = useQuery({
    queryKey: ['scan-processing-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scan_processing_jobs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform the data to match our types
      return (data || []).map(job => ({
        ...job,
        extracted_data: job.extracted_data as unknown as ExtractedData | null,
        field_confidence: job.field_confidence as unknown as Record<string, 'high' | 'medium' | 'low'> | null,
        status: job.status as ScanProcessingJob['status']
      })) as ScanProcessingJob[];
    },
    refetchInterval: 5000 // Poll for updates every 5 seconds
  });

  const createJobMutation = useMutation({
    mutationFn: async ({ filename, file_url }: { filename: string; file_url: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('scan_processing_jobs')
        .insert({
          filename,
          file_url,
          status: 'queued',
          uploaded_by: user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        ...data,
        extracted_data: data.extracted_data as unknown as ExtractedData | null,
        field_confidence: data.field_confidence as unknown as Record<string, 'high' | 'medium' | 'low'> | null,
        status: data.status as ScanProcessingJob['status']
      } as ScanProcessingJob;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scan-processing-jobs'] });
    },
    onError: (error) => {
      console.error('Error creating job:', error);
      toast.error('Failed to create processing job');
    }
  });

  const updateJobMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ScanProcessingJob> }) => {
      // Convert ExtractedData to Json for Supabase
      const supabaseUpdates = {
        ...updates,
        extracted_data: updates.extracted_data as unknown as Json,
        field_confidence: updates.field_confidence as unknown as Json
      };
      
      const { data, error } = await supabase
        .from('scan_processing_jobs')
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        ...data,
        extracted_data: data.extracted_data as unknown as ExtractedData | null,
        field_confidence: data.field_confidence as unknown as Record<string, 'high' | 'medium' | 'low'> | null,
        status: data.status as ScanProcessingJob['status']
      } as ScanProcessingJob;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scan-processing-jobs'] });
    }
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scan_processing_jobs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scan-processing-jobs'] });
      toast.success('Job deleted');
    },
    onError: (error) => {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job');
    }
  });

  return {
    jobs,
    isLoading,
    refetch,
    createJob: createJobMutation.mutateAsync,
    updateJob: updateJobMutation.mutateAsync,
    deleteJob: deleteJobMutation.mutateAsync,
    isCreating: createJobMutation.isPending,
    isUpdating: updateJobMutation.isPending
  };
}
