
import { Control } from "react-hook-form";
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormDescription 
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { ClassScheduleFormValues } from "../schemas/classScheduleFormSchema";

interface RecurringClassToggleProps {
  control: Control<ClassScheduleFormValues>;
}

export function RecurringClassToggle({ control }: RecurringClassToggleProps) {
  return (
    <FormField
      control={control}
      name="isRecurring"
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel className="text-base">Recurring Class</FormLabel>
            <FormDescription>
              Enable if this is a recurring class series
            </FormDescription>
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}
