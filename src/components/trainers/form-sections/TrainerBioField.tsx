
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { TrainerFormValues } from "../schemas/trainerFormSchema";

interface TrainerBioFieldProps {
  form: UseFormReturn<TrainerFormValues>;
}

export function TrainerBioField({ form }: TrainerBioFieldProps) {
  // Ensure form control exists before rendering
  if (!form || !form.control) {
    console.error("Form or form.control is undefined in TrainerBioField");
    return null;
  }

  return (
    <FormField
      control={form.control}
      name="bio"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Bio</FormLabel>
          <FormControl>
            <Textarea 
              placeholder="Trainer biography and experience..."
              className="min-h-24"
              {...field} 
              value={field.value || ""} // Ensure value is never undefined
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
