import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { alphabetGroups } from "../HandlerAlphabetPagination";
import { useBranch } from "@/context/BranchContext";
import { useClassTypes } from "@/hooks/useClassTypes";

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
  id?: string;
  class_type: string;
  status: 'completed' | 'passed' | 'no_pass' | 'incomplete' | 'did_not_grade' | 'did_not_attend' | 'interested' | 'not-interested';
  period?: string;
  pass_percentage?: number | null;
  next_action?: 'continuing' | 'wants_info' | 'stopping' | 'none' | null;
  action_completed?: boolean | null;
  result_notes?: string;
  next_class_type?: string | null;
  next_term_number?: string | null;
  next_term_year?: number | null;
  dog_name?: string | null;
  dog_id?: string | null;
  booking_id?: string | null;
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
  const { classTypeNames, classTypes: allClassTypes } = useClassTypes(true);

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
    queryKey: ['handlers', currentBranch?.id, classTypeNames],
    queryFn: async () => {
      try {
        console.log(`Fetching handlers for branch: ${currentBranch?.id || 'all'}`);
        
        // First, get client IDs that have access to this branch via client_branches
        let handlerIdsInBranch: string[] = [];
        if (currentBranch) {
          const { data: clientBranches, error: cbError } = await supabase
            .from('client_branches')
            .select('client_id')
            .eq('branch_id', currentBranch.id);
          
          if (cbError) {
            console.error("Error fetching client branches:", cbError);
            throw cbError;
          }
          handlerIdsInBranch = clientBranches?.map(cb => cb.client_id) || [];
          
          // If no handlers in this branch, return empty array
          if (handlerIdsInBranch.length === 0) {
            return [];
          }
        }
        
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

        // Filter by handlers that have access to this branch
        if (currentBranch && handlerIdsInBranch.length > 0) {
          query = query.in('id', handlerIdsInBranch);
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
        // Fetch active enrollments (bookings where is_enrolled=true) for all handlers
        let activeEnrollmentsMap: Record<string, { dog_id: string; class_type: string }[]> = {};
        if (clientIds.length > 0) {
          const { data: enrollmentData, error: enrollError } = await supabase
            .from('bookings')
            .select(`
              client_id,
              dog_id,
              is_enrolled,
              class_schedules:class_schedule_id (
                classes:class_id (
                  class_type
                )
              )
            `)
            .in('client_id', clientIds)
            .eq('is_enrolled', true);

          if (enrollError) {
            console.error("Error fetching active enrollments:", enrollError);
          } else {
            for (const booking of enrollmentData || []) {
              const classType = (booking as any).class_schedules?.classes?.class_type;
              if (!classType || !booking.dog_id) continue;
              const arr = activeEnrollmentsMap[booking.client_id] || [];
              arr.push({ dog_id: booking.dog_id, class_type: classType });
              activeEnrollmentsMap[booking.client_id] = arr;
            }
          }
        }

        if (clientIds.length > 0) {
          // Fetch class statuses with direct dog info OR booking dog info
          const { data: classStatusData, error: classStatusError } = await supabase
            .from('handler_class_status')
            .select(`
              *,
              dogs:dog_id (
                id,
                name
              ),
              bookings:booking_id (
                dog_id,
                dogs:dog_id (
                  name
                )
              )
            `)
            .in('handler_id', clientIds);

          if (classStatusError) {
            console.error("Error fetching class statuses:", classStatusError);
          } else {
            for (let status of classStatusData || []) {
              if (!status.class_type) continue;
              // Extract dog info - prefer direct dog_id, fall back to booking's dog
              const directDogName = status.dogs?.name || null;
              const bookingDogName = status.bookings?.dogs?.name || null;
              const directDogId = status.dog_id || null;
              const bookingDogId = status.bookings?.dog_id || null;
              
              const statusWithDog = {
                ...status,
                dog_name: directDogName || bookingDogName,
                dog_id: directDogId || bookingDogId,
              };
              const arr = classStatusesMap[status.handler_id] || [];
              arr.push(statusWithDog);
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
          const handlerEnrollments = activeEnrollmentsMap[client.id] || [];
          // For each possible type, find ALL matching statuses (multiple dogs)
        const class_statuses = classTypeNames.flatMap((classType) => {
            const foundAll = allStatuses.filter(s => s.class_type === classType);
            if (foundAll.length === 0) return [{ class_type: classType, status: undefined, period: undefined }];
            // For Yoga, only keep the latest entry per dog
            let statusesToUse = foundAll;
            if (classType === 'Yoga' && foundAll.length > 1) {
              const latestByDog = new Map<string, typeof foundAll[0]>();
              for (const entry of foundAll) {
                const dogKey = entry.dog_id || 'unknown';
                const existing = latestByDog.get(dogKey);
                if (!existing || (entry.period && (!existing.period || entry.period > existing.period))) {
                  latestByDog.set(dogKey, entry);
                }
              }
              statusesToUse = Array.from(latestByDog.values());
            }
            return statusesToUse.map(found => {
              // Display-side safety net: suppress next_action if the referenced class
              // is already completed for this handler+dog (catches historical stale data)
              let effectiveNextAction = found.next_action;
              let effectiveActionCompleted = found.action_completed;
              if (effectiveNextAction && effectiveNextAction !== 'none' && effectiveNextAction !== 'stopping' && !effectiveActionCompleted) {
                // Determine target classes: from next_class_type or fallback progression map
                const nextClassTypeStr = found.next_class_type;
                const fallbackNext = allClassTypes?.find(ct => ct.name === classType)?.next_class_type;
                const targetStr = nextClassTypeStr || fallbackNext;
                if (targetStr) {
                  const nextClasses = targetStr.split(',').map((s: string) => s.trim());
                  const dogId = found.dog_id;
                  const allCompletedForDog = nextClasses.every((nc: string) =>
                    allStatuses.some(s => s.class_type === nc && s.dog_id === dogId && s.completed)
                  );
                   if (allCompletedForDog) {
                    effectiveActionCompleted = true;
                  }
                  // Also check if already enrolled in a target class
                  if (!effectiveActionCompleted) {
                    const isEnrolledInTarget = nextClasses.some((nc: string) =>
                      handlerEnrollments.some(e => e.dog_id === dogId && e.class_type === nc)
                    );
                    if (isEnrolledInTarget) {
                      effectiveActionCompleted = true;
                    }
                  }
                }
              return {
                id: found.id,
                class_type: classType,
                status: found.result_status || (found.completed ? "completed" : found.status),
                period: found.period,
                pass_percentage: found.pass_percentage,
                next_action: effectiveNextAction,
                action_completed: effectiveActionCompleted,
                result_notes: found.result_notes,
                next_class_type: found.next_class_type,
                next_term_number: found.next_term_number,
                next_term_year: found.next_term_year,
                dog_name: found.dog_name,
                dog_id: found.dog_id,
                booking_id: found.booking_id,
              };
            });
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
        // Check for next_action that hasn't been completed yet
        const hasActiveNextAction = (action: string) => 
          handler.class_statuses?.some(s => s.next_action === action && !s.action_completed);
        
        switch (actionFilter) {
          case 'wants_info':
            return hasActiveNextAction('wants_info');
          case 'continuing':
            return hasActiveNextAction('continuing');
          case 'stopping':
            return hasActiveNextAction('stopping');
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

  // Calculate filter counts - only count actions that haven't been completed
  const filterCounts = {
    all: handlers.length,
    wants_info: handlers.filter(h => h.class_statuses?.some(s => s.next_action === 'wants_info' && !s.action_completed)).length,
    continuing: handlers.filter(h => h.class_statuses?.some(s => s.next_action === 'continuing' && !s.action_completed)).length,
    stopping: handlers.filter(h => h.class_statuses?.some(s => s.next_action === 'stopping' && !s.action_completed)).length,
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
