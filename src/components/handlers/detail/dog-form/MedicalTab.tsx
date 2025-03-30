
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Control } from "react-hook-form";
import { z } from "zod";

// Using the same schema types from the parent form
type FormSchema = z.infer<typeof import("./dogFormSchema").formSchema>;

interface MedicalTabProps {
  control: Control<FormSchema>;
}

export function MedicalTab({ control }: MedicalTabProps) {
  return (
    <FormField
      control={control}
      name="medical_notes"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Medical Notes</FormLabel>
          <FormControl>
            <Textarea 
              {...field} 
              rows={8}
              placeholder="Medical history, allergies, medications, etc." 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
