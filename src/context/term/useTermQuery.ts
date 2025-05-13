
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TermData } from "./types";
import { getDefaultTermsForCurrentYear } from "./utils";

export function useTermQuery() {
  // Query for fetching terms from the database
  const termQuery = useQuery({
    queryKey: ["terms"],
    queryFn: async (): Promise<TermData[]> => {
      try {
        const { data: termsData, error } = await supabase
          .from("terms")
          .select(`
            id,
            term_number,
            start_date,
            end_date,
            current,
            academic_years (
              id,
              year
            )
          `)
          .order("academic_years(year)", { ascending: false })
          .order("term_number", { ascending: true });

        if (error) throw error;

        // Transform the data to match our TermData type
        const terms: TermData[] = termsData.map((term) => ({
          id: term.id,
          termNumber: term.term_number,
          year: term.academic_years?.year || new Date().getFullYear(),
          startDate: term.start_date,
          endDate: term.end_date,
          current: term.current || false,
        }));

        // If there are no terms in the database, return the default ones
        if (terms.length === 0) {
          return getDefaultTermsForCurrentYear();
        }

        return terms;
      } catch (error) {
        console.error("Error fetching terms:", error);
        
        // Return default terms if there's an error
        return getDefaultTermsForCurrentYear();
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Get available terms or defaults if none available
  const availableTerms = termQuery.data?.length 
    ? termQuery.data 
    : getDefaultTermsForCurrentYear();

  // Function to refresh terms data
  const refreshTerms = () => {
    termQuery.refetch();
  };

  return { termQuery, availableTerms, refreshTerms };
}
