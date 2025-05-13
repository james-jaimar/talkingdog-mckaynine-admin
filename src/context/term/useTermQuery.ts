
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
        // FIX: Use a more explicit approach to find the correct term
        let termQuery = supabase
          .from('terms')
          .select(`
            id, 
            term_number,
            start_date,
            end_date,
            current,
            academic_years(year)
          `);
        
        // Step 1: If we have a valid academic year ID, prioritize finding a term with matching academic_year_id
        if (academicYearId) {
          // First try to find a term that matches BOTH academic year AND term number
          const { data: yearTermMatch, error: yearTermError } = await termQuery
            .eq('academic_year_id', academicYearId)
            .eq('term_number', validTermNumber)
            .order('current', { ascending: false }) // Prioritize current terms
            .maybeSingle();
          
          if (yearTermMatch) {
            console.log(`✅ Found term ${termNumber} for year ${year}:`, yearTermMatch);
            return yearTermMatch as TermData;
          } else {
            console.log(`⚠️ No term ${termNumber} found for academic year ${year}, falling back to other methods`);
          }
        }
        
        // Step 2: Try to join with academic_years and filter explicitly by year and term_number
        const { data: yearJoinMatch, error: yearJoinError } = await supabase
          .from('terms')
          .select(`
            id, 
            term_number,
            start_date,
            end_date,
            current,
            academic_years(id, year)
          `)
          .eq('term_number', validTermNumber)
          .eq('academic_years.year', year)
          .order('current', { ascending: false }) // Prioritize current terms
          .maybeSingle();
        
        if (yearJoinMatch) {
          console.log(`✅ Found term ${termNumber} by joining with academic year ${year}:`, yearJoinMatch);
          return yearJoinMatch as TermData;
        }
        
        // Step 3: If we still don't have a match, create a default term with proper dates for the specified year
        console.log(`⚠️ No term ${termNumber} found for year ${year}, creating default term data`);
        
        // Create a default term data with reasonable dates for the SELECTED year
        const defaultTerm: TermData = {
          id: `default-term-${termNumber}-${year}`,  // Use a unique string ID that won't trigger UUID validation errors
          term_number: validTermNumber,
          start_date: getDefaultStartDate(validTermNumber, year),
          end_date: getDefaultEndDate(validTermNumber, year),
          current: false,
          academic_years: { year: year }
        };
        
        console.log("✅ Created default term data:", defaultTerm);
        return defaultTerm;
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
  // Ensure we're using the specified year, not a hardcoded one
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
  // Ensure we're using the specified year, not a hardcoded one
  switch (termNumber) {
    case "1": return `${year}-03-31`; // Term 1: Jan-Mar
    case "2": return `${year}-06-30`; // Term 2: Apr-Jun
    case "3": return `${year}-09-30`; // Term 3: Jul-Sep
    case "4": return `${year}-12-31`; // Term 4: Oct-Dec
    default: return `${year}-03-31`;
  }
}
