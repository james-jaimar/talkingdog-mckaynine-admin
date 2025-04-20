
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, MinusCircle } from "lucide-react";

interface ConsentStatusBadgeProps {
  status: 'yes' | 'no' | 'not_marked';
  className?: string;
}

export function ConsentStatusBadge({ status, className }: ConsentStatusBadgeProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {status === 'yes' && (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      )}
      {status === 'no' && (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      {status === 'not_marked' && (
        <MinusCircle className="h-4 w-4 text-gray-400" />
      )}
    </div>
  );
}
