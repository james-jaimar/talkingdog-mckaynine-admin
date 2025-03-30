
import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { type FormValues } from "./handlerFormSchema";

interface NotesFieldProps {
  control: Control<FormValues>;
}

export function NotesField({ control }: NotesFieldProps) {
  return (
    <FormField
      control={control}
      name="notes"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Notes</FormLabel>
          <FormControl>
            <Textarea 
              {...field} 
              rows={4}
              placeholder="Additional information about the handler" 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
