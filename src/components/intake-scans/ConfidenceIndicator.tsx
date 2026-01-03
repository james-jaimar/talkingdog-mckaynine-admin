import { cn } from "@/lib/utils";
import { ConfidenceLevel } from "./types";

interface ConfidenceIndicatorProps {
  level: ConfidenceLevel;
  showLabel?: boolean;
  className?: string;
}

export function ConfidenceIndicator({ level, showLabel = false, className }: ConfidenceIndicatorProps) {
  const colors = {
    high: 'bg-green-500',
    medium: 'bg-amber-500',
    low: 'bg-red-500'
  };

  const labels = {
    high: 'High confidence',
    medium: 'Medium confidence', 
    low: 'Low confidence'
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className={cn("w-2 h-2 rounded-full", colors[level])} />
      {showLabel && (
        <span className="text-xs text-muted-foreground">{labels[level]}</span>
      )}
    </div>
  );
}

interface ConfidenceSummaryProps {
  confidence: Record<string, ConfidenceLevel> | null;
}

export function ConfidenceSummary({ confidence }: ConfidenceSummaryProps) {
  if (!confidence) return null;

  const counts = {
    high: 0,
    medium: 0,
    low: 0
  };

  Object.values(confidence).forEach(level => {
    if (counts[level] !== undefined) {
      counts[level]++;
    }
  });

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span>{counts.high} high</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-amber-500" />
        <span>{counts.medium} medium</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span>{counts.low} low</span>
      </div>
    </div>
  );
}
