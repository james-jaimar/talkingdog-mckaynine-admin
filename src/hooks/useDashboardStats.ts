
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBranch } from '@/context/BranchContext';
import { useTerm } from '@/context/TermContext';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export function useDashboardStats() {
  const { currentBranch } = useBranch();
  const { termData } = useTerm();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Force a refresh function
  const forceRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);
  
  // Clients count - no change needed as it's branch-specific but not term-specific
  const { data: clientCount, refetch: refetchClients } = useQuery({
    queryKey: ['dashboard-stats-clients', currentBranch?.id],
    queryFn: async () => {
      console.log("📊 Fetching clients count for branch:", currentBranch?.id);
      if (!currentBranch?.id) return 0;
      const { count } = await supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', currentBranch.id);
      return count || 0;
    },
    enabled: !!currentBranch?.id,
    staleTime: 60 * 1000, // Cache for 1 minute
  });

  // Dogs count - no change needed as it's branch-specific but not term-specific
  const { data: dogCount, refetch: refetchDogs } = useQuery({
    queryKey: ['dashboard-stats-dogs', currentBranch?.id],
    queryFn: async () => {
      console.log("📊 Fetching dogs count for branch:", currentBranch?.id);
      if (!currentBranch?.id) return 0;
      
      // Use a different approach: first get all clients from this branch
      const { data: branchClients } = await supabase
        .from('clients')
        .select('id')
        .eq('branch_id', currentBranch.id);
      
      if (!branchClients || branchClients.length === 0) return 0;
      
      // Then count dogs belonging to these clients
      const clientIds = branchClients.map(client => client.id);
      
      const { count } = await supabase
        .from('dogs')
        .select('id', { count: 'exact', head: true })
        .in('client_id', clientIds);
      
      return count || 0;
    },
    enabled: !!currentBranch?.id,
    staleTime: 60 * 1000, // Cache for 1 minute
  });

  // Bookings count - term-specific
  const { data: bookingCount, refetch: refetchBookings } = useQuery({
    queryKey: ['dashboard-stats-bookings', currentBranch?.id, termData?.id, refreshTrigger],
    queryFn: async () => {
      console.log("📊 Fetching bookings count for branch:", currentBranch?.id, "and term:", termData?.id);
      if (!currentBranch?.id) return 0;
      
      let query = supabase
        .from('bookings')
        .select('id, clients!inner(branch_id), class_schedules!inner(term_id)', { count: 'exact', head: true })
        .eq('clients.branch_id', currentBranch.id);
      
      if (termData?.id) {
        console.log(`📅 Filtering bookings by term ID: ${termData.id}`);
        query = query.eq('class_schedules.term_id', termData.id);
      }
      
      const { count, error } = await query;
      
      if (error) {
        console.error("❌ Error fetching bookings count:", error);
        return 0;
      }

      console.log(`✅ Found ${count} bookings for term ${termData?.id || 'any'}`);
      
      return count || 0;
    },
    enabled: !!currentBranch?.id,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  // Classes scheduled count - term-specific
  const { data: upcomingClassCount, refetch: refetchClasses } = useQuery({
    queryKey: ['dashboard-stats-classes', currentBranch?.id, termData?.id, refreshTrigger],
    queryFn: async () => {
      console.log("📊 Fetching upcoming classes for branch:", currentBranch?.id, "and term:", termData?.id);
      if (!currentBranch?.id) return 0;
      const today = new Date().toISOString();
      
      let query = supabase
        .from('class_schedules')
        .select('id, classes!inner(branch_id)', { count: 'exact', head: true })
        .eq('classes.branch_id', currentBranch.id)
        .gte('start_time', today);
      
      if (termData?.id) {
        console.log(`📅 Filtering classes by term ID: ${termData.id}`);
        query = query.eq('term_id', termData.id);
      }
      
      const { count, error } = await query;
      
      if (error) {
        console.error("❌ Error fetching upcoming classes count:", error);
        return 0;
      }

      console.log(`✅ Found ${count} upcoming classes for term ${termData?.id || 'any'}`);
      
      return count || 0;
    },
    enabled: !!currentBranch?.id,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  // Function to refetch all stats
  const refetchAllStats = useCallback(() => {
    console.log("🔄 Refetching all dashboard stats");
    setIsLoading(true);
    
    Promise.all([
      refetchClients(),
      refetchDogs(),
      refetchBookings(),
      refetchClasses()
    ]).then(() => {
      console.log("✅ All dashboard stats refreshed successfully");
      toast.success("Dashboard stats refreshed");
    }).catch((err) => {
      console.error("❌ Error refreshing dashboard stats:", err);
      toast.error("Failed to refresh dashboard stats");
    }).finally(() => {
      setTimeout(() => setIsLoading(false), 500);
    });
  }, [refetchClients, refetchDogs, refetchBookings, refetchClasses]);

  return {
    clientCount,
    dogCount,
    bookingCount,
    upcomingClassCount,
    refetchAllStats,
    isLoading,
    termData
  };
}
