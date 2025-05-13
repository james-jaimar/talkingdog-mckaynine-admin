
import React, { useState, useEffect } from 'react';
import { TrainerPaymentsTable } from './TrainerPaymentsTable';
import { useTrainerPayments } from '@/hooks/useTrainerPayments';
import { TrainerPaymentsSummary } from './TrainerPaymentsSummary';
import { useTerm } from '@/context/TermContext';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';

interface TrainerReportsTabProps {
  dateRange: { from: Date; to: Date };
  branchId?: string;
}

export const TrainerReportsTab: React.FC<TrainerReportsTabProps> = ({ dateRange, branchId }) => {
  const { termData } = useTerm();
  const [filterByTerm, setFilterByTerm] = useState(true);
  
  // Use term data to construct a date range if available and filter is enabled
  const effectiveDateRange = filterByTerm && termData ? {
    from: new Date(termData.startDate),
    to: new Date(termData.endDate)
  } : dateRange;
  
  // Format date range for display
  const dateRangeStr = `${format(effectiveDateRange.from, 'MMM d, yyyy')} - ${format(effectiveDateRange.to, 'MMM d, yyyy')}`;
  
  // Get trainer payments data
  const { 
    trainerPaymentsData, 
    isLoading, 
    error,
    refreshTrainerPayments 
  } = useTrainerPayments(
    branchId,
    effectiveDateRange.from.toISOString(),
    effectiveDateRange.to.toISOString()
  );
  
  // Recalculate when term changes if we're filtering by term
  useEffect(() => {
    if (filterByTerm && termData) {
      refreshTrainerPayments();
    }
  }, [filterByTerm, termData?.id, refreshTrainerPayments]);
  
  const toggleFilter = () => {
    setFilterByTerm(!filterByTerm);
  };
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">
          Trainer Payments
          {termData && (
            <span className="ml-2 text-lg font-normal">
              {filterByTerm ? `(Term ${termData.termNumber})` : `(Custom Date Range)`}
            </span>
          )}
        </h2>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-sm">
            <input 
              type="checkbox" 
              checked={filterByTerm}
              onChange={toggleFilter}
              className="rounded border-gray-300"
            />
            <span>{filterByTerm ? 'Using current term dates' : 'Using custom date range'}</span>
          </label>
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground">
        Date range: {dateRangeStr}
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          <TrainerPaymentsSummary data={trainerPaymentsData} />
          <TrainerPaymentsTable 
            data={trainerPaymentsData} 
            branchId={branchId}
            dateRange={effectiveDateRange}
            onRefresh={refreshTrainerPayments}
          />
        </>
      )}
    </div>
  );
};
