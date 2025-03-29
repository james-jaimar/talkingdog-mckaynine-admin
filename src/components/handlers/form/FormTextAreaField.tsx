
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Control } from "react-hook-form";

interface FormTextAreaFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
}

export function FormTextAreaField({ 
  control, 
  name, 
  label, 
  placeholder = "",
  description
}: FormTextAreaFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea 
              placeholder={placeholder} 
              {...field} 
              className="min-h-24 resize-none"
            />
          </FormControl>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
