import { useState } from "react";
import { useAuth } from "@/context/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar, Users, Clock, ArrowLeft, Loader2, Check, X, AlertTriangle, CalendarRange } from "lucide-react";
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

type AttendanceStatus = 'present' | 'absent' | 'excused' | 'not_marked';

export default function TrainerClassDetail() {
  const { trainerProfile, isTrainer } = useAuth();
  const { id: scheduleId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const { data: schedule, isLoading, refetch } = useQuery({
    queryKey: ['trainer-class-detail-full', scheduleId, trainerProfile?.id],
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
            description
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
        // Update existing
        const { error } = await supabase
          .from('class_attendance')
          .update({ attendance_status: status, updated_at: new Date().toISOString() })
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

  const getAttendanceStatus = (booking: any): AttendanceStatus => {
    if (!selectedDate || !booking.attendances) return 'not_marked';
    const attendance = booking.attendances.find(
      (a: any) => new Date(a.class_date).toDateString() === new Date(selectedDate).toDateString()
    );
    return attendance?.attendance_status || 'not_marked';
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
              className={`h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-full ${isActive ? activeClass : 'bg-muted hover:bg-muted/80'}`}
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
                Mark Attendance
              </CardTitle>
              
              {sortedDates.length > 1 && (
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
            
            {selectedDate && (
              <p className="text-sm text-muted-foreground mt-2">
                Marking attendance for: <strong>{format(new Date(selectedDate), "EEEE, MMMM d, yyyy")}</strong>
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
                <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Handler</TableHead>
                        <TableHead>Dog</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead className="text-center">Attendance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedule.bookings.map((booking: any) => (
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
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile List - Optimized for quick attendance marking */}
                <div className="sm:hidden divide-y">
                  {schedule.bookings.map((booking: any) => {
                    const status = getAttendanceStatus(booking);
                    return (
                      <div key={booking.id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {booking.clients?.first_name} {booking.clients?.last_name}
                              </span>
                              {status !== 'not_marked' && (
                                <Badge 
                                  className={
                                    status === 'present' ? 'bg-green-100 text-green-800' :
                                    status === 'absent' ? 'bg-red-100 text-red-800' :
                                    'bg-amber-100 text-amber-800'
                                  }
                                >
                                  {status}
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
                          
                          <div className="flex items-center gap-1.5">
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
      </div>
    </DashboardLayout>
  );
}
