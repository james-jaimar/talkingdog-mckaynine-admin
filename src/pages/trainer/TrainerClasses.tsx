import { useAuth } from "@/context/auth";
import { useBranch } from "@/context/BranchContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Users, ChevronRight, Loader2, CalendarCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getNextOccurrence, getLastOccurrence, ScheduleForOccurrence } from "@/utils/scheduleOccurrences";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ScheduleWithOccurrence {
  id: string;
  start_time: string;
  end_time: string;
  term_number: string | null;
  academic_year: number | null;
  selected_dates: string[] | null;
  recurring: boolean | null;
  recurrence_pattern: string | null;
  classes: {
    id: string;
    name: string;
    class_type: string;
    capacity: number;
    description: string | null;
    branch_id: string;
  } | null;
  bookings: { id: string; status: string }[];
  displayDate: Date;
}

export default function TrainerClasses() {
  const { trainerProfile, isTrainer } = useAuth();
  const { currentBranch } = useBranch();
  const navigate = useNavigate();

  // Fetch trainer's assigned branches
  const { data: trainerBranches = [] } = useQuery({
    queryKey: ['trainer-branches', trainerProfile?.id],
    queryFn: async () => {
      if (!trainerProfile?.id) return [];
      
      const { data, error } = await supabase
        .from('trainer_branches')
        .select('branch_id')
        .eq('trainer_id', trainerProfile.id);
      
      if (error) {
        console.error("Error fetching trainer branches:", error);
        return [];
      }
      
      return data?.map(tb => tb.branch_id) || [];
    },
    enabled: !!trainerProfile?.id,
  });

  const { data: classData, isLoading } = useQuery({
    queryKey: ['trainer-all-classes', trainerProfile?.id, currentBranch?.id, trainerBranches],
    queryFn: async () => {
      if (!trainerProfile?.id) return { upcoming: [], past: [] };

      const { data, error } = await supabase
        .from('class_schedules')
        .select(`
          id,
          start_time,
          end_time,
          term_number,
          academic_year,
          selected_dates,
          recurring,
          recurrence_pattern,
          classes:class_id (
            id,
            name,
            class_type,
            capacity,
            description,
            branch_id
          ),
          bookings (
            id,
            status
          )
        `)
        .eq('trainer_id', trainerProfile.id)
        .order('start_time', { ascending: true });

      if (error) {
        console.error("Error fetching trainer classes:", error);
        return { upcoming: [], past: [] };
      }

      // Filter by branch - if current branch is selected, only show that branch's classes
      const branchFiltered = currentBranch?.id 
        ? (data || []).filter((item: any) => item.classes?.branch_id === currentBranch.id)
        : data || [];

      const now = new Date();
      const upcomingSchedules: ScheduleWithOccurrence[] = [];
      const pastSchedules: ScheduleWithOccurrence[] = [];

      for (const schedule of branchFiltered) {
        const scheduleData: ScheduleForOccurrence = {
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          selected_dates: schedule.selected_dates,
          recurring: schedule.recurring,
          recurrence_pattern: schedule.recurrence_pattern,
        };

        const nextOccurrence = getNextOccurrence(scheduleData, now);
        const lastOccurrence = getLastOccurrence(scheduleData, now);

        if (nextOccurrence) {
          // Has future occurrences - it's upcoming
          upcomingSchedules.push({
            ...schedule,
            displayDate: nextOccurrence,
          });
        } else if (lastOccurrence) {
          // No future occurrences but has past ones - it's past
          pastSchedules.push({
            ...schedule,
            displayDate: lastOccurrence,
          });
        }
      }

      // Sort upcoming by next occurrence (soonest first)
      upcomingSchedules.sort((a, b) => a.displayDate.getTime() - b.displayDate.getTime());
      
      // Sort past by last occurrence (most recent first)
      pastSchedules.sort((a, b) => b.displayDate.getTime() - a.displayDate.getTime());

      return { upcoming: upcomingSchedules, past: pastSchedules };
    },
    enabled: !!trainerProfile?.id,
  });

  const upcomingClasses = classData?.upcoming || [];
  const pastClasses = classData?.past || [];

  if (!isTrainer) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p>Access restricted to trainers only.</p>
        </div>
      </DashboardLayout>
    );
  }

  const ClassTable = ({ schedules, isPast = false }: { schedules: ScheduleWithOccurrence[]; isPast?: boolean }) => (
    <>
      {/* Desktop Table */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Students</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {isPast ? "No past classes." : "No upcoming classes scheduled."}
                </TableCell>
              </TableRow>
            ) : (
              schedules.map((schedule) => (
                <TableRow key={schedule.id} className={isPast ? "opacity-60" : ""}>
                  <TableCell className="font-medium">
                    {format(schedule.displayDate, "EEE, MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {format(schedule.displayDate, "HH:mm")} - {format(new Date(schedule.end_time), "HH:mm")}
                  </TableCell>
                  <TableCell>{schedule.classes?.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{schedule.classes?.class_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span>{schedule.bookings?.length || 0} / {schedule.classes?.capacity || '∞'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/trainer/class/${schedule.id}`)}
                    >
                      {isPast ? "View" : "Attendance"}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile List */}
      <div className="sm:hidden">
        {schedules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {isPast ? "No past classes." : "No upcoming classes scheduled."}
          </div>
        ) : (
          <div className="divide-y">
            {schedules.map((schedule) => (
              <div 
                key={schedule.id} 
                className={`p-4 cursor-pointer hover:bg-muted/50 active:bg-muted ${isPast ? "opacity-60" : ""}`}
                onClick={() => navigate(`/trainer/class/${schedule.id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-muted rounded-lg p-2 text-center min-w-[50px]">
                      <div className="text-[10px] uppercase text-muted-foreground">
                        {format(schedule.displayDate, "EEE")}
                      </div>
                      <div className="text-lg font-bold">
                        {format(schedule.displayDate, "d")}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {format(schedule.displayDate, "MMM")}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{schedule.classes?.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{schedule.classes?.class_type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(schedule.displayDate, "HH:mm")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{schedule.bookings?.length || 0} students enrolled</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    {!isPast && (
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                        <CalendarCheck className="h-3 w-3 mr-1" />
                        Mark
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  return (
    <DashboardLayout>
      <Helmet>
        <title>My Classes - Trainer Portal</title>
      </Helmet>

      <div className="space-y-4 sm:space-y-6 py-4 sm:py-6 px-2 sm:px-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">My Classes</h1>
          <p className="text-sm text-muted-foreground">View and manage attendance for your classes</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Card>
            <CardContent className="p-0 sm:p-6">
              <Tabs defaultValue="upcoming" className="w-full">
                <div className="px-4 sm:px-0 pt-4 sm:pt-0">
                  <TabsList className="grid w-full grid-cols-2 max-w-[300px]">
                    <TabsTrigger value="upcoming" className="text-xs sm:text-sm">
                      Upcoming ({upcomingClasses.length})
                    </TabsTrigger>
                    <TabsTrigger value="past" className="text-xs sm:text-sm">
                      Past ({pastClasses.length})
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="upcoming" className="mt-4">
                  <ClassTable schedules={upcomingClasses} />
                </TabsContent>
                
                <TabsContent value="past" className="mt-4">
                  <ClassTable schedules={pastClasses.slice(0, 20)} isPast />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
