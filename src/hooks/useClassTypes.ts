import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";

export interface ClassType {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

export function useClassTypes(includeInactive = false) {
  const { currentBranch } = useBranch();
  const branchId = currentBranch?.id;

  const { data: classTypes = [], isLoading, error } = useQuery({
    queryKey: ['class-types', branchId, includeInactive],
    queryFn: async () => {
      // Fetch all class types
      const { data: types, error: typesError } = await supabase
        .from('class_types')
        .select('id, name, display_order')
        .order('display_order', { ascending: true });

      if (typesError) throw typesError;
      if (!types) return [];

      // Fetch branch-specific active status
      let branchActiveMap: Record<string, boolean> = {};
      if (branchId) {
        const { data: branchTypes, error: btError } = await supabase
          .from('branch_class_types')
          .select('class_type_id, is_active')
          .eq('branch_id', branchId);

        if (btError) throw btError;
        branchActiveMap = Object.fromEntries(
          (branchTypes || []).map(bt => [bt.class_type_id, bt.is_active])
        );
      }

      // Merge: if no junction row exists, treat as inactive
      const merged: ClassType[] = types.map(ct => ({
        ...ct,
        is_active: branchActiveMap[ct.id] ?? false,
      }));

      if (!includeInactive) {
        return merged.filter(ct => ct.is_active);
      }
      return merged;
    },
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const classTypeNames = classTypes.map(ct => ct.name);

  return { classTypes, classTypeNames, isLoading, error };
}
