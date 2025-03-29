
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
}

export function FormRadioGroupField({ 
  control, 
  name, 
  label, 
  options 
}: FormRadioGroupFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className="grid grid-cols-2 gap-2"
            >
              {options.map((option) => (
                <FormItem key={option.value} className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <RadioGroupItem value={option.value} />
                  </FormControl>
                  <FormLabel className="font-normal">{option.label}</FormLabel>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
