
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Control } from "react-hook-form";
import { z } from "zod";
import { useIsMobile } from "@/hooks/useIsMobile";

// Using the same schema types from the parent form
type FormSchema = z.infer<typeof import("./dogFormSchema").formSchema>;

interface BasicInfoTabProps {
  control: Control<FormSchema>;
}

export function BasicInfoTab({ control }: BasicInfoTabProps) {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Dog's Name</FormLabel>
            <FormControl>
              <Input {...field} className="w-full" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="breed"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Breed</FormLabel>
            <FormControl>
              <Input {...field} className="w-full" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="date_of_birth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Birth</FormLabel>
              <FormControl>
                <Input {...field} type="date" className="w-full" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="age"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Age (years)</FormLabel>
              <FormControl>
                <Input {...field} type="number" className="w-full" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="weight"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Weight (lbs)</FormLabel>
            <FormControl>
              <Input {...field} type="number" className="w-full" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>General Notes</FormLabel>
            <FormControl>
              <Textarea 
                {...field} 
                rows={isMobile ? 3 : 4}
                placeholder="General notes about the dog" 
                className="w-full"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
