
import { Control } from "react-hook-form";
import { FormTextField } from "./FormTextField";
import { FormTextAreaField } from "./FormTextAreaField";

interface DogInfoFieldsProps {
  control: Control<any>;
}

export function DogInfoFields({ control }: DogInfoFieldsProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormTextField 
          control={control}
          name="dogName"
          label="Dog's Name"
          placeholder="Buddy"
        />
        <FormTextField 
          control={control}
          name="breed"
          label="Breed"
          placeholder="Golden Retriever"
        />
      </div>

      <FormTextField 
        control={control}
        name="dogDob"
        label="Date of Birth"
        type="date"
        description="Optional - helps us tailor training to the dog's age"
      />

      <FormTextAreaField 
        control={control}
        name="assessment"
        label="Assessment"
        placeholder="General assessment notes"
        description="Include any initial behavioral observations or training history"
      />
    </div>
  );
}
