import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBranch } from '@/context/BranchContext';
import { useTerm } from '@/context/TermContext';
import { useCallback, useState } from 'react';

export function useDashboardStats() {
  const { currentBranch } = useBranch();
  const { termData, selectedYear, selectedTermNumber } = useTerm();
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
      console.log("Fetching clients count for branch:", currentBranch?.id);
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
      console.log("Fetching dogs count for branch:", currentBranch?.id);
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
    queryKey: ['dashboard-stats-bookings', currentBranch?.id, termData?.id, selectedYear, selectedTermNumber, refreshTrigger],
    queryFn: async () => {
      console.log("Fetching bookings count for branch:", currentBranch?.id, "and term:", termData?.id);
      if (!currentBranch?.id) return 0;
      
      try {
        // First get all class schedules that match our term criteria
        let schedulesQuery = supabase.from('class_schedules').select('id');
        
        // Apply term filtering
        if (termData?.id && !termData.id.startsWith('default')) {
          // If we have a specific term ID, filter by it
          schedulesQuery = schedulesQuery.eq('term_id', termData.id);
        } else if (selectedTermNumber && selectedYear) {
          // Otherwise filter by term number and academic year
          schedulesQuery = schedulesQuery
            .eq('term_number', selectedTermNumber)
            .eq('academic_year', selectedYear);
        }
        
        const { data: schedules, error: schedulesError } = await schedulesQuery;
        
        if (schedulesError) {
          console.error('Error fetching schedules:', schedulesError);
          return 0;
        }
        
        if (!schedules || schedules.length === 0) {
          return 0;
        }
        
        const scheduleIds = schedules.map(s => s.id);
        
        // Now count bookings for these schedules
        const { count, error } = await supabase
          .from('bookings')
          .select('id, clients!inner(branch_id)', { count: 'exact', head: true })
          .eq('clients.branch_id', currentBranch.id)
          .in('class_schedule_id', scheduleIds);
        
        if (error) {
          console.error("Error fetching bookings count:", error);
          return 0;
        }
        
        return count || 0;
      } catch (error) {
        console.error("Error in booking count query:", error);
        return 0;
      }
    },
    enabled: !!currentBranch?.id,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  // Classes scheduled count - term-specific
  const { data: upcomingClassCount, refetch: refetchClasses } = useQuery({
    queryKey: ['dashboard-stats-classes', currentBranch?.id, termData?.id, selectedYear, selectedTermNumber, refreshTrigger],
    queryFn: async () => {
      console.log("Fetching upcoming classes for branch:", currentBranch?.id, "and term:", termData?.id);
      if (!currentBranch?.id) return 0;
      
      try {
        const today = new Date().toISOString();
        
        // Build the query with our criteria
        let query = supabase
          .from('class_schedules')
          .select('id, classes!inner(branch_id)', { count: 'exact', head: true })
          .eq('classes.branch_id', currentBranch.id)
          .gte('start_time', today);
        
        // Apply term filtering
        if (termData?.id && !termData.id.startsWith('default')) {
          // If we have a specific term ID, filter by it
          query = query.eq('term_id', termData.id);
        } else if (selectedTermNumber && selectedYear) {
          // Otherwise filter by term number and academic year
          query = query
            .eq('term_number', selectedTermNumber)
            .eq('academic_year', selectedYear);
        }
        
        const { count, error } = await query;
        
        if (error) {
          console.error("Error fetching upcoming classes count:", error);
          return 0;
        }
        
        return count || 0;
      } catch (error) {
        console.error("Error in class count query:", error);
        return 0;
      }
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
    termData,
    selectedYear,
    selectedTermNumber
  };
}
