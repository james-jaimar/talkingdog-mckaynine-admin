
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
  return (
    <div className="space-y-5">
      <h3 className="text-base font-medium">{label}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}
      
      <div className="space-y-4">
        <FormTextAreaField
          control={control}
          name="PUPPY"
          label="PUPPY"
          placeholder="Enter details here"
        />
        
        <FormTextAreaField
          control={control}
          name="EO"
          label="EO"
          placeholder="Enter details here"
        />
        
        <FormTextAreaField
          control={control}
          name="BRONZE_CGC"
          label="BRONZE CGC"
          placeholder="Enter details here"
        />
        
        <FormTextAreaField
          control={control}
          name="SILVER_CGC"
          label="SILVER CGC"
          placeholder="Enter details here"
        />
        
        <FormTextAreaField
          control={control}
          name="BEGINNER_NOVICE"
          label="BEGINNER/NOVICE"
          placeholder="Enter details here"
        />
        
        <FormTextAreaField
          control={control}
          name="WT"
          label="WT"
          placeholder="Enter details here"
        />
        
        <FormTextAreaField
          control={control}
          name="YOGA"
          label="YOGA"
          placeholder="Enter details here"
        />

        <FormTextAreaField
          control={control}
          name="COMMENTS"
          label="COMMENTS"
          placeholder="Additional comments"
        />
      </div>
    </div>
  );
}
