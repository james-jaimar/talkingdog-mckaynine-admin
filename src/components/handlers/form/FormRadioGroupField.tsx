
import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface FormRadioGroupFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  description?: string;
  options: { label: string; value: string }[];
}

export function FormRadioGroupField({ 
  control, 
  name, 
  label, 
  description,
  options, 
}: FormRadioGroupFieldProps) {
  return (
    <div className="space-y-5">
      <h3 className="text-base font-medium">{label}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}
      
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>{label}</FormLabel>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className="flex flex-col space-y-1"
            >
              {options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${name}-${option.value}`} />
                  <Label htmlFor={`${name}-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </FormItem>
        )}
      />
    </div>
  );
}
