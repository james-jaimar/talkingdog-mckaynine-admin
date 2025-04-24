
import { format } from "date-fns";
import { useTermSelection } from "@/hooks/useTermSelection";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export function TermSelectorRow() {
  const {
    selectedYear,
    setSelectedYear,
    selectedTermNumber,
    setSelectedTermNumber,
    termData,
    isTermLoading,
    error,
    errorMessage,
    years,
    terms
  } = useTermSelection();

  const handleYearChange = (value: string) => {
    console.log('TermSelector - Changing year to:', value);
    setSelectedYear(parseInt(value));
  };

  const handleTermChange = (value: string) => {
    console.log('TermSelector - Changing term to:', value);
    if (value === '1' || value === '2' || value === '3' || value === '4') {
      setSelectedTermNumber(value);
    }
  };

  // Show error state if term fetch failed
  if (error || errorMessage) {
    return (
      <div className="border-b border-mckaynine-700 bg-mckaynine-600">
        <div className="container mx-auto px-4 py-2">
          <Alert variant="destructive">
            <AlertDescription>
              {errorMessage || (error instanceof Error ? error.message : "Error loading term data. Please try again.")}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-mckaynine-700 bg-mckaynine-600">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4 text-white">
            {isTermLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32 bg-mckaynine-500" />
                  <Skeleton className="h-4 w-48 bg-mckaynine-500" />
                </div>
              </div>
            ) : termData ? (
              <>
                <p className="text-lg font-semibold">
                  Term {termData.term_number}, {selectedYear}
                </p>
                <p className="text-sm text-gray-200">
                  {format(new Date(termData.start_date), 'dd MMM yyyy')} - {format(new Date(termData.end_date), 'dd MMM yyyy')}
                </p>
              </>
            ) : (
              <p className="text-sm">Select a term</p>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div>
              <Select
                value={selectedYear.toString()}
                onValueChange={handleYearChange}
                disabled={isTermLoading}
              >
                <SelectTrigger className="w-[120px] bg-white text-gray-800">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select
                value={selectedTermNumber}
                onValueChange={handleTermChange}
                disabled={isTermLoading}
              >
                <SelectTrigger className="w-[120px] bg-white text-gray-800">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={term} value={term}>
                      Term {term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
