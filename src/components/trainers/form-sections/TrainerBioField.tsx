
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { TrainerFormValues } from "../schemas/trainerFormSchema";
import { useEffect } from "react";

interface TrainerBioFieldProps {
  form: UseFormReturn<TrainerFormValues>;
}

export function TrainerBioField({ form }: TrainerBioFieldProps) {
  // Ensure form control exists before rendering
  if (!form || !form.control) {
    console.error("Form or form.control is undefined in TrainerBioField");
    return null;
  }
  
  // Check bio value for debugging
  const bioValue = form.watch('bio');
  
  useEffect(() => {
    console.log("TrainerBioField - current bio value:", bioValue);
  }, [bioValue]);

  return (
    <FormField
      control={form.control}
      name="bio"
      render={({ field }) => {
        // Additional safety check inside render
        if (!field) {
          console.error("Field is undefined in TrainerBioField render");
          return null;
        }
        
        const safeValue = field.value || "";
        
        return (
          <FormItem>
            <FormLabel>Bio</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Trainer biography and experience..."
                className="min-h-24"
                {...field} 
                value={safeValue} // Ensure value is never undefined
                onChange={(e) => {
                  try {
                    field.onChange(e);
                  } catch (error) {
                    console.error("Error in bio onChange handler:", error);
                  }
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
