
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
      console.log(`📆 Fetching term data for Term ${termNumber}, Year ${year}`);
      
      if (!termNumber || !year) {
        console.log("⚠️ No term number or year provided, returning null");
        return null;
      }

      // Validate that term number is one of the allowed values
      if (!["1", "2", "3", "4"].includes(termNumber)) {
        console.error(`❌ Invalid term number: ${termNumber}. Must be one of: "1", "2", "3", "4"`);
        return null;
      }

      // Explicitly cast termNumber to the union type that Supabase expects
      const validTermNumber = termNumber as "1" | "2" | "3" | "4";
      
      try {
        // First check if there's a current term in this year and term number
        const { data: currentTerm, error: currentTermError } = await supabase
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
          .eq('current', true)
          .maybeSingle();
          
        if (currentTermError) {
          console.error("❌ Error fetching current term:", currentTermError);
        }
        
        // If there's a current term, return it
        if (currentTerm) {
          console.log("✅ Found current term:", currentTerm);
          return currentTerm as TermData;
        }
        
        // Otherwise get all terms matching criteria and take the first one
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
          .order('start_date', { ascending: false })
          .limit(1);

        if (error) {
          console.error("❌ Error fetching term:", error);
          throw error;
        }
        
        if (!data || data.length === 0) {
          console.log("⚠️ No terms found with the given criteria");
          return null;
        }
        
        console.log("✅ Term data fetched:", data[0]);
        return data[0] as TermData;
      } catch (error) {
        console.error("❌ Error fetching term:", error);
        throw error;
      }
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
