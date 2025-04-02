
import { Control } from "react-hook-form";
import { FormTextField } from "./FormTextField";
import { FormCheckboxField } from "./FormCheckboxField";
import { FormTextAreaField } from "./FormTextAreaField";
import { Separator } from "@/components/ui/separator";

interface ClassAndPreferencesFieldsProps {
  control: Control<any>;
}

export function ClassAndPreferencesFields({ control }: ClassAndPreferencesFieldsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-semibold mb-4 text-mckaynine-600 border-b pb-2">Class Enrollment</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormTextField
            control={control}
            name="classEnrollment"
            label="General Class Enrollment"
            placeholder="Class name or enrollment details"
          />
          
          <FormTextField
            control={control}
            name="puppyClass"
            label="Puppy Class"
            placeholder="Puppy class details"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
      </div>

      <Separator />

      <div>
        <h4 className="text-lg font-semibold mb-4 text-mckaynine-600 border-b pb-2">Communication Preferences</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormCheckboxField
            control={control}
            name="whatsApp"
            label="I consent to WhatsApp communication"
          />
          
          <FormCheckboxField
            control={control}
            name="photoPermission"
            label="I consent to photos being taken of my dog for marketing purposes"
          />
        </div>
      </div>
      
      <Separator />
      
      <FormTextAreaField
        control={control}
        name="comments"
        label="Additional Comments or Special Requests"
        placeholder="Any additional notes or special requests..."
      />
    </div>
  );
}
