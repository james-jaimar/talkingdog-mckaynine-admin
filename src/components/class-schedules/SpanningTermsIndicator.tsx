
import { useClassTermSpanning } from "@/hooks/useClassTermSpanning";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar } from "lucide-react";

interface SpanningTermsIndicatorProps {
  classId: string;
}

export function SpanningTermsIndicator({ classId }: SpanningTermsIndicatorProps) {
  const { data, isLoading } = useClassTermSpanning(classId);
  
  if (isLoading || !data?.isSpanning) {
    return null;
  }
  
  const { terms } = data;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="ml-2 flex gap-1 items-center border-amber-300 text-amber-700 bg-amber-50">
            <Calendar className="h-3 w-3" />
            <span>Multi-Term</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="w-auto max-w-xs">
          <p>This class spans across multiple terms:</p>
          <ul className="list-disc pl-5 mt-1">
            {terms.map((term) => (
              <li key={term.id} className="text-sm">
                Term {term.term_number} ({term.academic_years.year})
              </li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
