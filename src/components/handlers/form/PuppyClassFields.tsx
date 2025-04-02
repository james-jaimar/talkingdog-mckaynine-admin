
import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { FormTextField } from "./FormTextField";
import { FormTextAreaField } from "./FormTextAreaField";
import { FormCheckboxField } from "./FormCheckboxField";
import { Separator } from "@/components/ui/separator";

interface PuppyClassFieldsProps {
  control: Control<any>;
}

export function PuppyClassFields({ control }: PuppyClassFieldsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-md font-medium mb-2">Puppy Health Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormCheckboxField
            control={control}
            name="puppyVaccinated"
            label="Puppy has been vaccinated"
          />
          
          <FormTextField
            control={control}
            name="puppyVaccinationDate"
            label="Vaccination Date"
            type="date"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormCheckboxField
            control={control}
            name="puppyMicrochipped"
            label="Puppy has been microchipped"
          />
          
          <FormTextField
            control={control}
            name="puppyMicrochipNumber"
            label="Microchip Number"
            placeholder="If applicable"
          />
        </div>
        
        <FormTextField
          control={control}
          name="puppyDewormingDate"
          label="Last Deworming Date"
          type="date"
          description="Date of most recent deworming treatment"
        />
      </div>
      
      <Separator />
      
      <div>
        <h4 className="text-md font-medium mb-2">Veterinary Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormTextField
            control={control}
            name="puppyVetName"
            label="Veterinarian Name"
            placeholder="Dr. Smith"
          />
          
          <FormTextField
            control={control}
            name="puppyVetPhone"
            label="Veterinarian Phone"
            placeholder="+1 (123) 456-7890"
          />
        </div>
        
        <FormTextField
          control={control}
          name="puppyVetAddress"
          label="Veterinary Clinic Address"
          placeholder="123 Vet Street, City"
        />
      </div>
      
      <Separator />
      
      <div>
        <h4 className="text-md font-medium mb-2">Puppy Behavior & Care</h4>
        <FormTextAreaField
          control={control}
          name="puppyDiet"
          label="Current Diet"
          placeholder="Describe your puppy's current diet and feeding schedule"
        />
        
        <FormTextAreaField
          control={control}
          name="puppyPreviousTraining"
          label="Previous Training"
          placeholder="Describe any previous training your puppy has received"
        />
        
        <FormTextAreaField
          control={control}
          name="puppyBehaviorIssues"
          label="Behavior Concerns"
          placeholder="Describe any behavior issues or concerns"
        />
        
        <FormTextAreaField
          control={control}
          name="puppyMedicalConditions"
          label="Medical Conditions"
          placeholder="Describe any medical conditions or allergies"
        />
      </div>
      
      <Separator />
      
      <div>
        <h4 className="text-md font-medium mb-2">Indemnity Agreement</h4>
        <FormCheckboxField
          control={control}
          name="indemnityAgreement"
          label="I agree to the terms of the indemnity agreement"
          description="By checking this box, you agree to the terms of the McKaynine Training Centre indemnity agreement regarding puppy training classes."
        />
      </div>
    </div>
  );
}
