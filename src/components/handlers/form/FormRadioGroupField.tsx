
import { Control } from "react-hook-form";
import { FormTextAreaField } from "./FormTextAreaField";

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
  // Display a text area for each class option
  return (
    <div className="space-y-5">
      <h3 className="text-base font-medium">{label}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}
      
      <div className="space-y-4">
        <FormTextAreaField
          control={control}
          name={`${name}_puppy`}
          label="PUPPY"
          placeholder="Enter details here"
        />
        
        <FormTextAreaField
          control={control}
          name={`${name}_eo`}
          label="EO"
          placeholder="Enter details here"
        />
        
        <FormTextAreaField
          control={control}
          name={`${name}_cgc_bronze`}
          label="CGC BRONZE"
          placeholder="Enter details here"
        />
        
        <FormTextAreaField
          control={control}
          name={`${name}_cgc_silver`}
          label="CGC SILVER"
          placeholder="Enter details here"
        />
        
        <FormTextAreaField
          control={control}
          name={`${name}_beginner_novice`}
          label="BEGINNER/NOVICE"
          placeholder="Enter details here"
        />
        
        <FormTextAreaField
          control={control}
          name={`${name}_wt`}
          label="WT"
          placeholder="Enter details here"
        />
        
        <FormTextAreaField
          control={control}
          name={`${name}_yoga`}
          label="YOGA"
          placeholder="Enter details here"
        />
      </div>
    </div>
  );
}
