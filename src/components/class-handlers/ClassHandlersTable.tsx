
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { AttendanceIndicator } from "./AttendanceIndicator";
import { Button } from "@/components/ui/button";
import { Calendar, Check, Save } from "lucide-react";

interface ClassHandlersTableProps {
  classId: string;
}

export function ClassHandlersTable({ classId }: ClassHandlersTableProps) {
  const { toast } = useToast();
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Fetch class schedule dates
  const { data: scheduleDates, isLoading: isLoadingDates } = useQuery({
    queryKey: ['class-schedule-dates', classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_schedules')
        .select('id, start_time, selected_dates')
        .eq('class_id', classId);
      
      if (error) throw error;
      
      // Extract unique dates from all schedules
      const dates = new Set<string>();
      data.forEach(schedule => {
        dates.add(format(new Date(schedule.start_time), 'yyyy-MM-dd'));
        
        if (schedule.selected_dates) {
          schedule.selected_dates.forEach((date: string) => {
            dates.add(format(new Date(date), 'yyyy-MM-dd'));
          });
        }
      });
      
      return Array.from(dates).sort();
    }
  });

  // Fetch handlers/bookings for this class
  const { data: handlers, isLoading: isLoadingHandlers, refetch } = useQuery({
    queryKey: ['class-handlers', classId],
    queryFn: async () => {
      const { data: scheduleIds, error: scheduleError } = await supabase
        .from('class_schedules')
        .select('id')
        .eq('class_id', classId);
      
      if (scheduleError) throw scheduleError;
      
      if (!scheduleIds.length) return [];
      
      const scheduleIdList = scheduleIds.map(s => s.id);
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, 
          is_enrolled, 
          vaccination_verified, 
          proof_of_payment, 
          additional_notes,
          info_eo,
          uses_whatsapp,
          social_media_consent,
          info_pg,
          class_schedule_id,
          dogs:dog_id(id, name, breed),
          clients:client_id(id, first_name, last_name, email, phone)
        `)
        .in('class_schedule_id', scheduleIdList);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch attendance records for this class
  const { data: attendanceData, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['class-attendance', classId],
    queryFn: async () => {
      const { data: scheduleIds } = await supabase
        .from('class_schedules')
        .select('id')
        .eq('class_id', classId);
      
      if (!scheduleIds?.length) return {};
      
      const scheduleIdList = scheduleIds.map(s => s.id);
      
      const { data, error } = await supabase
        .from('class_attendance')
        .select('*')
        .in('class_schedule_id', scheduleIdList);
      
      if (error) throw error;
      
      // Organize attendance by booking_id and date
      const attendanceMap: Record<string, Record<string, string>> = {};
      
      data?.forEach(record => {
        if (!attendanceMap[record.booking_id]) {
          attendanceMap[record.booking_id] = {};
        }
        const dateStr = format(new Date(record.class_date), 'yyyy-MM-dd');
        attendanceMap[record.booking_id][dateStr] = record.attendance_status;
      });
      
      return attendanceMap;
    }
  });

  const handleInputChange = (bookingId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [bookingId]: {
        ...prev[bookingId],
        [field]: value
      }
    }));
  };

  const startEditing = (booking: any) => {
    setEditingBookingId(booking.id);
    setFormData(prev => ({
      ...prev,
      [booking.id]: {
        is_enrolled: booking.is_enrolled,
        vaccination_verified: booking.vaccination_verified,
        proof_of_payment: booking.proof_of_payment || '',
        additional_notes: booking.additional_notes || '',
        info_eo: booking.info_eo || '',
        uses_whatsapp: booking.uses_whatsapp,
        social_media_consent: booking.social_media_consent,
        info_pg: booking.info_pg || ''
      }
    }));
  };

  const saveChanges = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update(formData[bookingId])
        .eq('id', bookingId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Handler information updated",
      });
      
      setEditingBookingId(null);
      refetch();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: "Failed to update handler information",
        variant: "destructive",
      });
    }
  };

  if (isLoadingHandlers || isLoadingDates || isLoadingAttendance) {
    return <div className="text-center p-6">Loading class handlers...</div>;
  }

  if (!handlers || handlers.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-md border">
        <p className="text-muted-foreground">No handlers found for this class.</p>
        <p className="text-sm mt-2">Add handlers to this class to start tracking attendance.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Handler / Dog</TableHead>
            <TableHead className="text-center">Enrol</TableHead>
            <TableHead className="text-center">Vacc</TableHead>
            <TableHead>POP</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Info EO</TableHead>
            <TableHead className="text-center">WA</TableHead>
            <TableHead className="text-center">Social</TableHead>
            <TableHead>Info PG</TableHead>
            {scheduleDates?.map(date => (
              <TableHead key={date} className="text-center whitespace-nowrap">
                <div className="flex items-center gap-1 justify-center">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(date), 'dd MMM yyyy')}
                </div>
              </TableHead>
            ))}
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {handlers.map(booking => {
            const isEditing = editingBookingId === booking.id;
            const bookingData = formData[booking.id] || booking;
            
            return (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">
                  <div>
                    <span className="font-semibold">
                      {booking.clients?.first_name} {booking.clients?.last_name}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {booking.dogs?.name} ({booking.dogs?.breed})
                  </div>
                </TableCell>
                
                <TableCell className="text-center">
                  {isEditing ? (
                    <Checkbox 
                      checked={bookingData.is_enrolled} 
                      onCheckedChange={(checked) => 
                        handleInputChange(booking.id, 'is_enrolled', checked)
                      }
                    />
                  ) : (
                    booking.is_enrolled ? <Check className="mx-auto h-4 w-4 text-green-600" /> : null
                  )}
                </TableCell>
                
                <TableCell className="text-center">
                  {isEditing ? (
                    <Checkbox 
                      checked={bookingData.vaccination_verified} 
                      onCheckedChange={(checked) => 
                        handleInputChange(booking.id, 'vaccination_verified', checked)
                      }
                    />
                  ) : (
                    booking.vaccination_verified ? <Check className="mx-auto h-4 w-4 text-green-600" /> : null
                  )}
                </TableCell>
                
                <TableCell>
                  {isEditing ? (
                    <Input 
                      value={bookingData.proof_of_payment || ''} 
                      onChange={(e) => handleInputChange(booking.id, 'proof_of_payment', e.target.value)}
                      className="h-8 text-sm"
                    />
                  ) : (
                    booking.proof_of_payment || '-'
                  )}
                </TableCell>
                
                <TableCell>
                  {isEditing ? (
                    <Input 
                      value={bookingData.additional_notes || ''} 
                      onChange={(e) => handleInputChange(booking.id, 'additional_notes', e.target.value)}
                      className="h-8 text-sm"
                    />
                  ) : (
                    booking.additional_notes || '-'
                  )}
                </TableCell>
                
                <TableCell>
                  {isEditing ? (
                    <Input 
                      value={bookingData.info_eo || ''} 
                      onChange={(e) => handleInputChange(booking.id, 'info_eo', e.target.value)}
                      className="h-8 text-sm"
                    />
                  ) : (
                    booking.info_eo || '-'
                  )}
                </TableCell>
                
                <TableCell className="text-center">
                  {isEditing ? (
                    <Checkbox 
                      checked={bookingData.uses_whatsapp} 
                      onCheckedChange={(checked) => 
                        handleInputChange(booking.id, 'uses_whatsapp', checked)
                      }
                    />
                  ) : (
                    booking.uses_whatsapp ? <Check className="mx-auto h-4 w-4 text-green-600" /> : null
                  )}
                </TableCell>
                
                <TableCell className="text-center">
                  {isEditing ? (
                    <Checkbox 
                      checked={bookingData.social_media_consent} 
                      onCheckedChange={(checked) => 
                        handleInputChange(booking.id, 'social_media_consent', checked)
                      }
                    />
                  ) : (
                    booking.social_media_consent ? <Check className="mx-auto h-4 w-4 text-green-600" /> : null
                  )}
                </TableCell>
                
                <TableCell>
                  {isEditing ? (
                    <Input 
                      value={bookingData.info_pg || ''} 
                      onChange={(e) => handleInputChange(booking.id, 'info_pg', e.target.value)}
                      className="h-8 text-sm"
                    />
                  ) : (
                    booking.info_pg || '-'
                  )}
                </TableCell>
                
                {scheduleDates?.map(date => (
                  <TableCell key={date} className="text-center">
                    <AttendanceIndicator
                      bookingId={booking.id}
                      scheduleId={booking.class_schedule_id}
                      date={date}
                      status={attendanceData?.[booking.id]?.[date] || 'not_marked'}
                    />
                  </TableCell>
                ))}
                
                <TableCell>
                  {isEditing ? (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => saveChanges(booking.id)}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditing(booking)}
                    >
                      Edit
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
