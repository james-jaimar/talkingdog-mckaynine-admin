
import { Control } from "react-hook-form";
import { FormField } from "@/components/ui/form";
import { FormTextField } from "./FormTextField";
import { FormCheckboxField } from "./FormCheckboxField";
import { FormTextAreaField } from "./FormTextAreaField";

interface ClassAndPreferencesFieldsProps {
  control: Control<any>;
}

export function ClassAndPreferencesFields({ control }: ClassAndPreferencesFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormTextField
          control={control}
          name="classEnrollment"
          label="Class Enrollment"
          placeholder="Class name or enrollment details"
        />
        
        <FormTextField
          control={control}
          name="puppyClass"
          label="Puppy Class"
          placeholder="Puppy class details"
        />
        
        <FormTextField
          control={control}
          name="eoClass"
          label="EO Class"
          placeholder="EO class details"
        />
        
        <FormTextField
          control={control}
          name="bronzeCgcClass"
          label="Bronze CGC Class"
          placeholder="Bronze CGC class details"
        />
        
        <FormTextField
          control={control}
          name="silverCgcClass"
          label="Silver CGC Class"
          placeholder="Silver CGC class details"
        />
        
        <FormTextField
          control={control}
          name="beginnerNoviceClass"
          label="Beginner/Novice Class"
          placeholder="Beginner/Novice class details"
        />
        
        <FormTextField
          control={control}
          name="wtClass"
          label="WT Class"
          placeholder="WT class details"
        />
        
        <FormTextField
          control={control}
          name="yogaClass"
          label="Yoga Class"
          placeholder="Yoga class details"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormCheckboxField
          control={control}
          name="whatsApp"
          label="WhatsApp Communication"
        />
        
        <FormCheckboxField
          control={control}
          name="photoPermission"
          label="Photo Permission"
        />
      </div>
      
      <FormTextAreaField
        control={control}
        name="comments"
        label="Additional Comments"
        placeholder="Any additional notes or comments..."
      />
    </div>
  );
}
