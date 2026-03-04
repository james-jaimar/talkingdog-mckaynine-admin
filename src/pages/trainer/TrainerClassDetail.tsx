import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { useBranch } from "@/context/BranchContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, isToday, parseISO } from "date-fns";
import { Calendar, Users, Clock, ArrowLeft, Loader2, Check, X, AlertTriangle, CalendarRange, MessageSquarePlus, ChevronLeft, ChevronRight, HelpCircle, Phone } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useNavigate, useParams } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrainerNoteModal } from "@/components/trainer/TrainerNoteModal";

type AttendanceStatus = 'present' | 'absent' | 'excused' | 'not_marked';
type PerformanceGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | '1' | '2' | '3' | '4' | '5' | '6' | null;

const GRADE_INFO: Record<string, { label: string; color: string; bgColor: string }> = {
  'A': { label: '100% comprehension, excellent results', color: 'text-emerald-700', bgColor: 'bg-emerald-100 hover:bg-emerald-200 border-emerald-300' },
  'B': { label: 'Coping well, showing enthusiasm', color: 'text-blue-700', bgColor: 'bg-blue-100 hover:bg-blue-200 border-blue-300' },
  'C': { label: 'Coping adequately', color: 'text-cyan-700', bgColor: 'bg-cyan-100 hover:bg-cyan-200 border-cyan-300' },
  'D': { label: 'Not coping but committed, trying hard', color: 'text-amber-700', bgColor: 'bg-amber-100 hover:bg-amber-200 border-amber-300' },
  'E': { label: 'Disinterested, poor results', color: 'text-orange-700', bgColor: 'bg-orange-100 hover:bg-orange-200 border-orange-300' },
  'F': { label: 'No comprehension or commitment', color: 'text-red-700', bgColor: 'bg-red-100 hover:bg-red-200 border-red-300' },
  '1': { label: 'Class 1', color: 'text-green-700', bgColor: 'bg-green-100 hover:bg-green-200 border-green-300' },
  '2': { label: 'Class 2', color: 'text-green-700', bgColor: 'bg-green-100 hover:bg-green-200 border-green-300' },
  '3': { label: 'Class 3', color: 'text-green-700', bgColor: 'bg-green-100 hover:bg-green-200 border-green-300' },
  '4': { label: 'Class 4', color: 'text-green-700', bgColor: 'bg-green-100 hover:bg-green-200 border-green-300' },
  '5': { label: 'Class 5', color: 'text-green-700', bgColor: 'bg-green-100 hover:bg-green-200 border-green-300' },
  '6': { label: 'Class 6', color: 'text-green-700', bgColor: 'bg-green-100 hover:bg-green-200 border-green-300' },
};

