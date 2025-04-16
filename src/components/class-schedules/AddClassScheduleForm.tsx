
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useEffect } from "react";
import { format } from "date-fns";
import { useClassScheduleForm } from "./hooks/useClassScheduleForm";
import { Class } from "@/components/classes/types/class";
import { ClassScheduleFormFields } from "./ClassScheduleFormFields";
import { useQueryClient } from "@tanstack/react-query";

interface AddClassScheduleFormProps {
  classId: string;
  classData: Class;
  onSuccess: () => void;
}

export function AddClassScheduleForm({ 
  classId, 
  classData, 
  onSuccess 
}: AddClassScheduleFormProps) {
  const queryClient = useQueryClient();
  
  const { 
    form, 
    isSubmitting, 
    trainers, 
    isLoadingTrainers, 
    onSubmit 
  } = useClassScheduleForm(classId, null, () => {
    // Invalidate and refetch class schedules on success
    queryClient.invalidateQueries({ queryKey: ['class-schedules'] });
    onSuccess();
  });

  // Extract values for conditional logic
  const startTime = form.watch("startTime");
  const selectedDates = form.watch("selectedDates") || [];
  
  // Update reference title when class data or start time changes
  useEffect(() => {
    if (classData && startTime) {
      try {
        const formattedTime = startTime.split(":")[0].padStart(2, "0") + "h" + startTime.split(":")[1].padStart(2, "0");
        const referenceTitle = `${classData.name} ${formattedTime} ${format(new Date(), 'MMMM/yyyy')}`;
        form.setValue("referenceTitle", referenceTitle);
        
        console.log("Updated form reference title:", referenceTitle);
      } catch (err) {
        console.error("Error updating reference title:", err);
      }
    }
  }, [classData, startTime, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ClassScheduleFormFields
          control={form.control}
          trainers={trainers}
          isLoadingTrainers={isLoadingTrainers}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Schedule"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
