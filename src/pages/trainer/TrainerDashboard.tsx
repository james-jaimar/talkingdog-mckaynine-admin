import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/auth";
import { useBranch } from "@/context/BranchContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet";
import { CalendarClock, Users, Clock, DollarSign, ChevronRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { getNextOccurrence, ScheduleForOccurrence } from "@/utils/scheduleOccurrences";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ScheduleWithNextOccurrence {
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
    branch_id: string;
  } | null;
  bookings: { id: string; status: string }[];
  nextOccurrence: Date;
}

export default function TrainerDashboard() {
  const { isTrainer, trainerProfile } = useAuth();
  const { currentBranch } = useBranch();
  const navigate = useNavigate();

  // Fetch upcoming classes for this trainer, filtered by branch
  // Now includes selected_dates and recurrence info to compute true next occurrence
  const { data: upcomingClasses = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ['trainer-dashboard-classes', trainerProfile?.id, currentBranch?.id],
    queryFn: async () => {
      if (!trainerProfile?.id) return [];
      
      const scheduleSelect = `
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
          branch_id
        ),
        bookings (
          id,
          status
        )
      `;

      // 1. Fetch primary schedules
      const { data: primaryData, error: primaryError } = await supabase
        .from('class_schedules')
        .select(scheduleSelect)
        .eq('trainer_id', trainerProfile.id)
        .order('start_time', { ascending: true });
      
      if (primaryError) {
        console.error("Error fetching trainer classes:", primaryError);
        return [];
      }

      // 2. Fetch substitute assignments
      const { data: subRecords } = await supabase
        .from('class_date_substitutes')
        .select('class_schedule_id')
        .eq('substitute_trainer_id', trainerProfile.id);

      const primaryIds = new Set((primaryData || []).map((s: any) => s.id));
      const subScheduleIds = [...new Set((subRecords || []).map(r => r.class_schedule_id))]
        .filter(id => !primaryIds.has(id));

      let subData: any[] = [];
      if (subScheduleIds.length > 0) {
        const { data: fetched } = await supabase
          .from('class_schedules')
          .select(scheduleSelect)
          .in('id', subScheduleIds)
          .order('start_time', { ascending: true });
        subData = fetched || [];
      }

      const allSchedules = [
        ...(primaryData || []),
        ...subData,
      ];
      
      // Filter by branch on client side (classes.branch_id is nested)
      const branchFiltered = currentBranch?.id 
        ? allSchedules.filter((item: any) => item.classes?.branch_id === currentBranch.id)
        : allSchedules;
      
      const now = new Date();
      
      // Compute next occurrence for each schedule and filter to upcoming only
      const schedulesWithNext: ScheduleWithNextOccurrence[] = [];
      
      for (const schedule of branchFiltered) {
        const scheduleData: ScheduleForOccurrence = {
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          selected_dates: schedule.selected_dates,
          recurring: schedule.recurring,
          recurrence_pattern: schedule.recurrence_pattern,
        };
        
        const nextOccurrence = getNextOccurrence(scheduleData, now);
        
        if (nextOccurrence) {
          schedulesWithNext.push({
            ...schedule,
            nextOccurrence,
          });
        }
      }
      
      // Sort by next occurrence (soonest first)
      schedulesWithNext.sort((a, b) => a.nextOccurrence.getTime() - b.nextOccurrence.getTime());
      
      // Limit to 10 for dashboard
      return schedulesWithNext.slice(0, 10);
    },
    enabled: !!trainerProfile?.id,
  });

  // Fetch earnings summary - filtered by branch via class_schedule -> class -> branch
  const { data: earningsSummary, isLoading: isLoadingEarnings } = useQuery({
    queryKey: ['trainer-dashboard-earnings', trainerProfile?.id, currentBranch?.id],
    queryFn: async () => {
      if (!trainerProfile?.id) return { total: 0, thisMonth: 0, pending: 0 };

      // First get all class schedules for this trainer in this branch
      const { data: schedules, error: schedError } = await supabase
        .from('class_schedules')
        .select(`
          id,
          classes:class_id (branch_id)
        `)
        .eq('trainer_id', trainerProfile.id);

      if (schedError) {
        console.error("Error fetching schedules:", schedError);
        return { total: 0, thisMonth: 0, pending: 0 };
      }

      // Filter to schedules in this branch
      const branchScheduleIds = currentBranch?.id
        ? (schedules || []).filter((s: any) => s.classes?.branch_id === currentBranch.id).map(s => s.id)
        : (schedules || []).map(s => s.id);

      if (branchScheduleIds.length === 0) {
        return { total: 0, thisMonth: 0, pending: 0 };
      }

      const { data, error } = await supabase
        .from('trainer_payments')
        .select('amount, status, payment_date, created_at')
        .eq('trainer_id', trainerProfile.id)
        .in('class_schedule_id', branchScheduleIds);

      if (error) {
        console.error("Error fetching earnings:", error);
        return { total: 0, thisMonth: 0, pending: 0 };
      }

      const now = new Date();
      const total = (data || [])
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      
      const pending = (data || [])
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const thisMonth = (data || [])
        .filter(p => {
          const paymentDate = new Date(p.payment_date || p.created_at);
          return paymentDate.getMonth() === now.getMonth() && 
                 paymentDate.getFullYear() === now.getFullYear() &&
                 p.status === 'paid';
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      return { total, thisMonth, pending };
    },
    enabled: !!trainerProfile?.id,
  });

  if (!isTrainer) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p>Access restricted to trainers only.</p>
        </div>
      </DashboardLayout>
    );
  }

  const isLoading = isLoadingClasses || isLoadingEarnings;
  const totalStudents = upcomingClasses.reduce((total, cls) => total + (cls.bookings?.length || 0), 0);
  const nextClass = upcomingClasses[0];

  return (
    <DashboardLayout>
      <Helmet>
        <title>Dashboard - Trainer Portal</title>
      </Helmet>

      <div className="space-y-4 sm:space-y-6 py-4 sm:py-6 px-2 sm:px-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {trainerProfile?.first_name}</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats Cards - Mobile optimized grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Card className="col-span-1">
                <CardHeader className="pb-1 sm:pb-2 flex flex-row items-center justify-between space-y-0 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">My Classes</CardTitle>
                  <CalendarClock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-xl sm:text-2xl font-bold">{upcomingClasses.length}</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Upcoming</p>
                </CardContent>
              </Card>

              <Card className="col-span-1">
                <CardHeader className="pb-1 sm:pb-2 flex flex-row items-center justify-between space-y-0 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Students</CardTitle>
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-xl sm:text-2xl font-bold">{totalStudents}</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Enrolled</p>
                </CardContent>
              </Card>

              <Card className="col-span-1">
                <CardHeader className="pb-1 sm:pb-2 flex flex-row items-center justify-between space-y-0 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">This Month</CardTitle>
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">
                    R{earningsSummary?.thisMonth?.toFixed(0) || 0}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Earned</p>
                </CardContent>
              </Card>

              <Card className="col-span-1">
                <CardHeader className="pb-1 sm:pb-2 flex flex-row items-center justify-between space-y-0 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-xl sm:text-2xl font-bold text-amber-600">
                    R{earningsSummary?.pending?.toFixed(0) || 0}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Awaiting</p>
                </CardContent>
              </Card>
            </div>

            {/* Next Class Highlight - Mobile friendly */}
            {nextClass && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary text-primary-foreground rounded-lg p-2 sm:p-3 text-center min-w-[50px] sm:min-w-[60px]">
                        <div className="text-[10px] sm:text-xs uppercase">{format(nextClass.nextOccurrence, "EEE")}</div>
                        <div className="text-lg sm:text-xl font-bold">{format(nextClass.nextOccurrence, "d")}</div>
                        <div className="text-[10px] sm:text-xs">{format(nextClass.nextOccurrence, "MMM")}</div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Next Class</p>
                        <h3 className="font-semibold text-sm sm:text-base">{nextClass.classes?.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">{nextClass.classes?.class_type}</Badge>
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            {format(nextClass.nextOccurrence, "p")}
                          </span>
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            • {nextClass.bookings?.length || 0} students
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => navigate(`/trainer/class/${nextClass.id}`)}
                      className="w-full sm:w-auto"
                    >
                      View Class
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Classes Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Upcoming Classes</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/trainer/classes')}
                  className="text-xs sm:text-sm"
                >
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="p-0 sm:p-6 sm:pt-0">
                {upcomingClasses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No upcoming classes scheduled.
                  </p>
                ) : (
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
                            <TableHead className="w-[100px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {upcomingClasses.map((schedule) => (
                            <TableRow key={schedule.id}>
                              <TableCell className="font-medium">
                                {format(schedule.nextOccurrence, "EEE, MMM d")}
                              </TableCell>
                              <TableCell>
                                {format(schedule.nextOccurrence, "HH:mm")}
                              </TableCell>
                              <TableCell>{schedule.classes?.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{schedule.classes?.class_type}</Badge>
                              </TableCell>
                              <TableCell>
                                {schedule.bookings?.length || 0} / {schedule.classes?.capacity || '∞'}
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => navigate(`/trainer/class/${schedule.id}`)}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile List */}
                    <div className="sm:hidden divide-y">
                      {upcomingClasses.map((schedule) => (
                        <div 
                          key={schedule.id} 
                          className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 active:bg-muted"
                          onClick={() => navigate(`/trainer/class/${schedule.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-muted rounded-lg p-2 text-center min-w-[44px]">
                              <div className="text-[10px] uppercase text-muted-foreground">
                                {format(schedule.nextOccurrence, "EEE")}
                              </div>
                              <div className="text-sm font-bold">
                                {format(schedule.nextOccurrence, "d")}
                              </div>
                            </div>
                            <div>
                              <p className="font-medium text-sm">{schedule.classes?.name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{format(schedule.nextOccurrence, "HH:mm")}</span>
                                <span>•</span>
                                <span>{schedule.bookings?.length || 0} students</span>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
