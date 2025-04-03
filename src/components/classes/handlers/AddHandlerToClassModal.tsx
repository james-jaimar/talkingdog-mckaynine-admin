
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { ExistingHandlersList } from "./ExistingHandlersList";
import { supabase } from "@/integrations/supabase/client";

interface AddHandlerToClassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  classData: any;
  onSuccess: () => void;
}

export function AddHandlerToClassModal({
  open,
  onOpenChange,
  classId,
  classData,
  onSuccess,
}: AddHandlerToClassModalProps) {
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

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        // Prevent closing while processing
        if (isProcessing && newOpen === false) return;
        
        // Clear search when opening/closing
        if (!newOpen) {
          setSearchQuery("");
        }
        
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Handler to {classData?.name}</DialogTitle>
          <DialogDescription>
            Select an existing handler to add to this class.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="existing" className="w-full">
          <TabsList className="mb-4 w-full grid grid-cols-1">
            <TabsTrigger value="existing">Select Existing Handler</TabsTrigger>
          </TabsList>
          
          <TabsContent value="existing" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search handlers by name, email, or dog name..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <ExistingHandlersList 
              searchQuery={searchQuery}
              onSelect={addHandlerToClass}
              classId={classId}
              isProcessing={isProcessing}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
