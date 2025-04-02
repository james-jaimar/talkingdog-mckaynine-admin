
import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { FormTextField } from "./FormTextField";
import { FormTextAreaField } from "./FormTextAreaField";
import { FormCheckboxField } from "./FormCheckboxField";
import { Separator } from "@/components/ui/separator";
import { PuppyClassLayout } from "./PuppyClassLayout";

interface PuppyClassFieldsProps {
  control: Control<any>;
}

export function PuppyClassFields({ control }: PuppyClassFieldsProps) {
  return (
    <PuppyClassLayout>
      <div className="space-y-8">
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h4 className="text-lg font-semibold mb-4 text-mckaynine-600 border-b pb-2 border-blue-200">Puppy Health Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <FormCheckboxField
                control={control}
                name="puppyVaccinated"
                label="Puppy has been vaccinated"
                description="Puppies must have two vaccinations"
              />
              
              <FormTextField
                control={control}
                name="puppyVaccinationDate"
                label="Date of last vaccination"
                type="date"
                required={true}
              />
            </div>
            
            <div className="space-y-4">
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
          </div>
          
          <div className="mt-4">
            <FormTextField
              control={control}
              name="puppyDewormingDate"
              label="Last Deworming Date"
              type="date"
              description="Date of most recent deworming treatment"
            />
          </div>
        </div>
        
        <Separator />
        
        <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
          <h4 className="text-lg font-semibold mb-4 text-mckaynine-600 border-b pb-2 border-amber-200">Veterinary Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormTextField
              control={control}
              name="puppyVetName"
              label="Veterinarian Name"
              placeholder="Dr. Smith"
              required={true}
            />
            
            <FormTextField
              control={control}
              name="puppyVetPhone"
              label="Veterinarian Phone"
              placeholder="+1 (123) 456-7890"
              required={true}
            />
          </div>
          
          <div className="mt-4">
            <FormTextField
              control={control}
              name="puppyVetAddress"
              label="Veterinary Clinic Address"
              placeholder="123 Vet Street, City"
            />
          </div>
        </div>
        
        <Separator />
        
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <h4 className="text-lg font-semibold mb-4 text-mckaynine-600 border-b pb-2 border-green-200">Puppy Behavior & Care</h4>
          <div className="space-y-6">
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
        </div>
        
        <Separator />
        
        <div className="bg-mckaynine-50 p-6 rounded-lg border border-mckaynine-200">
          <h4 className="text-lg font-semibold mb-4 text-mckaynine-700">Indemnity Agreement</h4>
          <p className="text-sm mb-4">
            I hereby agree that I will not hold McKaynine Training Centre, its owners, or employees responsible for any injury or damage 
            caused by my dog or to my dog during training sessions. I understand that dog training involves inherent risks, and I assume 
            all responsibility for the behavior and health of my dog during and after training.
          </p>
          <FormCheckboxField
            control={control}
            name="indemnityAgreement"
            label="I agree to the terms of the indemnity agreement"
            description="By checking this box, you acknowledge that you have read and understood the above indemnity agreement."
          />
        </div>
      </div>
    </PuppyClassLayout>
  );
}
