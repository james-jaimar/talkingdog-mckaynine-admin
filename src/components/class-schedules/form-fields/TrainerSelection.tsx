
import { Control } from "react-hook-form";
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClassScheduleFormValues } from "../schemas/classScheduleFormSchema";

interface TrainerSelectionProps {
  control: Control<ClassScheduleFormValues>;
  trainers: { value: string; label: string; }[];
  isLoadingTrainers: boolean;
}

export function TrainerSelection({ 
  control, 
  trainers, 
  isLoadingTrainers 
}: TrainerSelectionProps) {
  return (
    <FormField
      control={control}
      name="trainerId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Trainer</FormLabel>
          <Select 
            onValueChange={field.onChange} 
            defaultValue={field.value}
            disabled={isLoadingTrainers}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a trainer" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="none">No Trainer</SelectItem>
              {trainers.map((trainer) => (
                <SelectItem key={trainer.value} value={trainer.value}>
                  {trainer.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
