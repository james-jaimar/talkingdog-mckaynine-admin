
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UseAddHandlerModalProps {
  classId: string;
  onSuccess: () => void;
  onOpenChange: (open: boolean) => void;
}

export function useAddHandlerModal({ 
  classId, 
  onSuccess, 
  onOpenChange 
}: UseAddHandlerModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get actual schedule IDs for this class to ensure we're using the correct one
  const fetchScheduleId = async (): Promise<string | null> => {
    try {
      const { data: scheduleIds, error } = await supabase
        .from('class_schedules')
        .select('id')
        .eq('class_id', classId)
        .order('start_time', { ascending: true })
        .limit(1);
      
      if (error) throw error;
      
      return scheduleIds && scheduleIds.length > 0 ? scheduleIds[0].id : null;
    } catch (err) {
      console.error("Error fetching schedule ID:", err);
      return null;
    }
  };

  const addHandlerToClass = async (handlerId: string, dogId: string) => {
    if (isProcessing) return; // Prevent multiple submissions
    
    setIsProcessing(true);
    
    try {
      // First, find the correct schedule ID for this class
      const scheduleId = await fetchScheduleId();
      
      if (!scheduleId) {
        throw new Error("Could not find a schedule for this class");
      }
      
      console.log("Adding handler to class schedule:", { 
        handlerId, 
        dogId, 
        scheduleId
      });
      
      // First check if this handler-dog combination is already booked for this class schedule
      const { data: existingBookings, error: checkError } = await supabase
        .from('bookings')
        .select('id')
        .eq('client_id', handlerId)
        .eq('dog_id', dogId)
        .eq('class_schedule_id', scheduleId);
      
      if (checkError) {
        console.error("Error checking existing bookings:", checkError);
        throw checkError;
      }
      
      if (existingBookings && existingBookings.length > 0) {
        throw new Error("This handler and dog are already enrolled in this class");
      }
      
      // Create a booking record that connects the handler to the class
      const { error } = await supabase
        .from('bookings')
        .insert({
          client_id: handlerId,
          dog_id: dogId,
          class_schedule_id: scheduleId,
          is_enrolled: true,
          payment_status: 'pending'
        });
      
      if (error) {
        console.error("Error details:", error);
        throw error;
      }
      
      // Invalidate both handlers data and class-handlers data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["handlers"] }),
        queryClient.invalidateQueries({ queryKey: ["class-handlers", classId] }),
        queryClient.invalidateQueries({ queryKey: ["available-handlers", classId] })
      ]);
      
      toast({
        title: "Success",
        description: "Handler added to class successfully.",
      });
      
      // Close modal
      onOpenChange(false);
      
      // Call the onSuccess callback
      onSuccess();
    } catch (error: any) {
      console.error("Error adding handler to class:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add handler to class.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    // Prevent closing while processing
    if (isProcessing && newOpen === false) return;
    
    // Clear search when opening/closing
    if (!newOpen) {
      setSearchQuery("");
    }
    
    onOpenChange(newOpen);
  };

  return {
    isProcessing,
    searchQuery,
    setSearchQuery,
    addHandlerToClass,
    handleOpenChange
  };
}
