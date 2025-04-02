
import { Control } from "react-hook-form";
import { FormTextField } from "./FormTextField";

interface HandlerPersonalInfoFieldsProps {
  control: Control<any>;
}

export function HandlerPersonalInfoFields({ control }: HandlerPersonalInfoFieldsProps) {
  return (
    <div className="space-y-5">
      <div className="flex justify-center mb-6">
        <div className="w-24 h-24 rounded-full bg-mckaynine-100 flex items-center justify-center">
          <img 
            src="/lovable-uploads/10dc7b2d-7c92-4408-8a71-edaf248918a0.png" 
            alt="Pet owner" 
            className="w-16 h-16 object-contain"
          />
        </div>
      </div>
      
      <FormTextField 
        control={control}
        name="name"
        label="Handler's Name"
        placeholder="John Doe"
        required={true}
      />

      <FormTextField 
        control={control}
        name="email"
        label="Email Address"
        type="email"
        placeholder="john.doe@example.com"
        required={true}
      />

      <FormTextField 
        control={control}
        name="phone"
        label="Contact Number"
        placeholder="+1 (123) 456-7890"
        description="We'll use this for class updates and notifications"
        required={true}
      />
    </div>
  );
}
