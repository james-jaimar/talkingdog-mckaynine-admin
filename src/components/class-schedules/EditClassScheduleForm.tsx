
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
  
  // Update reference title when schedule.class?.name or start time changes
  useEffect(() => {
    if (schedule.class?.name && startTime) {
      const formattedTime = startTime.split(":")[0].padStart(2, "0") + "h" + startTime.split(":")[1].padStart(2, "0");
      const referenceTitle = `${schedule.class.name} ${formattedTime} ${format(new Date(), 'MMMM/yyyy')}`;
      form.setValue("referenceTitle", referenceTitle);
    }
  }, [schedule.class?.name, startTime, form]);
  
  // Handle form submission with proper cleanup
  const handleFormSubmit = async (values: any) => {
    try {
      await onSubmit(values);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
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
