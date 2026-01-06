import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { alphabetGroups } from "../HandlerAlphabetPagination";
import { useBranch } from "@/context/BranchContext";
import { CLASS_TYPES } from "@/components/classes/types/class-types";

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
  status: 'completed' | 'passed' | 'no_pass' | 'incomplete' | 'did_not_grade' | 'did_not_attend' | 'interested' | 'not-interested';
  period?: string;
  pass_percentage?: number | null;
  next_action?: 'continuing' | 'wants_info' | 'stopping' | 'none' | null;
  result_notes?: string;
  next_class_type?: string | null;
  next_term_number?: string | null;
  next_term_year?: number | null;
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

export type ActionFilter = 'all' | 'wants_info' | 'continuing' | 'stopping' | 'has_tasks';

export function useHandlersData() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentGroup, setCurrentGroup] = useState("A");
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const itemsPerPage = 50;
  const { currentBranch } = useBranch();

  // Fetch pending tasks to get handler IDs with pending tasks
  const { data: pendingTasks = [] } = useQuery({
    queryKey: ['handlers-pending-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('handler_tasks')
        .select('handler_id')
        .eq('status', 'pending');
      
      if (error) {
        console.error("Error fetching pending tasks:", error);
        return [];
      }
      return data || [];
    },
    refetchOnWindowFocus: false,
  });

  // Create a Set of handler IDs with pending tasks for efficient lookup
  const handlersWithPendingTasks = useMemo(() => {
    return new Set(pendingTasks.map(task => task.handler_id).filter(Boolean));
  }, [pendingTasks]);

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
            ),
            enrollment_registrations (
              whatsapp_permission,
              photo_permission,
              created_at
            )
          `);

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
              if (!status.class_type) continue;
              // Use exact class_type without normalization
              const arr = classStatusesMap[status.handler_id] || [];
              arr.push(status);
              classStatusesMap[status.handler_id] = arr;
            }
          }
        }

        // Helper to get consent from latest enrollment registration
        const getConsentFromRegistrations = (registrations: any[], fallbackWhatsapp: string, fallbackPhoto: string) => {
          if (!registrations || registrations.length === 0) {
            return { whatsapp: fallbackWhatsapp, photo: fallbackPhoto };
          }
          // Sort by created_at descending and get latest
          const sorted = [...registrations].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          const latest = sorted[0];
          return {
            whatsapp: latest.whatsapp_permission || fallbackWhatsapp,
            photo: latest.photo_permission || fallbackPhoto
          };
        };

        // Map class statuses using exact CLASS_TYPES matching
        const handlersWithClassStatus = (clientsData || []).map(client => {
          const allStatuses = classStatusesMap[client.id] || [];
          // For each possible type, find exact match
          const class_statuses = CLASS_TYPES.map((classType) => {
            const found = allStatuses.find(s => s.class_type === classType);
            if (!found) return { class_type: classType, status: undefined, period: undefined };
            return {
              class_type: classType,
              status: found.result_status || (found.completed ? "completed" : found.status),
              period: found.period,
              pass_percentage: found.pass_percentage,
              next_action: found.next_action,
              result_notes: found.result_notes,
              next_class_type: found.next_class_type,
              next_term_number: found.next_term_number,
              next_term_year: found.next_term_year,
            };
          });
          
          // Get consent statuses from enrollment_registrations (priority) or fallback to client fields
          const consent = getConsentFromRegistrations(
            client.enrollment_registrations,
            client.uses_whatsapp_status,
            client.social_media_consent_status
          );
          
          return {
            ...client,
            class_statuses,
            uses_whatsapp_status: consent.whatsapp as 'yes' | 'no' | 'not_marked',
            social_media_consent_status: consent.photo as 'yes' | 'no' | 'not_marked',
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
  const filteredBySearch = handlers.filter(handler => 
    handler.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    handler.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    handler.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    handler.dogs.some(dog => 
      dog.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dog.breed.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Filter by action filter
  const filteredByAction = actionFilter === 'all' 
    ? filteredBySearch 
    : filteredBySearch.filter(handler => {
        const hasNextAction = (action: string) => 
          handler.class_statuses?.some(s => s.next_action === action);
        
        switch (actionFilter) {
          case 'wants_info':
            return hasNextAction('wants_info');
          case 'continuing':
            return hasNextAction('continuing');
          case 'stopping':
            return hasNextAction('stopping');
          case 'has_tasks':
            // Check actual pending tasks from handler_tasks table
            return handlersWithPendingTasks.has(handler.id);
          default:
            return true;
        }
      });

  // Filter by current alphabet group (only when not searching and filter is 'all')
  const currentGroupHandlers = (searchQuery || actionFilter !== 'all')
    ? filteredByAction 
    : filteredByAction.filter(handler => {
        const firstLetter = handler.first_name.charAt(0).toUpperCase();
        const group = alphabetGroups.find(group => 
          group.range.some(letter => firstLetter === letter)
        );
        return group?.label === currentGroup;
      });

  // Calculate filter counts
  const filterCounts = {
    all: handlers.length,
    wants_info: handlers.filter(h => h.class_statuses?.some(s => s.next_action === 'wants_info')).length,
    continuing: handlers.filter(h => h.class_statuses?.some(s => s.next_action === 'continuing')).length,
    stopping: handlers.filter(h => h.class_statuses?.some(s => s.next_action === 'stopping')).length,
    has_tasks: handlers.filter(h => handlersWithPendingTasks.has(h.id)).length,
  };

  return {
    handlers: currentGroupHandlers,
    allHandlers: handlers,
    isLoading,
    searchQuery,
    setSearchQuery,
    currentGroup,
    setCurrentGroup,
    actionFilter,
    setActionFilter,
    filterCounts,
    itemsPerPage,
    currentBranch,
    refetch
  };
}
