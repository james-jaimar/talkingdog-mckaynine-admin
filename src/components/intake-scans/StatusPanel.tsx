import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScanProcessingJob, ExtractedData } from "./types";
import { ConfidenceSummary } from "./ConfidenceIndicator";
import { useSaveToDatabase } from "./hooks/useSaveToDatabase";
import { Save, AlertTriangle, CheckCircle, ExternalLink, ChevronRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface StatusPanelProps {
  job: ScanProcessingJob | null;
  extractedData: ExtractedData | null;
  onProcessNext: () => void;
}

export function StatusPanel({ job, extractedData, onProcessNext }: StatusPanelProps) {
  const { saveToDatabase, isSaving } = useSaveToDatabase();

  if (!job) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Status</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Select a job to see its status
        </CardContent>
      </Card>
    );
  }

  const handleSave = async () => {
    if (!extractedData) return;
    
    await saveToDatabase({ job, extractedData });
  };

  // Validation checks
  const validationErrors: string[] = [];
  if (extractedData) {
    if (!extractedData.owner.first_name) validationErrors.push('Owner first name is required');
    if (!extractedData.owner.email) validationErrors.push('Owner email is required');
    if (extractedData.dogs.length === 0) validationErrors.push('At least one dog is required');
    extractedData.dogs.forEach((dog, idx) => {
      if (!dog.name) validationErrors.push(`Dog ${idx + 1} name is required`);
      if (!dog.breed) validationErrors.push(`Dog ${idx + 1} breed is required`);
    });
  }

  const canSave = job.status !== 'saved' && 
                  job.status !== 'queued' && 
                  job.status !== 'processing' &&
                  job.status !== 'error' &&
                  validationErrors.length === 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Status & Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <StatusBadge status={job.status} />
        </div>

        {/* Confidence Summary */}
        {job.field_confidence && (
          <div>
            <h4 className="text-sm font-medium mb-2">Field Confidence</h4>
            <ConfidenceSummary confidence={job.field_confidence} />
          </div>
        )}

        {/* Notes for Review */}
        {job.notes_for_review && job.notes_for_review.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Review Notes
            </h4>
            <ScrollArea className="max-h-32">
              <ul className="text-sm space-y-1">
                {job.notes_for_review.map((note, idx) => (
                  <li key={idx} className="text-muted-foreground">• {note}</li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="text-sm mt-1">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>• {err}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {job.error_message && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{job.error_message}</AlertDescription>
          </Alert>
        )}

        {/* Save Button */}
        {job.status !== 'saved' && (
          <Button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className="w-full"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save to Database
              </>
            )}
          </Button>
        )}

        {/* Saved Success */}
        {job.status === 'saved' && (
          <div className="space-y-3">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Successfully saved to database
              </AlertDescription>
            </Alert>

            {job.matched_client_id && (
              <Button variant="outline" className="w-full" asChild>
                <Link to={`/handlers/${job.matched_client_id}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Handler Profile
                </Link>
              </Button>
            )}

            <Button variant="outline" className="w-full" onClick={onProcessNext}>
              <ChevronRight className="h-4 w-4 mr-2" />
              Process Next
            </Button>
          </div>
        )}

        {/* Summary */}
        {extractedData && (
          <div className="mt-auto pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Summary</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                <span className="font-medium">Owner:</span>{' '}
                {extractedData.owner.first_name} {extractedData.owner.last_name}
              </p>
              <p>
                <span className="font-medium">Email:</span>{' '}
                {extractedData.owner.email || 'Not provided'}
              </p>
              <p>
                <span className="font-medium">Dogs:</span>{' '}
                {extractedData.dogs.map(d => d.name || 'Unnamed').join(', ')}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: ScanProcessingJob['status'] }) {
  const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    queued: { variant: 'secondary', label: 'Queued' },
    processing: { variant: 'default', label: 'Processing' },
    needs_review: { variant: 'outline', label: 'Needs Review' },
    ready_to_save: { variant: 'default', label: 'Ready to Save' },
    saved: { variant: 'default', label: 'Saved' },
    error: { variant: 'destructive', label: 'Error' }
  };
  
  const { variant, label } = config[status] || { variant: 'secondary', label: status };
  
  return <Badge variant={variant}>{label}</Badge>;
}
