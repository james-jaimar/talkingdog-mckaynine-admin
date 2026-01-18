
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useHandlersList(classId: string, searchQuery: string, branchId?: string) {
  const [processingDogId, setProcessingDogId] = useState<string | null>(null);

  // Fetch schedule IDs for the class
  const { data: scheduleIds, isLoading: isLoadingSchedules } = useQuery({
    queryKey: ["class-schedules", classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_schedules')
        .select('id')
        .eq('class_id', classId);
        
      if (error) throw error;
      return data?.map(item => item.id) || [];
    },
    staleTime: 60000, // 1 minute
  });

  // Fetch handlers that aren't already in this class
  const { data: handlers, isLoading, error, refetch } = useQuery({
    queryKey: ["available-handlers", classId, searchQuery, scheduleIds],
    queryFn: async () => {
      if (!scheduleIds || scheduleIds.length === 0) {
        return [];
      }
      
      try {
        // Get existing bookings for this class to exclude those handlers/dogs
        const { data: existingBookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('client_id, dog_id')
          .in('class_schedule_id', scheduleIds);
        
        if (bookingsError) {
          throw bookingsError;
        }
        
        // Create lookup map of existing client-dog combinations
        const existingClientDogPairs = new Set();
        existingBookings?.forEach(booking => {
          existingClientDogPairs.add(`${booking.client_id}-${booking.dog_id}`);
        });
        
        // Fetch handlers that have access to this branch via client_branches junction table
        let handlersInBranch: string[] = [];
        
        if (branchId) {
          const { data: clientBranches, error: cbError } = await supabase
            .from('client_branches')
            .select('client_id')
            .eq('branch_id', branchId);
          
          if (cbError) throw cbError;
          handlersInBranch = clientBranches?.map(cb => cb.client_id) || [];
          
          // If no handlers in this branch, return empty array
          if (handlersInBranch.length === 0) {
            return [];
          }
        }
        
        // Then fetch handlers with their dogs
        let query = supabase
          .from('clients')
          .select(`
            id,
            first_name,
            last_name,
            email,
            phone,
            dogs (
              id,
              name,
              breed
            )
          `);
        
        // Filter by handlers that have access to this branch
        if (branchId && handlersInBranch.length > 0) {
          query = query.in('id', handlersInBranch);
        }
        
        // Add search filter if searchQuery exists
        if (searchQuery) {
          query = query.or(
            `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
          );
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        // Filter out handlers who have ALL their dogs already in the class
        const filteredData = data?.filter(client => {
          // If client has no dogs, they can't be added to a class
          if (!client.dogs || client.dogs.length === 0) return false;
          
          // Check if at least one dog is not yet enrolled
          return client.dogs.some(dog => !existingClientDogPairs.has(`${client.id}-${dog.id}`));
        }) || [];
        
        // For each handler, filter their dogs to only show those not already enrolled
        return filteredData.map(client => ({
          ...client,
          dogs: client.dogs.filter(dog => !existingClientDogPairs.has(`${client.id}-${dog.id}`))
        }));
      } catch (err) {
        throw err;
      }
    },
    enabled: !!scheduleIds && scheduleIds.length > 0,
    staleTime: 30000, // 30 seconds
  });

  return {
    handlers,
    scheduleIds,
    isLoadingSchedules,
    isLoading,
    error,
    refetch,
    processingDogId,
    setProcessingDogId
  };
}
