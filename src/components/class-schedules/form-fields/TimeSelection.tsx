
import { Control } from "react-hook-form";
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ClassScheduleFormValues } from "../schemas/classScheduleFormSchema";

interface TimeSelectionProps {
  control: Control<ClassScheduleFormValues>;
}

export function TimeSelection({ control }: TimeSelectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={control}
        name="startTime"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Start Time</FormLabel>
            <FormControl>
              <Input 
                type="time" 
                {...field} 
                aria-label="Class start time"
                className="focus:ring-2 focus:ring-offset-1 focus:ring-primary"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="endTime"
        render={({ field }) => (
          <FormItem>
            <FormLabel>End Time</FormLabel>
            <FormControl>
              <Input 
                type="time" 
                {...field}
                aria-label="Class end time"
                className="focus:ring-2 focus:ring-offset-1 focus:ring-primary"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
