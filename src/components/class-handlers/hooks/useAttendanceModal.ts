
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function useAttendanceModal(classId: string) {
  // State for attendance modal
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleOpenAttendanceModal = (booking: any, date: string) => {
    setSelectedBooking(booking);
    setSelectedDate(date);
    setAttendanceModalOpen(true);
  };

  // Function to handle attendance updates and refresh data
  const handleAttendanceUpdated = () => {
    // Show success message
    toast({
      title: "Attendance updated",
      description: "Class attendance has been successfully recorded.",
    });
    
    // Immediately refresh the data
    setIsUpdating(true);
    
    queryClient.invalidateQueries({ queryKey: ['class-handlers', classId] })
      .finally(() => {
        setIsUpdating(false);
        setAttendanceModalOpen(false);
      });
  };

  return {
    attendanceModalOpen, 
    setAttendanceModalOpen,
    selectedBooking,
    selectedDate,
    isUpdating,
    handleOpenAttendanceModal,
    handleAttendanceUpdated
  };
}
