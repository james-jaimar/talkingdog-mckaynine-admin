
import { Control } from "react-hook-form";
import { Separator } from "@/components/ui/separator";
import { ClassScheduleFormValues } from "./schemas/classScheduleFormSchema";
import { useState, useEffect } from "react";

// Import refactored components
import { TrainerSelection } from "./form-fields/TrainerSelection";
import { TimeSelection } from "./form-fields/TimeSelection";
import { DateSelectionCalendar } from "./form-fields/DateSelectionCalendar";
import { MultiTermOptions } from "./form-fields/MultiTermOptions";
import { RecurringClassToggle } from "./form-fields/RecurringClassToggle";
import { ReferenceTitleField } from "./form-fields/ReferenceTitleField";

interface ClassScheduleFormFieldsProps {
  control: Control<ClassScheduleFormValues>;
  trainers: { value: string; label: string; }[];
  isLoadingTrainers: boolean;
}

export function ClassScheduleFormFields({ 
  control, 
  trainers, 
  isLoadingTrainers 
}: ClassScheduleFormFieldsProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  
  // Watch for changes to selectedDates field
  useEffect(() => {
    const subscription = control._formValues.selectedDates || [];
    setSelectedDates(subscription);
    
    return () => {
      // Clean up function
    };
  }, [control._formValues.selectedDates]);

  return (
    <div className="space-y-6">
      {/* Trainer Selection */}
      <TrainerSelection 
        control={control} 
        trainers={trainers} 
        isLoadingTrainers={isLoadingTrainers} 
      />

      {/* Time Selection */}
      <TimeSelection control={control} />

      {/* Date Selection Calendar */}
      <DateSelectionCalendar control={control} />

      {/* Multi-Term Support and Options */}
      <MultiTermOptions 
        control={control} 
        selectedDates={selectedDates} 
      />

      {/* Recurring Class */}
      <RecurringClassToggle control={control} />

      <Separator />

      {/* Reference Title */}
      <ReferenceTitleField control={control} />
    </div>
  );
}
