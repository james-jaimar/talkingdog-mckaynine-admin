
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TermData, TermNumber } from './types';
import { calculateTermDateRange } from './utils';

export function useTermQuery(
  selectedYear: number,
  selectedTermNumber: TermNumber, // Fixed: Use the TermNumber type instead of string
  onError: (error: Error) => void
) {
  return useQuery({
    queryKey: ['term', selectedYear, selectedTermNumber],
    queryFn: async () => {
      try {
        const { data, error: dbError } = await supabase
          .from('terms')
          .select(`
            id,
            term_number,
            start_date,
            end_date,
            academic_years!inner (
              year
            )
          `)
          .eq('academic_years.year', selectedYear)
          .eq('term_number', selectedTermNumber)
          .limit(1);

        if (dbError) {
          onError(new Error(`Error fetching term: ${dbError.message}`));
          return null;
        }
        
        if (!data || data.length === 0) {
          onError(new Error(`No term found for ${selectedYear}, Term ${selectedTermNumber}`));
          return null;
        }

        // Apply the term date range calculation
        const termData = data[0] as TermData;
        const { startDate, endDate } = calculateTermDateRange(selectedYear, termData.term_number);
        
        termData.start_date = startDate;
        termData.end_date = endDate;
        
        return termData;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        onError(new Error(errorMsg));
        return null;
      }
    },
    staleTime: 30 * 1000, // Cache term data for 30 seconds
  });
}
