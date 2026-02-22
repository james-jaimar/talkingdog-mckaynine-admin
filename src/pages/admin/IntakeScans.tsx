import { useState, useEffect, useCallback, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { UploadPanel } from "@/components/intake-scans/UploadPanel";
import { ReviewPanel } from "@/components/intake-scans/ReviewPanel";
import { StatusPanel } from "@/components/intake-scans/StatusPanel";
import { ScanProcessingJob, ExtractedData } from "@/components/intake-scans/types";
import { useProcessingJobs } from "@/components/intake-scans/hooks/useProcessingJobs";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";

export default function IntakeScans() {
  const [selectedJob, setSelectedJob] = useState<ScanProcessingJob | null>(null);
  const [editedData, setEditedData] = useState<ExtractedData | null>(null);
  const { jobs, updateJob } = useProcessingJobs();

  // Update local state when selected job changes
  useEffect(() => {
    if (selectedJob) {
      setEditedData(selectedJob.extracted_data || null);
    } else {
      setEditedData(null);
    }
  }, [selectedJob?.id, selectedJob?.extracted_data]);

  // Keep selected job in sync with jobs list
  useEffect(() => {
    if (selectedJob) {
      const updatedJob = jobs.find(j => j.id === selectedJob.id);
      if (updatedJob && updatedJob.updated_at !== selectedJob.updated_at) {
        setSelectedJob(updatedJob);
      }
    }
  }, [jobs, selectedJob?.id]);

  const handleSelectJob = (job: ScanProcessingJob) => {
    setSelectedJob(job);
  };

  // Debounced database update to prevent lag during typing
  const debouncedUpdateJob = useDebouncedCallback(
    async (jobId: string, data: ExtractedData) => {
      await updateJob({
        id: jobId,
        updates: {
          extracted_data: data
        }
      });
    },
    500 // Wait 500ms after user stops typing
  );

  const handleUpdateData = (data: ExtractedData) => {
    // Update local state immediately for responsive UI
    setEditedData(data);
    
    // Debounce the database update
    if (selectedJob) {
      debouncedUpdateJob(selectedJob.id, data);
    }
  };

  const handleProcessNext = () => {
    // Find the next job that needs processing
    const nextJob = jobs.find(j => 
      j.id !== selectedJob?.id && 
      (j.status === 'needs_review' || j.status === 'ready_to_save' || j.status === 'queued')
    );
    
    if (nextJob) {
      setSelectedJob(nextJob);
    } else {
      setSelectedJob(null);
    }
  };

  return (
    <DashboardLayout fullWidth>
      <Helmet>
        <title>Intake Scans - McKaynine</title>
      </Helmet>

      <div className="h-[calc(100vh-8rem)]">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Scanned Enrollment Forms</h1>
          <p className="text-muted-foreground">
            Upload scanned enrollment forms to extract and import handler data
          </p>
        </div>

        <div className="grid grid-cols-12 gap-4 h-[calc(100%-4rem)]">
          {/* Left Panel - Upload & Queue */}
          <div className="col-span-4 h-full min-w-0 overflow-hidden">
            <UploadPanel
              onSelectJob={handleSelectJob}
              selectedJobId={selectedJob?.id || null}
            />
          </div>

          {/* Center Panel - Review & Edit */}
          <div className="col-span-5 h-full">
            <ReviewPanel 
              job={selectedJob}
              editedData={editedData}
              onUpdateData={handleUpdateData}
            />
          </div>

          {/* Right Panel - Status & Actions */}
          <div className="col-span-3 h-full">
            <StatusPanel 
              job={selectedJob}
              extractedData={editedData}
              onProcessNext={handleProcessNext}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
