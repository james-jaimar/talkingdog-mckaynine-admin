
import { Control } from "react-hook-form";
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormDescription, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ClassScheduleFormValues } from "../schemas/classScheduleFormSchema";

interface ReferenceTitleFieldProps {
  control: Control<ClassScheduleFormValues>;
}

export function ReferenceTitleField({ control }: ReferenceTitleFieldProps) {
  return (
    <FormField
      control={control}
      name="referenceTitle"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Reference Title</FormLabel>
          <FormDescription>
            A title to help identify this class schedule
          </FormDescription>
          <FormControl>
            <Input 
              {...field} 
              placeholder="Enter a descriptive title"
              className="focus:ring-2 focus:ring-offset-1 focus:ring-primary"
              aria-label="Schedule reference title"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
