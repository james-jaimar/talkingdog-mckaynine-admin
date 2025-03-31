
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Class } from "@/components/classes/types/class";
import { useToast } from "@/components/ui/use-toast";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface AddHandlerToClassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  classData: Class;
  onSuccess: () => void;
}

export function AddHandlerToClassModal({ 
  open, 
  onOpenChange, 
  classId, 
  classData,
  onSuccess 
}: AddHandlerToClassModalProps) {
  const [selectedHandler, setSelectedHandler] = useState<string>("");
  const [selectedDog, setSelectedDog] = useState<string>("");
  const [selectedSchedule, setSelectedSchedule] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch handlers
  const { data: handlers } = useQuery({
    queryKey: ["handlers-for-class"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, first_name, last_name, email");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch dogs for selected handler
  const { data: dogs } = useQuery({
    queryKey: ["dogs-for-handler", selectedHandler],
    queryFn: async () => {
      if (!selectedHandler) return [];
      
      const { data, error } = await supabase
        .from("dogs")
        .select("id, name, breed")
        .eq("client_id", selectedHandler);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedHandler,
  });

  // Fetch class schedules
  const { data: schedules } = useQuery({
    queryKey: ["schedules-for-class", classId],
    queryFn: async () => {
      if (!classId) return [];
      
      const { data, error } = await supabase
        .from("class_schedules")
        .select("id, start_time")
        .eq("class_id", classId)
        .order("start_time", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!classId,
  });

  const handleSubmit = async () => {
    if (!selectedHandler || !selectedDog || !selectedSchedule) {
      toast({
        title: "Missing information",
        description: "Please select a handler, dog, and class schedule",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a new booking
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          client_id: selectedHandler,
          dog_id: selectedDog,
          class_schedule_id: selectedSchedule,
          status: "confirmed",
          payment_status: "pending"
        })
        .select();

      if (error) throw error;

      toast({
        title: "Handler added to class",
        description: "The handler has been successfully enrolled in this class",
      });

      onSuccess();
    } catch (error) {
      console.error("Error adding handler to class:", error);
      toast({
        title: "Error",
        description: "Failed to add handler to class. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add Handler to {classData.name}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="handler">Handler</Label>
            <Select
              value={selectedHandler}
              onValueChange={setSelectedHandler}
            >
              <SelectTrigger id="handler">
                <SelectValue placeholder="Select a handler" />
              </SelectTrigger>
              <SelectContent>
                {handlers?.map((handler) => (
                  <SelectItem key={handler.id} value={handler.id}>
                    {handler.first_name} {handler.last_name} ({handler.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedHandler && (
            <div className="grid gap-2">
              <Label htmlFor="dog">Dog</Label>
              <Select
                value={selectedDog}
                onValueChange={setSelectedDog}
                disabled={!dogs || dogs.length === 0}
              >
                <SelectTrigger id="dog">
                  <SelectValue placeholder={!dogs || dogs.length === 0 ? "No dogs found" : "Select a dog"} />
                </SelectTrigger>
                <SelectContent>
                  {dogs?.map((dog) => (
                    <SelectItem key={dog.id} value={dog.id}>
                      {dog.name} ({dog.breed})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="schedule">Class Schedule</Label>
            <Select
              value={selectedSchedule}
              onValueChange={setSelectedSchedule}
              disabled={!schedules || schedules.length === 0}
            >
              <SelectTrigger id="schedule">
                <SelectValue placeholder={!schedules || schedules.length === 0 ? "No schedules found" : "Select a schedule"} />
              </SelectTrigger>
              <SelectContent>
                {schedules?.map((schedule) => (
                  <SelectItem key={schedule.id} value={schedule.id}>
                    {formatDate(schedule.start_time)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !selectedHandler || !selectedDog || !selectedSchedule}
          >
            {isSubmitting ? "Adding..." : "Add Handler"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
