
import { Control } from "react-hook-form";
import { FormTextField } from "./FormTextField";
import { FormTextAreaField } from "./FormTextAreaField";

interface DogInfoFieldsProps {
  control: Control<any>;
}

export function DogInfoFields({ control }: DogInfoFieldsProps) {
  return (
    <div className="space-y-5">
      <div className="flex justify-center mb-6">
        <div className="w-24 h-24 rounded-full bg-mckaynine-100 flex items-center justify-center">
          <img 
            src="/lovable-uploads/54fafb30-fede-4d6e-a44d-f84873eb4b1d.png" 
            alt="Puppy" 
            className="w-16 h-16 object-contain" 
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormTextField 
          control={control}
          name="dogName"
          label="Dog's Name"
          placeholder="Buddy"
          required={true}
        />
        <FormTextField 
          control={control}
          name="breed"
          label="Breed"
          placeholder="Golden Retriever"
          required={true}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormTextField 
          control={control}
          name="dogDob"
          label="Date of Birth"
          type="date"
          description="Helps us tailor training to the dog's age"
          required={true}
        />
        
        <FormTextField 
          control={control}
          name="dogAge"
          label="Age (weeks)"
          type="number"
          description="Should be 10-14 weeks for most puppies"
        />
      </div>

      <FormTextAreaField 
        control={control}
        name="assessment"
        label="Initial Assessment"
        placeholder="General assessment notes"
        description="Include any initial behavioral observations or training history"
      />
    </div>
  );
}
