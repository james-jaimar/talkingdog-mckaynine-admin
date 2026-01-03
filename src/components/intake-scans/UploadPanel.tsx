import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileText, Loader2, Trash2, Eye, Play, RefreshCw } from "lucide-react";
import { ScanProcessingJob } from "./types";
import { useProcessingJobs } from "./hooks/useProcessingJobs";
import { useExtraction } from "./hooks/useExtraction";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UploadPanelProps {
  onSelectJob: (job: ScanProcessingJob) => void;
  selectedJobId: string | null;
}

export function UploadPanel({ onSelectJob, selectedJobId }: UploadPanelProps) {
  const [uploading, setUploading] = useState(false);
  const { jobs, isLoading, createJob, deleteJob, refetch } = useProcessingJobs();
  const { extract, isExtracting } = useExtraction();
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    
    try {
      for (const file of acceptedFiles) {
        // Upload file to storage
        const fileName = `${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('scanned-forms')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        // Create job record with file path (not public URL - bucket is private)
        await createJob({
          filename: file.name,
          file_url: fileName
        });

        toast.success(`Uploaded ${file.name}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  }, [createJob]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    multiple: true
  });

  const handleExtract = async (job: ScanProcessingJob) => {
    setProcessingJobId(job.id);
    try {
      await extract({ file_url: job.file_url, job_id: job.id });
      refetch();
      toast.success('Extraction complete');
    } catch (error) {
      console.error('Extraction error:', error);
    } finally {
      setProcessingJobId(null);
    }
  };

  const handleProcessAll = async () => {
    const queuedJobs = jobs.filter(j => j.status === 'queued');
    for (const job of queuedJobs) {
      await handleExtract(job);
    }
  };

  const getStatusBadge = (status: ScanProcessingJob['status']) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      queued: { variant: 'secondary', label: 'Queued' },
      processing: { variant: 'default', label: 'Processing' },
      needs_review: { variant: 'outline', label: 'Needs Review' },
      ready_to_save: { variant: 'default', label: 'Ready to Save' },
      saved: { variant: 'default', label: 'Saved' },
      error: { variant: 'destructive', label: 'Error' }
    };
    const config = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Upload & Queue</span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleProcessAll}
            disabled={!jobs.some(j => j.status === 'queued') || isExtracting}
          >
            <Play className="h-4 w-4 mr-1" />
            Process All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
            uploading && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} disabled={uploading} />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drop PDF or image files here, or click to select
              </p>
              <p className="text-xs text-muted-foreground">
                Supports PDF, JPG, PNG
              </p>
            </div>
          )}
        </div>

        {/* Queue list */}
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                Loading...
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No files uploaded yet
              </div>
            ) : (
              jobs.map(job => (
                <div
                  key={job.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                    selectedJobId === job.id ? "bg-accent border-primary" : "hover:bg-accent/50"
                  )}
                  onClick={() => onSelectJob(job)}
                >
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{job.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {job.extracted_data?.owner?.first_name 
                        ? `${job.extracted_data.owner.first_name} ${job.extracted_data.owner.last_name || ''}`
                        : 'Not extracted'}
                      {job.extracted_data?.dogs?.length 
                        ? ` · ${job.extracted_data.dogs.length} dog(s)`
                        : ''}
                    </p>
                  </div>
                  {getStatusBadge(job.status)}
                  <div className="flex items-center gap-1">
                    {job.status === 'queued' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExtract(job);
                        }}
                        disabled={processingJobId === job.id}
                      >
                        {processingJobId === job.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                    {job.status === 'error' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExtract(job);
                        }}
                        disabled={processingJobId === job.id}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteJob(job.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
