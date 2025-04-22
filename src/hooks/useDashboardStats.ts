
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";

export function useDashboardStats() {
  const { currentBranch } = useBranch();

  // Clients count
  const { data: clientCount } = useQuery({
    queryKey: ['dashboard-stats-clients', currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch?.id) return 0;
      const { count } = await supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', currentBranch.id);
      return count || 0;
    },
    enabled: !!currentBranch?.id,
  });

  // Dogs count
  const { data: dogCount } = useQuery({
    queryKey: ['dashboard-stats-dogs', currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch?.id) return 0;
      const { count } = await supabase
        .from('dogs')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', currentBranch.id);
      return count || 0;
    },
    enabled: !!currentBranch?.id,
  });

  // Bookings count
  const { data: bookingCount } = useQuery({
    queryKey: ['dashboard-stats-bookings', currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch?.id) return 0;
      const { count } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('clients.branch_id', currentBranch.id)
        .select('id', { count: 'exact', head: true })
        .eq('clients.branch_id', currentBranch.id);
      return count || 0;
    },
    enabled: !!currentBranch?.id,
  });

  // Classes scheduled count (future classes)
  const { data: upcomingClassCount } = useQuery({
    queryKey: ['dashboard-stats-classes', currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch?.id) return 0;
      const today = new Date().toISOString();
      const { count } = await supabase
        .from('class_schedules')
        .select('id', { count: 'exact', head: true })
        .eq('classes.branch_id', currentBranch.id)
        .gte('start_time', today);
      return count || 0;
    },
    enabled: !!currentBranch?.id,
  });

  return {
    clientCount,
    dogCount,
    bookingCount,
    upcomingClassCount
  };
}
