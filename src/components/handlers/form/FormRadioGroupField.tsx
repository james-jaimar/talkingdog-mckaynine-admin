
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Control } from "react-hook-form";

interface Option {
  value: string;
  label: string;
}

interface FormRadioGroupFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  options: Option[];
  description?: string;
}

export function FormRadioGroupField({ 
  control, 
  name, 
  label, 
  options,
  description
}: FormRadioGroupFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className="grid grid-cols-2 gap-3"
            >
              {options.map((option) => (
                <FormItem key={option.value} className="flex items-center space-x-2 space-y-0 rounded-md border p-3">
                  <FormControl>
                    <RadioGroupItem value={option.value} />
                  </FormControl>
                  <FormLabel className="font-normal text-sm cursor-pointer">{option.label}</FormLabel>
                </FormItem>
              ))}
            </RadioGroup>
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
