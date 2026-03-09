
import { Control } from "react-hook-form";
import { Separator } from "@/components/ui/separator";
import { ClassScheduleFormValues } from "./schemas/classScheduleFormSchema";

import { TrainerSelection } from "./form-fields/TrainerSelection";
import { TimeSelection } from "./form-fields/TimeSelection";
import { DateSelectionCalendar } from "./form-fields/DateSelectionCalendar";
import { TermSelector } from "./form-fields/TermSelector";
import { RecurringClassToggle } from "./form-fields/RecurringClassToggle";
import { ReferenceTitleField } from "./form-fields/ReferenceTitleField";

interface ClassScheduleFormFieldsProps {
  control: Control<ClassScheduleFormValues>;
  trainers: { value: string; label: string }[];
  isLoadingTrainers: boolean;
}

export function ClassScheduleFormFields({
  control,
  trainers,
  isLoadingTrainers,
}: ClassScheduleFormFieldsProps) {
  return (
    <div className="space-y-6">
      <TrainerSelection
        control={control}
        trainers={trainers}
        isLoadingTrainers={isLoadingTrainers}
      />
      <TimeSelection control={control} />
      <DateSelectionCalendar control={control} />
      <TermSelector control={control} />
      <RecurringClassToggle control={control} />
      <Separator />
      <ReferenceTitleField control={control} />
    </div>
  );
}
