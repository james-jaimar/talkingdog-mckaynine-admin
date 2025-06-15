
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useHandlerCompletion({ handlerId, classId }: { handlerId: string; classId: string }) {
  return useQuery({
    queryKey: ["handler-completion", handlerId, classId],
    queryFn: async () => {
      if (!handlerId || !classId) return null;
      const { data, error } = await supabase
        .from("handler_class_status")
        .select("*")
        .eq("handler_id", handlerId)
        .eq("class_id", classId)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 30000,
  });
}
