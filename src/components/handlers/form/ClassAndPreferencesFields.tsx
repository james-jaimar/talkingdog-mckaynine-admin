
import { Control } from "react-hook-form";
import { FormTextAreaField } from "./FormTextAreaField";
import { FormCheckboxField } from "./FormCheckboxField";
import { FormRadioGroupField } from "./FormRadioGroupField";

interface ClassAndPreferencesFieldsProps {
  control: Control<any>;
}

export function ClassAndPreferencesFields({ control }: ClassAndPreferencesFieldsProps) {
  const classOptions = [
    { value: "puppy", label: "PUPPY" },
    { value: "eo", label: "EO" },
    { value: "bronze_cgc", label: "BRONZE CGC" },
    { value: "silver_cgc", label: "SILVER CGC" },
    { value: "beginner", label: "BEGINNER" },
    { value: "novice", label: "NOVICE" },
    { value: "wt_a_test", label: "WT/A-TEST" },
    { value: "yoga", label: "YOGA" },
  ];

  return (
    <div className="space-y-5">
      <FormRadioGroupField 
        control={control}
        name="classEnrollment"
        label="Class Enrollment"
        options={classOptions}
        description="Select the primary class for enrollment"
      />

      <FormTextAreaField 
        control={control}
        name="comments"
        label="Comments"
        placeholder="Additional comments or special requirements"
        description="Any other information we should know"
      />

      <div className="space-y-4 pt-2">
        <h4 className="text-sm font-medium text-muted-foreground">Communication Preferences</h4>
        <FormCheckboxField 
          control={control}
          name="whatsApp"
          label="WhatsApp"
          description="Receive updates and communications via WhatsApp"
        />

        <FormCheckboxField 
          control={control}
          name="photoPermission"
          label="Photo Permission"
          description="Allow us to take and share photos of your dog"
        />
      </div>
    </div>
  );
}
