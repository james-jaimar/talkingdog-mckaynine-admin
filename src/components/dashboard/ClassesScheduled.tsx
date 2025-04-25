
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useTerm } from '@/context/TermContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';

interface ClassesScheduledProps {
  branchId?: string;
}

export function ClassesScheduled({ branchId }: ClassesScheduledProps) {
  const isMobile = useIsMobile();
  const { termData } = useTerm();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: classes, isLoading, refetch } = useQuery({
    queryKey: ['upcoming-classes', branchId, termData?.id],
    queryFn: async () => {
      // Don't fetch data if no branch is selected
      if (!branchId) return [];
      
      console.log('Fetching upcoming classes with term ID:', termData?.id);
      
      // Use today's date as the default start date
      const startDate = new Date().toISOString();
      
      // Build the query with branch filter and date range
      let query = supabase
        .from('class_schedules')
        .select(`
          id,
          start_time,
          term_id,
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
        .eq('classes.branch_id', branchId)
        .gte('start_time', startDate);
      
      // Add term filter if a term is selected
      if (termData?.id) {
        query = query.eq('term_id', termData.id);
      }
      
      const { data, error } = await query
        .order('start_time', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      console.log('Upcoming classes fetched:', data?.length || 0);
      return data;
    },
    enabled: !!branchId,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  // Refresh when term changes
  useEffect(() => {
    if (termData?.id) {
      console.log("ClassesScheduled responding to term change");
      setIsRefreshing(true);
      refetch().finally(() => setIsRefreshing(false));
    }
  }, [termData?.id, refetch]);

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
        ) : isLoading || isRefreshing ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : classes && classes.length > 0 ? (
          <div className="space-y-3">
            {classes.map((classSchedule) => {
              const { day, date, time } = formatDate(classSchedule.start_time);
              
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
