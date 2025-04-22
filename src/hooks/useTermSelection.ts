
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useTermSelection() {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedTermNumber, setSelectedTermNumber] = useState<string>('2');

  const { data: termData } = useQuery({
    queryKey: ['term', selectedYear, selectedTermNumber],
    queryFn: async () => {
      const { data, error } = await supabase
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
        .single();

      if (error) throw error;
      return data;
    }
  });

  // Generate years array (2025 to 2029)
  const years = Array.from({ length: 5 }, (_, i) => 2025 + i);
  
  // Generate terms array (1 to 4)
  const terms = Array.from({ length: 4 }, (_, i) => String(i + 1) as '1' | '2' | '3' | '4');

  return {
    selectedYear,
    setSelectedYear,
    selectedTermNumber,
    setSelectedTermNumber,
    termData,
    years,
    terms,
  };
}
