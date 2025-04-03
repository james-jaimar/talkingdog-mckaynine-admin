
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

  // Debug what's happening with classData
  useEffect(() => {
    if (open && classData) {
      console.log("AddHandlerToClassModal - Class data:", classData);
    }
  }, [open, classData]);

  const addHandlerToClass = async (handlerId: string, dogId: string) => {
    setIsProcessing(true);
    
    try {
      console.log("Adding handler to class:", { 
        handlerId, 
        dogId, 
        classId
      });
      
      // First check if this handler-dog combination is already booked for this class
      const { data: existingBookings, error: checkError } = await supabase
        .from('bookings')
        .select('id')
        .eq('client_id', handlerId)
        .eq('dog_id', dogId)
        .eq('class_schedule_id', classId);
      
      if (checkError) {
        console.error("Error checking existing bookings:", checkError);
        throw checkError;
      }
      
      if (existingBookings && existingBookings.length > 0) {
        throw new Error("This handler and dog are already enrolled in this class");
      }
      
      // Create a booking record that connects the handler to the class
      const { data: newBooking, error } = await supabase
        .from('bookings')
        .insert({
          client_id: handlerId,
          dog_id: dogId,
          class_schedule_id: classId,
          is_enrolled: true,
          payment_status: 'pending'
        });
      
      if (error) {
        console.error("Error details:", error);
        throw error;
      }
      
      console.log("Successfully created booking");
      
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
