
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBranch } from '@/context/BranchContext';
import { useTermSelection } from '@/hooks/useTermSelection';

export interface Handler {
  clientId: string;
  clientName: string;
  dogId: string;
  dogName: string;
  dogBreed: string;
  paymentStatus: string;
  attendanceCount: number;
  totalClasses: number;
}

export interface ClassGroup {
  className: string;
  handlers: Handler[];
}

export function useClassesListData() {
  const { currentBranch } = useBranch();
  const { termDateRange } = useTermSelection();

  return useQuery({
    queryKey: ['classes-list-data', currentBranch?.id, termDateRange?.startDate, termDateRange?.endDate],
    queryFn: async () => {
      if (!currentBranch?.id) return [];

      console.log(`Fetching classes list data for branch ${currentBranch.name} within term period:`, termDateRange);

      let query = supabase
        .from('classes')
        .select(`
          id,
          name,
          class_schedules(
            id,
            selected_dates,
            start_time,
            bookings(
              id,
              payment_status,
              clients(id, first_name, last_name),
              dogs(id, name, breed),
              attendances:class_attendance(attendance_status),
              invoice_items(
                invoice_id,
                invoices:invoice_id (
                  status,
                  payment_received
                )
              )
            )
          )
        `)
        .eq('branch_id', currentBranch.id);

      // Apply term date filtering if available
      if (termDateRange?.startDate && termDateRange?.endDate) {
        query = query.or(`class_schedules.start_time.gte.${termDateRange.startDate},class_schedules.start_time.is.null`);
      }

      const { data: classes, error: classesError } = await query;

      if (classesError) {
        console.error("Error fetching classes data:", classesError);
        throw classesError;
      }

      console.log(`Retrieved ${classes?.length || 0} classes for branch ${currentBranch.name}`);

      // Filter schedules to only include those within the term date range
      const filteredClasses = classes.map(classItem => {
        if (termDateRange?.startDate && termDateRange?.endDate) {
          const startDate = new Date(termDateRange.startDate);
          const endDate = new Date(termDateRange.endDate);
          
          classItem.class_schedules = classItem.class_schedules.filter(schedule => {
            if (!schedule.start_time) return true;
            const scheduleDate = new Date(schedule.start_time);
            return scheduleDate >= startDate && scheduleDate <= endDate;
          });
        }
        
        return classItem;
      });

      const classGroups: ClassGroup[] = filteredClasses.map(classItem => {
        const handlers: Handler[] = [];
        
        classItem.class_schedules?.forEach(schedule => {
          const totalClasses = (schedule.selected_dates || []).length;
          
          schedule.bookings?.forEach(booking => {
            if (!booking.clients || !booking.dogs) return;

            // Check attendance count
            const attendanceCount = booking.attendances?.filter(
              a => a.attendance_status === 'present'
            ).length || 0;
            
            // Check payment status from invoices
            let paymentStatus = booking.payment_status;
            const invoiceItem = booking.invoice_items?.find(item => item.invoices);
            
            if (invoiceItem?.invoices) {
              if (invoiceItem.invoices.payment_received || invoiceItem.invoices.status === 'paid') {
                paymentStatus = 'paid';
              }
            }

            handlers.push({
              clientId: booking.clients.id,
              clientName: `${booking.clients.first_name} ${booking.clients.last_name}`,
              dogId: booking.dogs.id,
              dogName: booking.dogs.name,
              dogBreed: booking.dogs.breed,
              paymentStatus,
              attendanceCount,
              totalClasses
            });
          });
        });

        return {
          className: classItem.name,
          handlers
        };
      });

      console.log(`Processed ${classGroups.length} class groups with handler information`);
      return classGroups;
    },
    enabled: !!currentBranch?.id,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });
}
