
import { format } from "date-fns";
import { useTermSelection } from "@/hooks/useTermSelection";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export function TermSelectorRow() {
  const {
    selectedYear,
    setSelectedYear,
    selectedTermNumber,
    setSelectedTermNumber,
    termData,
    isTermLoading,
    years,
    terms,
    invalidateTermDependentQueries
  } = useTermSelection();
  
  const toast = useToast();
  const queryClient = useQueryClient();

  const handleYearChange = (value: string) => {
    console.log('TermSelector - Changing year to:', value);
    setSelectedYear(parseInt(value));
    
    // Force immediate invalidation
    setTimeout(() => {
      invalidateTermDependentQueries();
    }, 10);
  };

  const handleTermChange = (value: string) => {
    console.log('TermSelector - Changing term to:', value);
    if (value === '1' || value === '2' || value === '3' || value === '4') {
      setSelectedTermNumber(value);
      
      // Force immediate invalidation
      setTimeout(() => {
        invalidateTermDependentQueries();
      }, 10);
    }
  };

  // Force an immediate refetch when term data changes
  useEffect(() => {
    if (termData) {
      console.log('TermSelector - Term data updated, aggressively invalidating queries');
      
      // Use a short timeout to ensure state updates have settled
      setTimeout(() => {
        // Forcefully invalidate and refetch every query in the cache
        queryClient.invalidateQueries({ type: 'all' });
        
        toast.toast({
          description: `Term updated to Term ${termData.term_number}, ${selectedYear}`,
          duration: 2000,
        });
      }, 100);
    }
  }, [termData?.id, queryClient, toast, termData, selectedYear]);

  return (
    <div className="border-b border-mckaynine-700 bg-mckaynine-600">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4 text-white">
            {isTermLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-32 bg-mckaynine-500" />
                <Skeleton className="h-4 w-48 bg-mckaynine-500" />
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