export default function TrainerClassDetail() {
  const { trainerProfile, isTrainer } = useAuth();
  const { currentBranch } = useBranch();
  const { id: scheduleId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isUpdatingGrade, setIsUpdatingGrade] = useState<string | null>(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedBookingForNote, setSelectedBookingForNote] = useState<any>(null);
  const isMobile = useIsMobile();
  const dateScrollRef = useRef<HTMLDivElement>(null);

  const { data: schedule, isLoading, refetch } = useQuery({
    queryKey: ['trainer-class-detail-full', scheduleId, trainerProfile?.id, currentBranch?.id],
    queryFn: async () => {
      if (!trainerProfile?.id || !scheduleId) return null;

      const { data, error } = await supabase
        .from('class_schedules')
        .select(`
          id,
          start_time,
          end_time,
          term_number,
          academic_year,
          selected_dates,
          trainer_id,
          classes:class_id (
            id,
            name,
            class_type,
            capacity,
            description,
            branch_id,
            branches:branch_id (
              id,
              name
            )
          ),
          bookings (
            id,
            status,
            payment_status,
            dogs:dog_id (
              id,
              name,
              breed
            ),
            clients:client_id (
              id,
              first_name,
              last_name,
              phone
            )
          )
        `)
        .eq('id', scheduleId)
        .eq('trainer_id', trainerProfile.id)
        .single();

      if (error) {
        console.error("Error fetching class detail:", error);
        return null;
      }

      // Note: We no longer block trainers from viewing classes in other branches
      // Trainers may be assigned to classes across multiple branches

      // Fetch attendance records for this class
      if (data) {
        const bookingIds = data.bookings?.map((b: any) => b.id) || [];
        if (bookingIds.length > 0) {
          const { data: attendanceData } = await supabase
            .from('class_attendance')
            .select('*')
            .in('booking_id', bookingIds);

          // Attach attendance to bookings
          if (attendanceData) {
            data.bookings = data.bookings?.map((booking: any) => ({
              ...booking,
              attendances: attendanceData.filter(a => a.booking_id === booking.id)
            }));
          }
        }
      }

      return data;
    },
    enabled: !!trainerProfile?.id && !!scheduleId,
  });

  // Detect Randburg Puppy class
  const isRandburgPuppy = !!(
    (schedule?.classes as any)?.branches?.name?.toLowerCase().includes('randburg') &&
    schedule?.classes?.class_type?.toLowerCase() === 'puppy'
  );

  // Get available dates for this class
  const scheduleDates = schedule?.selected_dates || [schedule?.start_time].filter(Boolean);
  const sortedDates = [...(scheduleDates || [])].sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  // Set default date to today or next class date
  const today = new Date().toDateString();
  const defaultDate = sortedDates.find(d => new Date(d).toDateString() === today) || 
                      sortedDates.find(d => new Date(d) >= new Date()) ||
                      sortedDates[0];

  if (!selectedDate && defaultDate) {
    setSelectedDate(defaultDate);
  }

  const updateAttendance = async (bookingId: string, status: AttendanceStatus) => {
    if (!selectedDate || !schedule) return;

    setIsUpdating(bookingId);
    try {
      // Check for existing attendance record
      const booking = schedule.bookings?.find((b: any) => b.id === bookingId) as any;
      const existingAttendance = booking?.attendances?.find(
        (a: any) => new Date(a.class_date).toDateString() === new Date(selectedDate).toDateString()
      );

      if (existingAttendance) {
        // Update existing - clear grade if not present
        const updateData: any = { 
          attendance_status: status, 
          updated_at: new Date().toISOString() 
        };
        if (status !== 'present') {
          updateData.performance_grade = null;
        }
        
        const { error } = await supabase
          .from('class_attendance')
          .update(updateData)
          .eq('id', existingAttendance.id);
        
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('class_attendance')
          .insert({
            booking_id: bookingId,
            class_schedule_id: scheduleId,
            class_date: new Date(selectedDate).toISOString(),
            attendance_status: status
          });
        
        if (error) throw error;
      }

      toast({
        title: "Attendance updated",
        description: `Marked as ${status}`,
      });

      refetch();
    } catch (error) {
      console.error("Error updating attendance:", error);
      toast({
        title: "Error",
        description: "Failed to update attendance",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const updateGrade = async (bookingId: string, grade: PerformanceGrade) => {
    if (!selectedDate || !schedule) return;

    setIsUpdatingGrade(bookingId);
    try {
      const booking = schedule.bookings?.find((b: any) => b.id === bookingId) as any;
      const existingAttendance = booking?.attendances?.find(
        (a: any) => new Date(a.class_date).toDateString() === new Date(selectedDate).toDateString()
      );

      if (existingAttendance) {
        const { error } = await supabase
          .from('class_attendance')
          .update({ 
            performance_grade: grade, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', existingAttendance.id);
        
        if (error) throw error;
        
        toast({
          title: "Grade updated",
          description: grade ? `Set to ${grade}` : "Grade cleared",
        });
        
        refetch();
      }
    } catch (error) {
      console.error("Error updating grade:", error);
      toast({
        title: "Error",
        description: "Failed to update grade",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingGrade(null);
    }
  };

  const getAttendanceStatus = (booking: any): AttendanceStatus => {
    if (!selectedDate || !booking.attendances) return 'not_marked';
    const attendance = booking.attendances.find(
      (a: any) => new Date(a.class_date).toDateString() === new Date(selectedDate).toDateString()
    );
    return attendance?.attendance_status || 'not_marked';
  };

  const getPerformanceGrade = (booking: any): PerformanceGrade => {
    if (!selectedDate || !booking.attendances) return null;
    const attendance = booking.attendances.find(
      (a: any) => new Date(a.class_date).toDateString() === new Date(selectedDate).toDateString()
    );
    return attendance?.performance_grade || null;
  };

  const AttendanceButton = ({ booking, targetStatus, icon: Icon, label, activeClass }: {
    booking: any;
    targetStatus: AttendanceStatus;
    icon: any;
    label: string;
    activeClass: string;
  }) => {
    const currentStatus = getAttendanceStatus(booking);
    const isActive = currentStatus === targetStatus;
    const isLoading = isUpdating === booking.id;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`h-9 w-9 p-0 rounded-full ${isActive ? activeClass : 'bg-muted hover:bg-muted/80'}`}
              onClick={() => updateAttendance(booking.id, targetStatus)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const GradeButton = ({ booking, grade }: { booking: any; grade: string }) => {
    const currentGrade = getPerformanceGrade(booking);
    const isActive = currentGrade === grade;
    const isLoading = isUpdatingGrade === booking.id;
    const gradeInfo = GRADE_INFO[grade] || { label: grade, color: 'text-gray-700', bgColor: 'bg-gray-100 hover:bg-gray-200 border-gray-300' };

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-10 w-10 sm:h-9 sm:w-9 p-0 text-base sm:text-sm font-bold border-2 transition-all ${
                isActive 
                  ? `${gradeInfo.bgColor} ${gradeInfo.color} ring-2 ring-offset-1 ring-${grade === 'A' ? 'emerald' : grade === 'B' ? 'blue' : grade === 'C' ? 'cyan' : grade === 'D' ? 'amber' : grade === 'E' ? 'orange' : 'red'}-400`
                  : 'bg-background hover:bg-muted border-muted-foreground/20'
              }`}
              onClick={() => updateGrade(booking.id, isActive ? null : grade as PerformanceGrade)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                grade
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px]">
            <p className="font-semibold">{grade}</p>
            <p className="text-xs">{gradeInfo.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Randburg Puppy: single-step cycle matching admin AttendanceStatusCell
  const RANDBURG_STATUS_CYCLE: string[] = ['not_marked', '1', '2', '3', '4', '5', '6', 'absent', 'excused'];

  const getRandburgDisplayStatus = (booking: any): string => {
    const status = getAttendanceStatus(booking);
    const grade = getPerformanceGrade(booking);
    if (status === 'present' && grade) return grade; // "1", "2", etc.
    if (status === 'absent') return 'absent';
    if (status === 'excused') return 'excused';
    if (status === 'present') return '1'; // Default to 1 if present but no grade
    return 'not_marked';
  };

  const handleRandburgCycle = async (booking: any) => {
    if (!selectedDate || !schedule) return;
    
    const currentDisplay = getRandburgDisplayStatus(booking);
    const currentIndex = RANDBURG_STATUS_CYCLE.indexOf(currentDisplay);
    const nextIndex = (currentIndex + 1) % RANDBURG_STATUS_CYCLE.length;
    const nextStatus = RANDBURG_STATUS_CYCLE[nextIndex];

    // Determine attendance_status and performance_grade
    const numVal = parseInt(nextStatus);
    let attendanceStatus: AttendanceStatus;
    let grade: string | null = null;

    if (!isNaN(numVal) && numVal >= 1 && numVal <= 6) {
      attendanceStatus = 'present';
      grade = nextStatus;
    } else if (nextStatus === 'absent') {
      attendanceStatus = 'absent';
    } else if (nextStatus === 'excused') {
      attendanceStatus = 'excused';
    } else {
      attendanceStatus = 'not_marked';
    }

    setIsUpdating(booking.id);
    try {
      const existingAttendance = booking?.attendances?.find(
        (a: any) => new Date(a.class_date).toDateString() === new Date(selectedDate).toDateString()
      );

      if (existingAttendance) {
        const { error } = await supabase
          .from('class_attendance')
          .update({
            attendance_status: attendanceStatus,
            performance_grade: grade,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAttendance.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('class_attendance')
          .insert({
            booking_id: booking.id,
            class_schedule_id: scheduleId,
            class_date: new Date(selectedDate).toISOString(),
            attendance_status: attendanceStatus,
            performance_grade: grade,
          });
        if (error) throw error;
      }

      const statusLabels: Record<string, string> = {
        present: 'Present', absent: 'Absent', excused: 'Excused', not_marked: 'Cleared',
        '1': 'Week 1', '2': 'Week 2', '3': 'Week 3', '4': 'Week 4', '5': 'Week 5', '6': 'Week 6',
      };

      toast({
        title: `Marked as ${statusLabels[nextStatus] || nextStatus}`,
        duration: 1500,
      });

      refetch();
    } catch (error) {
      console.error("Error updating attendance:", error);
      toast({ title: "Error updating attendance", variant: "destructive" });
    } finally {
      setIsUpdating(null);
    }
  };

  // Direct-tap handler for mobile Randburg Puppy (matches admin MobileHandlerCard)
  const handleRandburgDirectTap = async (booking: any, weekNumOrStatus: string) => {
    if (!selectedDate || !schedule) return;

    const currentDisplay = getRandburgDisplayStatus(booking);
    
    let attendanceStatus: AttendanceStatus;
    let grade: string | null = null;

    if (currentDisplay === weekNumOrStatus) {
      attendanceStatus = 'not_marked';
      grade = null;
    } else if (weekNumOrStatus === 'absent') {
      attendanceStatus = 'absent';
    } else if (weekNumOrStatus === 'excused') {
      attendanceStatus = 'excused';
    } else {
      attendanceStatus = 'present';
      grade = weekNumOrStatus;
    }

    setIsUpdating(booking.id);
    try {
      const existingAttendance = booking?.attendances?.find(
        (a: any) => new Date(a.class_date).toDateString() === new Date(selectedDate).toDateString()
      );

      if (existingAttendance) {
        const { error } = await supabase
          .from('class_attendance')
          .update({
            attendance_status: attendanceStatus,
            performance_grade: grade,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAttendance.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('class_attendance')
          .insert({
            booking_id: booking.id,
            class_schedule_id: scheduleId,
            class_date: new Date(selectedDate).toISOString(),
            attendance_status: attendanceStatus,
            performance_grade: grade,
          });
        if (error) throw error;
      }

      const statusLabels: Record<string, string> = {
        not_marked: 'Cleared', '1': 'Week 1', '2': 'Week 2', '3': 'Week 3',
        '4': 'Week 4', '5': 'Week 5', '6': 'Week 6', absent: 'Absent', excused: 'Excused',
      };
      const labelKey = attendanceStatus === 'not_marked' ? 'not_marked' : (grade || attendanceStatus);

      toast({ title: `Marked as ${statusLabels[labelKey] || labelKey}`, duration: 1500 });
      refetch();
    } catch (error) {
      console.error("Error updating attendance:", error);
      toast({ title: "Error updating attendance", variant: "destructive" });
    } finally {
      setIsUpdating(null);
    }
  };

  const RandburgStatusCircle = ({ booking }: { booking: any }) => {
    const displayStatus = getRandburgDisplayStatus(booking);
    const isLoading = isUpdating === booking.id;
    
    const numVal = parseInt(displayStatus);
    let icon: React.ReactNode;
    let bgColor: string;

    if (!isNaN(numVal) && numVal >= 1 && numVal <= 6) {
      icon = <span className="text-sm font-bold text-white">{numVal}</span>;
      bgColor = "bg-green-600 hover:bg-green-700";
    } else if (displayStatus === 'absent') {
      icon = <X className="h-4 w-4 text-white" />;
      bgColor = "bg-red-600 hover:bg-red-700";
    } else if (displayStatus === 'excused') {
      icon = <AlertTriangle className="h-4 w-4 text-white" />;
      bgColor = "bg-amber-500 hover:bg-amber-600";
    } else {
      icon = <CalendarRange className="h-4 w-4 text-muted-foreground" />;
      bgColor = "bg-muted hover:bg-muted/80";
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`h-9 w-9 rounded-full flex items-center justify-center cursor-pointer transition-colors ${bgColor} ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={() => handleRandburgCycle(booking)}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{displayStatus === 'not_marked' ? 'Click to mark attendance' : 
               !isNaN(parseInt(displayStatus)) ? `Week ${displayStatus}` :
               displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}</p>
            <p className="text-xs text-muted-foreground">Click to cycle status</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (!isTrainer) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p>Access restricted to trainers only.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!schedule) {
    return (
      <DashboardLayout>
        <div className="py-4 sm:py-6 px-2 sm:px-0">
          <Button variant="ghost" onClick={() => navigate('/trainer/classes')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Classes
          </Button>
          <div className="flex items-center justify-center h-64">
            <p>Class not found or you don't have access to this class.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isPast = new Date(schedule.start_time) < new Date();

  return (
    <DashboardLayout>
      <Helmet>
        <title>{schedule.classes?.name} - Attendance</title>
      </Helmet>

      <div className="space-y-4 sm:space-y-6 py-4 sm:py-6 px-2 sm:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/trainer/classes')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold">{schedule.classes?.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="secondary">{schedule.classes?.class_type}</Badge>
              {isPast ? (
                <Badge variant="outline">Completed</Badge>
              ) : (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Upcoming</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Grade Key - Only show for non-Randburg classes */}
        {!isRandburgPuppy && (
          <Card className="bg-muted/30">
            <CardContent className="p-3 sm:p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Performance Grade Key:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                {['A','B','C','D','E','F'].map((grade) => {
                  const info = GRADE_INFO[grade];
                  return (
                    <div key={grade} className={`px-2 py-1.5 rounded border ${info.bgColor}`}>
                      <span className={`font-bold ${info.color}`}>{grade}</span>
                      <span className="text-muted-foreground ml-1 hidden sm:inline">- {info.label}</span>
                      <span className="text-muted-foreground ml-1 sm:hidden">- {info.label.split(',')[0]}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Randburg Puppy: Session week key */}
        {isRandburgPuppy && (
          <Card className="bg-muted/30">
            <CardContent className="p-3 sm:p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Session Week Key (click to cycle):</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1.5 rounded border bg-muted">⚪ Not marked</span>
                {['1','2','3','4','5','6'].map(n => (
                  <span key={n} className="px-2 py-1.5 rounded border bg-green-100 text-green-700 border-green-300 font-bold">
                    {n} - Week {n}
                  </span>
                ))}
                <span className="px-2 py-1.5 rounded border bg-red-100 text-red-700 border-red-300">✕ Absent</span>
                <span className="px-2 py-1.5 rounded border bg-amber-100 text-amber-700 border-amber-300">⚠ Excused</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Class Info */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium">{format(new Date(schedule.start_time), "PPP")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="text-sm font-medium">
                    {format(new Date(schedule.start_time), "HH:mm")} - {format(new Date(schedule.end_time), "HH:mm")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Enrolled</p>
                  <p className="text-sm font-medium">
                    {schedule.bookings?.length || 0} / {schedule.classes?.capacity || '∞'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Section */}
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <CalendarRange className="h-5 w-5" />
                {isRandburgPuppy ? 'Mark Attendance' : 'Mark Attendance & Grade'}
              </CardTitle>
              
              {/* Desktop: dropdown date selector */}
              {sortedDates.length > 1 && !isMobile && (
                <Select value={selectedDate || ''} onValueChange={setSelectedDate}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Select date" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedDates.map((date) => (
                      <SelectItem key={date} value={date}>
                        {format(new Date(date), "EEE, MMM d, yyyy")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            {/* Mobile: scrollable date pill picker */}
            {isMobile && sortedDates.length > 1 && (
              <div className="bg-card border rounded-lg p-3 mt-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    onClick={() => {
                      const idx = selectedDate ? sortedDates.indexOf(selectedDate) : -1;
                      if (idx > 0) setSelectedDate(sortedDates[idx - 1]);
                    }}
                    disabled={!selectedDate || sortedDates.indexOf(selectedDate) <= 0}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div 
                    ref={dateScrollRef}
                    className="flex-1 overflow-x-auto scrollbar-hide flex gap-2 py-1"
                  >
                    {sortedDates.map((date) => {
                      const dateObj = new Date(date);
                      const isSelected = date === selectedDate;
                      const isTodayDate = isToday(dateObj);
                      return (
                        <button
                          key={date}
                          data-date={date}
                          onClick={() => setSelectedDate(date)}
                          className={`
                            shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95
                            ${isSelected 
                              ? 'bg-primary text-primary-foreground shadow-md' 
                              : 'bg-muted hover:bg-muted/80 text-foreground'
                            }
                            ${isTodayDate && !isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}
                          `}
                        >
                          <div className="flex flex-col items-center">
                            <span className="text-xs opacity-70">{format(dateObj, 'EEE')}</span>
                            <span className="font-semibold">{format(dateObj, 'd MMM')}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    onClick={() => {
                      const idx = selectedDate ? sortedDates.indexOf(selectedDate) : -1;
                      if (idx < sortedDates.length - 1) setSelectedDate(sortedDates[idx + 1]);
                    }}
                    disabled={!selectedDate || sortedDates.indexOf(selectedDate) >= sortedDates.length - 1}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Desktop: show selected date text */}
            {!isMobile && selectedDate && (
              <p className="text-sm text-muted-foreground mt-2">
                Marking for: <strong>{format(new Date(selectedDate), "EEEE, MMMM d, yyyy")}</strong>
              </p>
            )}
          </CardHeader>
          
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            {!schedule.bookings || schedule.bookings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No students enrolled yet.
              </p>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Handler</TableHead>
                        <TableHead>Dog</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead className="text-center">
                          {isRandburgPuppy ? 'Attendance (Week)' : 'Attendance'}
                        </TableHead>
                        {!isRandburgPuppy && (
                          <TableHead className="text-center">Performance Grade</TableHead>
                        )}
                        <TableHead className="text-center w-[80px]">Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedule.bookings.map((booking: any) => {
                        const status = getAttendanceStatus(booking);
                        const grade = getPerformanceGrade(booking);
                        return (
                          <TableRow key={booking.id}>
                            <TableCell className="font-medium">
                              {booking.clients?.first_name} {booking.clients?.last_name}
                            </TableCell>
                            <TableCell>
                              <div>
                                <span className="font-medium">{booking.dogs?.name}</span>
                                <span className="text-sm text-muted-foreground ml-1">
                                  ({booking.dogs?.breed})
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {booking.clients?.phone || '-'}
                            </TableCell>
                            <TableCell>
                              {isRandburgPuppy ? (
                                <div className="flex items-center justify-center">
                                  <RandburgStatusCircle booking={booking} />
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  <AttendanceButton
                                    booking={booking}
                                    targetStatus="present"
                                    icon={Check}
                                    label="Present"
                                    activeClass="bg-green-600 hover:bg-green-700"
                                  />
                                  <AttendanceButton
                                    booking={booking}
                                    targetStatus="absent"
                                    icon={X}
                                    label="Absent"
                                    activeClass="bg-red-600 hover:bg-red-700"
                                  />
                                  <AttendanceButton
                                    booking={booking}
                                    targetStatus="excused"
                                    icon={AlertTriangle}
                                    label="Excused"
                                    activeClass="bg-amber-500 hover:bg-amber-600"
                                  />
                                </div>
                              )}
                            </TableCell>
                            {!isRandburgPuppy && (
                              <TableCell>
                                {status === 'present' ? (
                                  <div className="flex items-center justify-center gap-1">
                                    {['A','B','C','D','E','F'].map((g) => (
                                      <GradeButton key={g} booking={booking} grade={g} />
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-center text-xs text-muted-foreground">
                                    Mark present to grade
                                  </p>
                                )}
                              </TableCell>
                            )}
                            <TableCell className="text-center">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-primary hover:text-primary/80 hover:bg-primary/10"
                                      onClick={() => {
                                        setSelectedBookingForNote(booking);
                                        setNoteModalOpen(true);
                                      }}
                                    >
                                      <MessageSquarePlus className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Leave note for admin</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile/Tablet: Inline attendance stats for Randburg Puppy */}
                {isMobile && isRandburgPuppy && selectedDate && schedule.bookings && (
                  <div className="grid grid-cols-4 gap-2 p-4 pb-0">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                      <div className="flex justify-center mb-1">
                        <div className="h-7 w-7 rounded-full bg-green-600 flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="text-lg font-bold text-green-700">
                        {schedule.bookings.filter((b: any) => getAttendanceStatus(b) === 'present').length}
                      </div>
                      <div className="text-xs text-green-600">Present</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
                      <div className="flex justify-center mb-1">
                        <div className="h-7 w-7 rounded-full bg-red-600 flex items-center justify-center">
                          <X className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="text-lg font-bold text-red-700">
                        {schedule.bookings.filter((b: any) => getAttendanceStatus(b) === 'absent').length}
                      </div>
                      <div className="text-xs text-red-600">Absent</div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-center">
                      <div className="flex justify-center mb-1">
                        <div className="h-7 w-7 rounded-full bg-amber-500 flex items-center justify-center">
                          <AlertTriangle className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="text-lg font-bold text-amber-700">
                        {schedule.bookings.filter((b: any) => getAttendanceStatus(b) === 'excused').length}
                      </div>
                      <div className="text-xs text-amber-600">Excused</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                      <div className="flex justify-center mb-1">
                        <div className="h-7 w-7 rounded-full bg-gray-400 flex items-center justify-center">
                          <HelpCircle className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="text-lg font-bold text-gray-700">
                        {schedule.bookings.filter((b: any) => getAttendanceStatus(b) === 'not_marked').length}
                      </div>
                      <div className="text-xs text-gray-600">Unmarked</div>
                    </div>
                  </div>
                )}

                {/* Mobile/Tablet List - Optimized for touch */}
                <div className="lg:hidden divide-y">
                  {schedule.bookings.map((booking: any) => {
                    const status = getAttendanceStatus(booking);
                    const grade = getPerformanceGrade(booking);
                    const randburgDisplay = isRandburgPuppy ? getRandburgDisplayStatus(booking) : null;
                    const bookingIsLoading = isUpdating === booking.id;

                    // Randburg Puppy mobile: match admin MobileHandlerCard layout
                    if (isRandburgPuppy) {
                      return (
                        <div key={booking.id} className="bg-card border rounded-lg p-4 mb-3 mx-4 shadow-sm">
                          {/* Handler & Dog Info */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base truncate">
                                {booking.clients?.first_name} {booking.clients?.last_name}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="truncate">{booking.dogs?.name}</span>
                                {booking.dogs?.breed && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate">{booking.dogs.breed}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            {/* Week badge */}
                            {randburgDisplay && randburgDisplay !== 'not_marked' && (
                              <Badge 
                                variant="outline"
                                className={`shrink-0 ml-2 ${
                                  !isNaN(parseInt(randburgDisplay)) ? 'bg-green-100 text-green-800 border-green-200' :
                                  randburgDisplay === 'absent' ? 'bg-red-100 text-red-800 border-red-200' :
                                  'bg-amber-100 text-amber-800 border-amber-200'
                                }`}
                              >
                                {!isNaN(parseInt(randburgDisplay)) ? `Week ${randburgDisplay}` : randburgDisplay}
                              </Badge>
                            )}
                          </div>

                          {/* Phone Number - Tappable */}
                          {booking.clients?.phone && (
                            <a 
                              href={`tel:${booking.clients.phone}`}
                              className="flex items-center gap-2 text-sm text-primary mb-3 active:opacity-70"
                            >
                              <Phone className="h-4 w-4" />
                              <span>{booking.clients.phone}</span>
                            </a>
                          )}

                          {/* Attendance: 6 numbered buttons + absent + excused */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              {['1', '2', '3', '4', '5', '6'].map(num => {
                                const isActive = randburgDisplay === num;
                                return (
                                  <button
                                    key={num}
                                    onClick={() => handleRandburgDirectTap(booking, num)}
                                    disabled={bookingIsLoading}
                                    className={`h-10 w-10 rounded-full flex items-center justify-center transition-all active:scale-95 text-sm font-bold ${
                                      isActive 
                                        ? 'bg-green-600 text-white shadow-lg' 
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    } ${bookingIsLoading ? 'opacity-50' : ''}`}
                                    aria-label={`Mark week ${num}`}
                                  >
                                    {bookingIsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : num}
                                  </button>
                                );
                              })}
                              <button
                                onClick={() => handleRandburgDirectTap(booking, 'absent')}
                                disabled={bookingIsLoading}
                                className={`h-12 w-12 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                                  randburgDisplay === 'absent'
                                    ? 'bg-red-600 text-white shadow-lg'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                } ${bookingIsLoading ? 'opacity-50' : ''}`}
                                aria-label="Mark absent"
                              >
                                <X className="h-6 w-6" />
                              </button>
                              <button
                                onClick={() => handleRandburgDirectTap(booking, 'excused')}
                                disabled={bookingIsLoading}
                                className={`h-12 w-12 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                                  randburgDisplay === 'excused'
                                    ? 'bg-amber-500 text-white shadow-lg'
                                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                } ${bookingIsLoading ? 'opacity-50' : ''}`}
                                aria-label="Mark excused"
                              >
                                <AlertTriangle className="h-5 w-5" />
                              </button>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-10 shrink-0"
                              onClick={() => {
                                setSelectedBookingForNote(booking);
                                setNoteModalOpen(true);
                              }}
                            >
                              <MessageSquarePlus className="h-4 w-4 mr-1" />
                              Note
                            </Button>
                          </div>
                        </div>
                      );
                    }

                    // Non-Randburg: standard mobile layout
                    return (
                      <div key={booking.id} className="p-4 space-y-3">
                        {/* Handler Info Row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">
                                {booking.clients?.first_name} {booking.clients?.last_name}
                              </span>
                              {status !== 'not_marked' && (
                                <Badge 
                                  variant="outline"
                                  className={
                                    status === 'present' ? 'bg-green-100 text-green-800 border-green-300' :
                                    status === 'absent' ? 'bg-red-100 text-red-800 border-red-300' :
                                    'bg-amber-100 text-amber-800 border-amber-300'
                                  }
                                >
                                  {status}
                                </Badge>
                              )}
                              {grade && GRADE_INFO[grade] && (
                                <Badge className={`${GRADE_INFO[grade].bgColor} ${GRADE_INFO[grade].color} border`}>
                                  Grade: {grade}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {booking.dogs?.name} • {booking.dogs?.breed}
                            </p>
                            {booking.clients?.phone && (
                              <a 
                                href={`tel:${booking.clients.phone}`}
                                className="text-xs text-primary hover:underline"
                              >
                                {booking.clients.phone}
                              </a>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 gap-1.5"
                            onClick={() => {
                              setSelectedBookingForNote(booking);
                              setNoteModalOpen(true);
                            }}
                          >
                            <MessageSquarePlus className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Note</span>
                          </Button>
                        </div>
                        
                        {/* Attendance Buttons */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-16 shrink-0">Attendance:</span>
                          <div className="flex items-center gap-2">
                            <AttendanceButton
                              booking={booking}
                              targetStatus="present"
                              icon={Check}
                              label="Present"
                              activeClass="bg-green-600 hover:bg-green-700"
                            />
                            <AttendanceButton
                              booking={booking}
                              targetStatus="absent"
                              icon={X}
                              label="Absent"
                              activeClass="bg-red-600 hover:bg-red-700"
                            />
                            <AttendanceButton
                              booking={booking}
                              targetStatus="excused"
                              icon={AlertTriangle}
                              label="Excused"
                              activeClass="bg-amber-500 hover:bg-amber-600"
                            />
                          </div>
                        </div>

                        {/* Grade Buttons - Only show when present and NOT Randburg Puppy */}
                        {status === 'present' && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-16 shrink-0">Grade:</span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {['A','B','C','D','E','F'].map((g) => (
                                <GradeButton key={g} booking={booking} grade={g} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        {schedule.bookings && schedule.bookings.length > 0 && selectedDate && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-green-700">
                  {schedule.bookings.filter((b: any) => getAttendanceStatus(b) === 'present').length}
                </p>
                <p className="text-xs text-green-600">Present</p>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-red-700">
                  {schedule.bookings.filter((b: any) => getAttendanceStatus(b) === 'absent').length}
                </p>
                <p className="text-xs text-red-600">Absent</p>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-amber-700">
                  {schedule.bookings.filter((b: any) => getAttendanceStatus(b) === 'not_marked').length}
                </p>
                <p className="text-xs text-amber-600">Unmarked</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Trainer Note Modal */}
        {selectedBookingForNote && trainerProfile && (
          <TrainerNoteModal
            open={noteModalOpen}
            onOpenChange={(open) => {
              setNoteModalOpen(open);
              if (!open) setSelectedBookingForNote(null);
            }}
            handlerId={selectedBookingForNote.clients?.id || ""}
            handlerName={`${selectedBookingForNote.clients?.first_name || ""} ${selectedBookingForNote.clients?.last_name || ""}`}
            dogName={selectedBookingForNote.dogs?.name}
            trainerId={trainerProfile.id}
            trainerName={trainerProfile.first_name && trainerProfile.last_name 
              ? `${trainerProfile.first_name} ${trainerProfile.last_name}` 
              : trainerProfile.email || "Trainer"}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
