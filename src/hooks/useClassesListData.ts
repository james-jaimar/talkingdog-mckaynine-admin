
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBranch } from '@/context/BranchContext';

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

  return useQuery({
    queryKey: ['classes-list-data', currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch?.id) return [];

      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          class_schedules(
            id,
            selected_dates,
            bookings(
              id,
              payment_status,
              clients(id, first_name, last_name),
              dogs(id, name, breed),
              attendances:class_attendance(attendance_status)
            )
          )
        `)
        .eq('branch_id', currentBranch.id);

      if (classesError) throw classesError;

      const classGroups: ClassGroup[] = classes.map(classItem => {
        const handlers: Handler[] = [];
        
        classItem.class_schedules?.forEach(schedule => {
          const totalClasses = (schedule.selected_dates || []).length;
          
          schedule.bookings?.forEach(booking => {
            if (!booking.clients || !booking.dogs) return;

            const attendanceCount = booking.attendances?.filter(
              a => a.attendance_status === 'present'
            ).length || 0;

            handlers.push({
              clientId: booking.clients.id,
              clientName: `${booking.clients.first_name} ${booking.clients.last_name}`,
              dogId: booking.dogs.id,
              dogName: booking.dogs.name,
              dogBreed: booking.dogs.breed,
              paymentStatus: booking.payment_status,
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

      return classGroups;
    },
    enabled: !!currentBranch?.id
  });
}
