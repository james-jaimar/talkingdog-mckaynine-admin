
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Control } from "react-hook-form";

interface FormCheckboxFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  description?: string;
}

export function FormCheckboxField({ 
  control, 
  name, 
  label, 
  description 
}: FormCheckboxFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-3 bg-gray-50 border">
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel className="font-medium">{label}</FormLabel>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
}
