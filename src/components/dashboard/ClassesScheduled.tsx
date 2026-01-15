
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useTerm } from '@/context/TermContext';
import { Skeleton } from '@/components/ui/skeleton';

interface ClassesScheduledProps {
  branchId?: string;
}

export function ClassesScheduled({ branchId }: ClassesScheduledProps) {
  const isMobile = useIsMobile();
  const { termData } = useTerm();

  const { data: classes, isLoading } = useQuery({
    queryKey: ['upcoming-classes', branchId, termData?.id],
    queryFn: async () => {
      // Don't fetch data if no branch is selected
      if (!branchId) return [];
      
      // Use today's date for filtering
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Build the query with branch filter - fetch ALL schedules for the branch/term
      // and filter by upcoming dates client-side (since selected_dates contains future occurrences)
      let query = supabase
        .from('class_schedules')
        .select(`
          id,
          start_time,
          term_id,
          selected_dates,
          classes!inner(
            name,
            class_type,
            branch_id
          ),
          trainers(
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('classes.branch_id', branchId);
      
      // Add term filter if a term is selected
      if (termData?.id) {
        query = query.eq('term_id', termData.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Process each schedule to find the next upcoming date
      const upcomingClasses = data
        ?.map((schedule) => {
          // Check if schedule has selected_dates with future dates
          const selectedDates = schedule.selected_dates as string[] | null;
          let nextOccurrence: Date | null = null;
          
          if (selectedDates && selectedDates.length > 0) {
            // Find the first date that is today or in the future
            for (const dateStr of selectedDates) {
              const date = new Date(dateStr);
              if (date >= now) {
                nextOccurrence = date;
                break;
              }
            }
          } else {
            // Fall back to start_time if no selected_dates
            const startTime = new Date(schedule.start_time);
            if (startTime >= now) {
              nextOccurrence = startTime;
            }
          }
          
          if (!nextOccurrence) return null;
          
          return {
            ...schedule,
            nextOccurrence,
          };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null)
        .sort((a, b) => a.nextOccurrence.getTime() - b.nextOccurrence.getTime())
        .slice(0, 5); // Limit to 5 upcoming classes
      
      console.log('Upcoming classes fetched:', upcomingClasses);
      return upcomingClasses;
    },
    enabled: !!branchId,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.toLocaleDateString(undefined, { weekday: isMobile ? 'short' : 'short' }),
      date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg sm:text-xl">Upcoming Classes</CardTitle>
      </CardHeader>
      <CardContent>
        {!branchId ? (
          <div className="text-center py-4 text-gray-500">Please select a branch</div>
        ) : isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : classes && classes.length > 0 ? (
          <div className="space-y-3">
            {classes.map((classSchedule) => {
              const { day, date, time } = formatDate(classSchedule.nextOccurrence.toISOString());
              
              return (
                <div key={classSchedule.id} className="flex items-start p-2 sm:p-3 rounded-lg border hover:bg-gray-50">
                  <div className="flex-shrink-0 w-12 text-center mr-3">
                    <div className="font-bold text-gray-400 text-xs sm:text-sm">{day}</div>
                    <div className="text-base sm:text-lg font-bold">{date.split(' ')[1]}</div>
                    <div className="text-xs">{date.split(' ')[0]}</div>
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="font-medium text-sm sm:text-base truncate">{classSchedule.classes?.name}</h4>
                    <div className="text-xs sm:text-sm text-gray-500 flex flex-wrap items-center">
                      <span>{time}</span>
                      <span className="mx-1">•</span>
                      <span>{classSchedule.classes?.class_type} Class</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2 sm:ml-4">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                      <AvatarFallback className="bg-mckaynine-500 text-white text-xs sm:text-sm">
                        {getInitials(
                          classSchedule.trainers?.first_name || '',
                          classSchedule.trainers?.last_name || ''
                        )}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 text-sm sm:text-base">
            {termData ? `No upcoming classes scheduled for Term ${termData.term_number}` : 'No upcoming classes scheduled'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
