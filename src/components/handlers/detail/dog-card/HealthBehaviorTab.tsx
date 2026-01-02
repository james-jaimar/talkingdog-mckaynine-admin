
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check } from "lucide-react";

interface HealthBehaviorTabProps {
  notes?: string;
  hasProblems?: boolean;
  problemsDetails?: string;
  emptyMessage: string;
  type: 'behavior' | 'medical';
}

export function HealthBehaviorTab({ 
  notes, 
  hasProblems, 
  problemsDetails, 
  emptyMessage,
  type 
}: HealthBehaviorTabProps) {
  const hasContent = notes || hasProblems !== undefined || problemsDetails;
  const label = type === 'behavior' ? 'Behavior' : 'Health';

  return (
    <div className="space-y-4">
      {hasProblems !== undefined && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{label} problems:</span>
          {hasProblems ? (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Yes
            </Badge>
          ) : (
            <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
              <Check className="h-3 w-3" />
              None reported
            </Badge>
          )}
        </div>
      )}

      {hasProblems && problemsDetails && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-1">
            {label} Problem Details
          </h4>
          <p className="text-sm whitespace-pre-wrap bg-yellow-50 border border-yellow-200 p-3 rounded-md">
            {problemsDetails}
          </p>
        </div>
      )}

      {notes && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-1">
            {label} Notes
          </h4>
          <p className="text-sm whitespace-pre-wrap">{notes}</p>
        </div>
      )}
      
      {!hasContent && (
        <p className="text-muted-foreground italic">{emptyMessage}</p>
      )}
    </div>
  );
}
