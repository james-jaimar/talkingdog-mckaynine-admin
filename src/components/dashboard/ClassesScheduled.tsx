
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function ClassesScheduled() {
  const { data: classes, isLoading } = useQuery({
    queryKey: ['upcoming-classes'],
    queryFn: async () => {
      const today = new Date();
      const { data, error } = await supabase
        .from('class_schedules')
        .select(`
          id,
          start_time,
          classes(
            name,
            level
          ),
          trainers(
            first_name,
            last_name,
            avatar_url
          )
        `)
        .gte('start_time', today.toISOString())
        .order('start_time', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.toLocaleDateString(undefined, { weekday: 'short' }),
      date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Classes</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">Loading classes...</div>
        ) : classes && classes.length > 0 ? (
          <div className="space-y-4">
            {classes.map((classSchedule) => {
              const { day, date, time } = formatDate(classSchedule.start_time);
              
              return (
                <div key={classSchedule.id} className="flex items-start p-3 rounded-lg border hover:bg-gray-50">
                  <div className="flex-shrink-0 w-14 text-center mr-4">
                    <div className="font-bold text-gray-400">{day}</div>
                    <div className="text-lg font-bold">{date.split(' ')[1]}</div>
                    <div className="text-xs">{date.split(' ')[0]}</div>
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-medium">{classSchedule.classes?.name}</h4>
                    <div className="text-sm text-gray-500">
                      {time} • {classSchedule.classes?.level} Level
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-mckaynine-500 text-white">
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
          <div className="text-center py-4 text-gray-500">No upcoming classes scheduled</div>
        )}
      </CardContent>
    </Card>
  );
}
