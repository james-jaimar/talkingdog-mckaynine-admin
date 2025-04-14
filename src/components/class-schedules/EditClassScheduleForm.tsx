
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { format } from "date-fns";
import { useEffect } from "react";
import { useClassScheduleForm } from "./hooks/useClassScheduleForm";
import { ClassSchedule } from "./types/classSchedule";
import { ClassScheduleFormFields } from "./ClassScheduleFormFields";

interface EditClassScheduleFormProps {
  classId: string;
  schedule: ClassSchedule;
  onSuccess: () => void;
}

export function EditClassScheduleForm({ 
  classId, 
  schedule, 
  onSuccess 
}: EditClassScheduleFormProps) {
  const { 
    form, 
    isSubmitting, 
    trainers, 
    isLoadingTrainers, 
    onSubmit 
  } = useClassScheduleForm(classId, schedule, onSuccess);

  // Extract values for conditional logic
  const startTime = form.watch("startTime");
  const selectedDates = form.watch("selectedDates") || [];
  
  // Update reference title when schedule.class.name or start time changes
  useEffect(() => {
    if (schedule.class?.name && startTime) {
      const formattedTime = startTime.split(":")[0].padStart(2, "0") + "h" + startTime.split(":")[1].padStart(2, "0");
      const referenceTitle = `${schedule.class.name} ${formattedTime} ${format(new Date(), 'MMMM/yyyy')}`;
      form.setValue("referenceTitle", referenceTitle);
    }
  }, [schedule.class?.name, startTime, form]);
  
  // Comment out the conflicting code that references removed fields
  // We don't need to explicitly set start/end dates anymore as we're using selectedDates
  /*
  useEffect(() => {
    if (selectedDates.length > 0) {
      // Sort dates to find first and last
      const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
      const firstDate = sortedDates[0];
      const lastDate = sortedDates[sortedDates.length - 1];
      
      // Update start and end dates
      form.setValue("startDate", firstDate);
      form.setValue("endDate", lastDate);
    }
  }, [selectedDates, form]);
  */

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
            {isSubmitting ? "Saving..." : "Update Schedule"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
