
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TermData, LegacyTermData } from "./types";
import { getDefaultTermsForCurrentYear } from "./utils";

// Helper function to convert database term format to our frontend model
function mapDbTermToTermData(dbTerm: LegacyTermData): TermData {
  return {
    id: dbTerm.id,
    termNumber: dbTerm.term_number, // Map from snake_case to camelCase
    year: dbTerm.academic_years?.year || new Date().getFullYear(),
    startDate: dbTerm.start_date,
    endDate: dbTerm.end_date,
    current: dbTerm.current || false,
  };
}

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
        const terms: TermData[] = termsData.map(mapDbTermToTermData);

        // If there are no terms in the database, return the default ones
        if (terms.length === 0) {
          console.log("No terms found in database, using defaults");
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
