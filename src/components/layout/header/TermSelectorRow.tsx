
import { format } from "date-fns";
import { useTerm } from "@/context/TermContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function TermSelectorRow() {
  const {
    selectedYear,
    setSelectedYear,
    selectedTermNumber,
    setSelectedTermNumber,
    termData,
    isTermLoading,
    error,
    years,
    terms
  } = useTerm();
  
  const errorMessage = error?.message || '';
  
  const handleYearChange = (value: string) => {
    setSelectedYear(parseInt(value));
  };

  const handleTermChange = (value: string) => {
    if (value === '1' || value === '2' || value === '3' || value === '4') {
      setSelectedTermNumber(value as '1' | '2' | '3' | '4');
    }
  };

  if (error) {
    return (
      <div className="border-b border-mckaynine-700 bg-mckaynine-600">
        <div className="container mx-auto px-4 py-2">
          <Alert variant="destructive">
            <AlertDescription>
              {errorMessage || "Error loading term data. Please try again."}
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
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold">
                      Term {termData.term_number}, {selectedYear}
                    </p>
                    {termData.current && (
                      <Badge variant="secondary" className="bg-green-500 text-white">Current</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-200">
                    {termData.start_date ? format(new Date(termData.start_date), 'dd MMM yyyy') : ''} - 
                    {termData.end_date ? format(new Date(termData.end_date), 'dd MMM yyyy') : ''}
                  </p>
                </div>
              </div>
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
