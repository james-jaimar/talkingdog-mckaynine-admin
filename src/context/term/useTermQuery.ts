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
        // First find the academic year record matching the selected year
        const { data: academicYearData, error: academicYearError } = await supabase
          .from('academic_years')
          .select('id, year')
          .eq('year', year)
          .single();
          
        if (academicYearError) {
          console.error("❌ Error fetching academic year:", academicYearError);
          
          // If the academic year doesn't exist, check if we need to create it
          if (academicYearError.code === 'PGRST116') {
            console.log(`⚠️ Academic year ${year} not found, will query terms directly`);
          } else {
            throw academicYearError;
          }
        }
        
        const academicYearId = academicYearData?.id;
        
        // Try to find a current term in this year and term number first
        let query = supabase
          .from('terms')
          .select(`
            id, 
            term_number,
            start_date,
            end_date,
            current,
            academic_years(year)
          `);
          
        // If we have a valid academic year ID, use it for the query
        if (academicYearId) {
          query = query
            .eq('academic_year_id', academicYearId)
            .eq('term_number', validTermNumber);
        } else {
          // Otherwise, try to join with academic_years and filter
          query = query
            .eq('term_number', validTermNumber)
            .eq('academic_years.year', year);
        }
        
        // Try to get the current term for this period first
        const { data: currentTerm, error: currentTermError } = await query
          .eq('current', true)
          .maybeSingle();  // Use maybeSingle instead of single to avoid errors when no row is found
          
        if (currentTermError && currentTermError.code !== 'PGRST116') {
          console.error("❌ Error fetching current term:", currentTermError);
          throw currentTermError;
        }
        
        // If there's a current term, return it
        if (currentTerm) {
          console.log("✅ Found current term:", currentTerm);
          return currentTerm as TermData;
        }
        
        // Otherwise get any term matching criteria
        const { data, error } = await query
          .order('start_date', { ascending: false })
          .limit(1);

        if (error) {
          console.error("❌ Error fetching term:", error);
          throw error;
        }
        
        if (!data || data.length === 0) {
          console.log(`⚠️ No terms found for Term ${termNumber}, Year ${year}`);
          
          // Create a default term data with reasonable dates for the current year
          const defaultTerm: TermData = {
            id: 'default-term',
            term_number: validTermNumber,
            start_date: getDefaultStartDate(validTermNumber, year),
            end_date: getDefaultEndDate(validTermNumber, year),
            current: false,
            academic_years: { year: year }
          };
          
          console.log("✅ Created default term data:", defaultTerm);
          return defaultTerm;
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

// Helper function to get default start date for a term in a specific year
function getDefaultStartDate(termNumber: string, year: number): string {
  switch (termNumber) {
    case "1": return `${year}-01-01`; // Term 1: Jan-Mar
    case "2": return `${year}-04-01`; // Term 2: Apr-Jun
    case "3": return `${year}-07-01`; // Term 3: Jul-Sep
    case "4": return `${year}-10-01`; // Term 4: Oct-Dec
    default: return `${year}-01-01`;
  }
}

// Helper function to get default end date for a term in a specific year
function getDefaultEndDate(termNumber: string, year: number): string {
  switch (termNumber) {
    case "1": return `${year}-03-31`; // Term 1: Jan-Mar
    case "2": return `${year}-06-30`; // Term 2: Apr-Jun
    case "3": return `${year}-09-30`; // Term 3: Jul-Sep
    case "4": return `${year}-12-31`; // Term 4: Oct-Dec
    default: return `${year}-03-31`;
  }
}
