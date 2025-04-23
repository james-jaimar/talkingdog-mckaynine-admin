
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";
import { useTermSelection } from "@/hooks/useTermSelection";
import { useCallback, useState, useEffect } from "react";

export function useDashboardStats() {
  const { currentBranch } = useBranch();
  const { termData } = useTermSelection();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [refetchCounter, setRefetchCounter] = useState(0);
  
  // Track when refetches are happening to show loading states
  useEffect(() => {
    // Reset loading state when term data changes
    setIsLoading(true);
    
    // Clear loading state after a short delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [termData?.id]);
  
  // Clients count
  const { data: clientCount, refetch: refetchClients } = useQuery({
    queryKey: ['dashboard-stats-clients', currentBranch?.id, termData?.id, refetchCounter],
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
    staleTime: 0, // Always fetch fresh data
  });

  // Dogs count - completely reworked query
  const { data: dogCount, refetch: refetchDogs } = useQuery({
    queryKey: ['dashboard-stats-dogs', currentBranch?.id, termData?.id, refetchCounter],
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
      
      console.log('Dog count:', count, 'for branch:', currentBranch.name);
      return count || 0;
    },
    enabled: !!currentBranch?.id,
    staleTime: 0, // Always fetch fresh data
  });

  // Bookings count - updated to filter by term
  const { data: bookingCount, refetch: refetchBookings } = useQuery({
    queryKey: ['dashboard-stats-bookings', currentBranch?.id, termData?.id, refetchCounter],
    queryFn: async () => {
      console.log("Fetching bookings count for branch:", currentBranch?.id, "and term:", termData?.id);
      if (!currentBranch?.id) return 0;
      
      let query = supabase
        .from('bookings')
        .select('id, clients!inner(branch_id), class_schedules(term_id)', { count: 'exact', head: true })
        .eq('clients.branch_id', currentBranch.id);
      
      // Apply term filter if term is selected
      if (termData?.id) {
        // Filter bookings by the selected term
        query = query.eq('class_schedules.term_id', termData.id);
      }
      
      const { count, error } = await query;
      
      if (error) {
        console.error('Error fetching bookings count:', error);
        return 0;
      }
      
      console.log("Found bookings:", count);
      return count || 0;
    },
    enabled: !!currentBranch?.id,
    staleTime: 0, // Always fetch fresh data
  });

  // Classes scheduled count - updated to filter by term
  const { data: upcomingClassCount, refetch: refetchClasses } = useQuery({
    queryKey: ['dashboard-stats-classes', currentBranch?.id, termData?.id, refetchCounter],
    queryFn: async () => {
      console.log("Fetching upcoming classes for branch:", currentBranch?.id, "and term:", termData?.id);
      if (!currentBranch?.id) return 0;
      const today = new Date().toISOString();
      
      let query = supabase
        .from('class_schedules')
        .select('id, classes!inner(branch_id)', { count: 'exact', head: true })
        .eq('classes.branch_id', currentBranch.id)
        .gte('start_time', today);
      
      // Apply term filter if term is selected
      if (termData?.id) {
        query = query.eq('term_id', termData.id);
      }
      
      const { count, error } = await query;
      
      if (error) {
        console.error('Error fetching class count:', error);
        return 0;
      }
      
      console.log("Found upcoming classes:", count);
      return count || 0;
    },
    enabled: !!currentBranch?.id,
    staleTime: 0, // Always fetch fresh data
  });

  // Function to refetch all stats with a force refresh mechanism
  const refetchAllStats = useCallback(() => {
    console.log("Forcefully refetching all dashboard stats");
    setIsLoading(true);
    
    // Increment counter to force query key change
    setRefetchCounter(prev => prev + 1);
    
    // Force refetch of all stats
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
    isLoading
  };
}
