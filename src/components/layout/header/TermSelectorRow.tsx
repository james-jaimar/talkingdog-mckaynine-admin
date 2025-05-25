
import { format } from "date-fns";
import { useTerm } from "@/context/TermContext";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Calendar, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
    terms,
    refetchTerm
  } = useTerm();
  
  const queryClient = useQueryClient();
  const errorMessage = error?.message || '';
  
  const handleYearChange = (value: string) => {
    setSelectedYear(parseInt(value));
    toast.info(`Changing year to ${value}`, { duration: 2000 });
  };

  const handleTermChange = (value: string) => {
    if (value === '1' || value === '2' || value === '3' || value === '4') {
      setSelectedTermNumber(value as '1' | '2' | '3' | '4');
      toast.info(`Changing to Term ${value}`, { duration: 2000 });
      
      // Force invalidate financial queries when changing terms
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['financial-bookings'] });
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
      }, 100);
    }
  };

  const handleManualRefresh = () => {
    if (refetchTerm) {
      refetchTerm();
      queryClient.invalidateQueries({ queryKey: ['financial-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success("Term data refreshed");
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

  // Calculate if we're displaying initial data or actual loading state
  const displaySelectionControls = !isTermLoading || termData;

  return (
    <div className="border-b border-mckaynine-700 bg-mckaynine-600">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4 text-white">
            {isTermLoading && !termData ? (
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
                disabled={isTermLoading && !termData}
              >
                <SelectTrigger className="w-[120px] bg-white text-gray-900 border-gray-300">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()} className="text-gray-900">
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
                disabled={isTermLoading && !termData}
              >
                <SelectTrigger className="w-[120px] bg-white text-gray-900 border-gray-300">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {terms.map((term) => (
                    <SelectItem key={term} value={term} className="text-gray-900">
                      Term {term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <button
              onClick={handleManualRefresh}
              className="p-2 rounded-full hover:bg-mckaynine-700 transition-colors"
              title="Refresh term data"
              disabled={isTermLoading}
            >
              {isTermLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              ) : (
                <RefreshCw className="h-5 w-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
