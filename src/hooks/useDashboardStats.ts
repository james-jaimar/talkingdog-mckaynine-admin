
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBranch } from '@/context/BranchContext';
import { useTerm } from '@/context/TermContext';
import { useCallback, useState } from 'react';

export function useDashboardStats() {
  const { currentBranch } = useBranch();
  const { termData } = useTerm();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Force a refresh function
  const forceRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);
  
  // Clients count - using client_branches junction table
  const { data: clientCount, refetch: refetchClients } = useQuery({
    queryKey: ['dashboard-stats-clients', currentBranch?.id],
    queryFn: async () => {
      console.log("Fetching clients count for branch:", currentBranch?.id);
      if (!currentBranch?.id) return 0;
      
      // Get client IDs from the client_branches junction table
      const { data: clientBranches, error } = await supabase
        .from('client_branches')
        .select('client_id', { count: 'exact', head: true })
        .eq('branch_id', currentBranch.id);
      
      if (error) {
        console.error("Error fetching client count:", error);
        return 0;
      }
      
      // Get count directly from the junction table
      const { count } = await supabase
        .from('client_branches')
        .select('client_id', { count: 'exact', head: true })
        .eq('branch_id', currentBranch.id);
      
      return count || 0;
    },
    enabled: !!currentBranch?.id,
    staleTime: 60 * 1000, // Cache for 1 minute
  });

  // Dogs count - using client_branches junction table
  const { data: dogCount, refetch: refetchDogs } = useQuery({
    queryKey: ['dashboard-stats-dogs', currentBranch?.id],
    queryFn: async () => {
      console.log("Fetching dogs count for branch:", currentBranch?.id);
      if (!currentBranch?.id) return 0;
      
      // First get all client IDs from this branch via junction table
      const { data: clientBranches } = await supabase
        .from('client_branches')
        .select('client_id')
        .eq('branch_id', currentBranch.id);
      
      if (!clientBranches || clientBranches.length === 0) return 0;
      
      // Then count dogs belonging to these clients
      const clientIds = clientBranches.map(cb => cb.client_id);
      
      const { count } = await supabase
        .from('dogs')
        .select('id', { count: 'exact', head: true })
        .in('client_id', clientIds);
      
      return count || 0;
    },
    enabled: !!currentBranch?.id,
    staleTime: 60 * 1000, // Cache for 1 minute
  });

  // Bookings count - term-specific, using invoice.branch_id for accurate attribution
  const { data: bookingCount, refetch: refetchBookings } = useQuery({
    queryKey: ['dashboard-stats-bookings', currentBranch?.id, termData?.id, refreshTrigger],
    queryFn: async () => {
      console.log("Fetching bookings count for branch:", currentBranch?.id, "and term:", termData?.id);
      if (!currentBranch?.id) return 0;
      
      // Get bookings for classes in this branch (class determines branch, not client)
      let query = supabase
        .from('bookings')
        .select('id, class_schedules!inner(term_id, classes!inner(branch_id))', { count: 'exact', head: true })
        .eq('class_schedules.classes.branch_id', currentBranch.id);
      
      if (termData?.id) {
        query = query.eq('class_schedules.term_id', termData.id);
      }
      
      const { count, error } = await query;
      
      if (error) {
        console.error("Error fetching bookings count:", error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!currentBranch?.id,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  // Classes scheduled count - term-specific
  const { data: upcomingClassCount, refetch: refetchClasses } = useQuery({
    queryKey: ['dashboard-stats-classes', currentBranch?.id, termData?.id, refreshTrigger],
    queryFn: async () => {
      console.log("Fetching upcoming classes for branch:", currentBranch?.id, "and term:", termData?.id);
      if (!currentBranch?.id) return 0;
      const today = new Date().toISOString();
      
      let query = supabase
        .from('class_schedules')
        .select('id, classes!inner(branch_id)', { count: 'exact', head: true })
        .eq('classes.branch_id', currentBranch.id)
        .gte('start_time', today);
      
      if (termData?.id) {
        query = query.eq('term_id', termData.id);
      }
      
      const { count, error } = await query;
      
      if (error) {
        console.error("Error fetching upcoming classes count:", error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!currentBranch?.id,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  // Function to refetch all stats
  const refetchAllStats = useCallback(() => {
    console.log("Refetching all dashboard stats");
    setIsLoading(true);
    
    Promise.all([
      refetchClients(),
      refetchDogs(),
      refetchBookings(),
      refetchClasses()
    ]).finally(() => {
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
