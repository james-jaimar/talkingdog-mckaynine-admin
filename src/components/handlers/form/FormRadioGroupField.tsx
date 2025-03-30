
import { Control } from "react-hook-form";
import { FormTextField } from "./FormTextField";

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
  options, // We'll keep this parameter for future reference
}: FormRadioGroupFieldProps) {
  // Converted to use a text field instead of radio buttons
  return (
    <div className="space-y-3">
      <FormTextField
        control={control}
        name={name}
        label={label}
        description={description}
        placeholder="Enter details here"
      />
    </div>
  );
}
