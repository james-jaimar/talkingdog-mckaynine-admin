import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TermOption {
  id: string;
  term_number: string;
  year: number;
  label: string;
}

export function useAvailableTerms() {
  const query = useQuery({
    queryKey: ["available-terms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("terms")
        .select("id, term_number, academic_years(year)")
        .order("term_number", { ascending: true });

      if (error) throw error;

      const terms: TermOption[] = (data || [])
        .map((t) => {
          const ay = Array.isArray(t.academic_years) ? t.academic_years[0] : t.academic_years;
          return {
            id: t.id,
            term_number: t.term_number,
            year: ay?.year || 0,
            label: `Term ${t.term_number} ${ay?.year || ""}`.trim(),
          };
        })
        .sort((a, b) => a.year - b.year || a.term_number.localeCompare(b.term_number));

      return terms;
    },
  });

  return {
    terms: query.data || [],
    isLoading: query.isLoading,
  };
}
