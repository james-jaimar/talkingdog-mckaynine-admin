
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { TrainerFormValues } from "../schemas/trainerFormSchema";
import { useEffect } from "react";

interface TrainerBioFieldProps {
  form: UseFormReturn<TrainerFormValues>;
}

export function TrainerBioField({ form }: TrainerBioFieldProps) {
  // Super defensive null checking
  if (!form) {
    console.error("TrainerBioField: form is undefined");
    return null;
  }
  
  if (!form.control) {
    console.error("TrainerBioField: form.control is undefined");
    return null;
  }
  
  // Get bio value with fallback
  const bioValue = form.watch ? form.watch('bio') : "";
  
  // Log for debugging
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
          console.error("TrainerBioField: field is undefined in render");
          return null;
        }
        
        // Ensure value is never undefined or null
        const safeValue = field.value || "";
        
        return (
          <FormItem>
            <FormLabel>Bio</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Trainer biography and experience..."
                className="min-h-24"
                {...field} 
                value={safeValue}
                onChange={(e) => {
                  try {
                    if (field.onChange && typeof field.onChange === 'function') {
                      field.onChange(e);
                    } else {
                      console.error("TrainerBioField: field.onChange is not a function");
                    }
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
