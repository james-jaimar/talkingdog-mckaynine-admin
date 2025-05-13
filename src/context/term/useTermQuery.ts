
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TermData } from "./types";

export function useTermQuery(termNumber: string | null, year: number | null) {
  const {
    data: termData,
    isLoading: isTermLoading,
    error,
    refetch: refetchTerm
  } = useQuery({
    queryKey: ['term', termNumber, year],
    queryFn: async (): Promise<TermData | null> => {
      console.log(`Fetching term data for Term ${termNumber}, Year ${year}`);
      
      if (!termNumber || !year) {
        return null;
      }

      // Validate that term number is one of the allowed values
      if (!["1", "2", "3", "4"].includes(termNumber)) {
        console.error(`Invalid term number: ${termNumber}. Must be one of: "1", "2", "3", "4"`);
        return null;
      }

      // Explicitly cast termNumber to the union type that Supabase expects
      const validTermNumber = termNumber as "1" | "2" | "3" | "4";
      
      const { data, error } = await supabase
        .from('terms')
        .select(`
          id, 
          term_number,
          start_date,
          end_date,
          current,
          academic_years(year)
        `)
        .eq('term_number', validTermNumber)
        .eq('academic_years.year', year)
        .single();

      if (error) {
        console.error("Error fetching term:", error);
        throw error;
      }
      
      console.log("Term data fetched:", data);
      return data as TermData;
    },
    enabled: !!termNumber && !!year,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    termData,
    isTermLoading,
    error,
    refetchTerm
  };
}
