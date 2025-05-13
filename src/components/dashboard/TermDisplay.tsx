
import { useTerm } from "@/context/TermContext";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { CalendarDays, Clock, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function TermDisplay() {
  const { termData, isTermLoading, error, selectedYear } = useTerm();
  const errorMessage = error?.message || null;

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
      <Alert variant="destructive">
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
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

  // Ensure we have valid dates by parsing them properly
  // Explicitly create new Date objects to ensure proper date handling
  const startDate = termData.start_date ? new Date(termData.start_date) : new Date();
  const endDate = termData.end_date ? new Date(termData.end_date) : new Date();
  
  // Log date information for debugging
  console.log("TermDisplay dates:", {
    startDateRaw: termData.start_date,
    endDateRaw: termData.end_date,
    startDateObj: startDate,
    endDateObj: endDate,
    year: termData.academic_years?.year || selectedYear
  });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center mb-3">
          <CalendarDays className="h-5 w-5 mr-3 text-mckaynine-600" />
          <h3 className="text-lg font-semibold">
            Term {termData.term_number}, {termData.academic_years?.year || selectedYear}
          </h3>
        </div>
        <div className="flex items-center text-sm text-gray-600 ml-8">
          <Clock className="h-4 w-4 mr-2" />
          <span>
            {format(startDate, 'dd MMM yyyy')} - {format(endDate, 'dd MMM yyyy')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
