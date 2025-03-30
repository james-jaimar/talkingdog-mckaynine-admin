
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Control } from "react-hook-form";
import { z } from "zod";

// Using the same schema types from the parent form
type FormSchema = z.infer<typeof import("./dogFormSchema").formSchema>;

interface BehaviorTabProps {
  control: Control<FormSchema>;
}

export function BehaviorTab({ control }: BehaviorTabProps) {
  return (
    <FormField
      control={control}
      name="behavior_notes"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Behavior Notes</FormLabel>
          <FormControl>
            <Textarea 
              {...field} 
              rows={8}
              placeholder="Notes about the dog's behavior, training history, etc." 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
