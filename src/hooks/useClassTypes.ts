import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClassType {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

export function useClassTypes(includeInactive = false) {
  const { data: classTypes = [], isLoading, error } = useQuery({
    queryKey: ['class-types', includeInactive],
    queryFn: async () => {
      let query = supabase
        .from('class_types')
        .select('id, name, display_order, is_active')
        .order('display_order', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ClassType[];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });

  // Convenience: just the names in order
  const classTypeNames = classTypes.map(ct => ct.name);

  return { classTypes, classTypeNames, isLoading, error };
}
