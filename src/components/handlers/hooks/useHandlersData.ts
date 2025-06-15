import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { alphabetGroups } from "../HandlerAlphabetPagination";
import { useBranch } from "@/context/BranchContext";

// Define explicit types for handlers and dogs
interface Dog {
  id: string;
  name: string;
  breed: string;
  age?: number;
  behavior_notes?: string;
  notes?: string;
  medical_notes?: string;
  class_enrollments?: ClassEnrollment[];
}

interface ClassEnrollment {
  id: string;
  puppy_class?: string | null;
  eo_class?: string | null;
  bronze_cgc_class?: string | null;
  silver_cgc_class?: string | null;
  beginner_novice_class?: string | null;
  wt_class?: string | null;
  yoga_class?: string | null;
}

interface ClassStatus {
  class_type: string;
  status: 'completed' | 'interested' | 'not-interested';
  period?: string;
}

export interface Handler {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  branch_id?: string | null;
  created_at: string;
  notes?: string;
  dogs: Dog[];
  uses_whatsapp_status: 'yes' | 'no' | 'not_marked';
  social_media_consent_status: 'yes' | 'no' | 'not_marked';
  invoices: any[];
  class_statuses?: ClassStatus[];
}

export function useHandlersData() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentGroup, setCurrentGroup] = useState("A");
  const itemsPerPage = 50;
  const { currentBranch } = useBranch();

  const { data: handlers = [], isLoading, refetch } = useQuery({
    queryKey: ['handlers', currentBranch?.id],
    queryFn: async () => {
      try {
        console.log(`Fetching handlers for branch: ${currentBranch?.id || 'all'}`);
        let query = supabase
          .from('clients')
          .select(`
            id,
            first_name,
            last_name,
            email,
            phone,
            branch_id,
            created_at,
            notes,
            uses_whatsapp_status,
            social_media_consent_status,
            dogs (
              id,
              name,
              breed,
              age,
              behavior_notes,
              notes,
              medical_notes,
              class_enrollments (
                id,
                puppy_class,
                eo_class,
                bronze_cgc_class,
                silver_cgc_class,
                beginner_novice_class,
                wt_class,
                yoga_class
              )
            ),
            invoices (
              id
            )
          `);

        // Filter by branch if one is selected
        if (currentBranch) {
          query = query.eq('branch_id', currentBranch.id);
        }

        query = query.order('first_name', { ascending: true });

        const { data: clientsData, error } = await query;

        if (error) {
          console.error("Error fetching handlers:", error);
          throw error;
        }

        // Fetch class statuses for all handlers in a single query
        const clientIds = (clientsData || []).map(client => client.id);
        let classStatusesMap: Record<string, any[]> = {};
        if (clientIds.length > 0) {
          const { data: classStatusData, error: classStatusError } = await supabase
            .from('handler_class_status')
            .select('*')
            .in('handler_id', clientIds);

          if (classStatusError) {
            console.error("Error fetching class statuses:", classStatusError);
          } else {
            for (let status of classStatusData || []) {
              const arr = classStatusesMap[status.handler_id] || [];
              arr.push(status);
              classStatusesMap[status.handler_id] = arr;
            }
          }
        }

        // Merge class statuses into client data
        const handlersWithClassStatus = (clientsData || []).map(client => {
          const classStatuses = classStatusesMap[client.id] || [];
          // Group by class_type, keep most recent completion per type for each handler
          const classTypeMap: Record<string, any> = {};
          for (let status of classStatuses) {
            if (!status.class_type) continue;
            const key = status.class_type;
            if (!classTypeMap[key] || (status.completed && status.completed_at > classTypeMap[key].completed_at)) {
              classTypeMap[key] = status;
            }
          }
          // Convert to array of compact statuses
          const class_statuses = Object.entries(classTypeMap).map(([class_type, status]) => ({
            class_type,
            status: status.completed ? 'completed' : undefined, // You may add other status logic
            period: status.period
          }));
          return {
            ...client,
            class_statuses,
          };
        });

        console.log(`Fetched ${handlersWithClassStatus?.length || 0} handlers for branch: ${currentBranch?.name || 'all'}`);
        return handlersWithClassStatus as Handler[];
      } catch (error) {
        console.error("Error in handlers query:", error);
        return [] as Handler[];
      }
    },
    enabled: !!currentBranch,
    refetchOnWindowFocus: false,
  });

  // Filter handlers by search query
  const filteredHandlers = handlers.filter(handler => 
    handler.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    handler.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    handler.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    handler.dogs.some(dog => 
      dog.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dog.breed.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Filter by current alphabet group
  const currentGroupHandlers = searchQuery 
    ? filteredHandlers 
    : filteredHandlers.filter(handler => {
        const firstLetter = handler.first_name.charAt(0).toUpperCase();
        const group = alphabetGroups.find(group => 
          group.range.some(letter => firstLetter === letter)
        );
        return group?.label === currentGroup;
      });

  return {
    handlers: currentGroupHandlers,
    isLoading,
    searchQuery,
    setSearchQuery,
    currentGroup,
    setCurrentGroup,
    itemsPerPage,
    currentBranch,
    refetch
  };
}
