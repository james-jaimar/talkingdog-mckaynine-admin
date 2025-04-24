
import { useTermSelection } from "@/hooks/useTermSelection";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { CalendarDays, Loader2 } from "lucide-react";

export function TermDisplay() {
  const { termData, isTermLoading, errorMessage } = useTermSelection();

  if (isTermLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-4">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span>Loading term information...</span>
        </CardContent>
      </Card>
    );
  }

  if (errorMessage) {
    return (
      <Card className="bg-red-50">
        <CardContent className="p-4 text-red-600">
          <p>{errorMessage}</p>
        </CardContent>
      </Card>
    );
  }

  if (!termData) {
    return (
      <Card>
        <CardContent className="p-4 text-gray-500">
          <p>No active term selected. Please select a term from the dropdown.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex items-center p-4">
        <CalendarDays className="h-5 w-5 mr-3 text-mckaynine-600" />
        <div>
          <h3 className="font-medium">Term {termData.term_number}</h3>
          <p className="text-sm text-gray-500">
            {format(new Date(termData.start_date), 'dd MMM yyyy')} - {format(new Date(termData.end_date), 'dd MMM yyyy')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
