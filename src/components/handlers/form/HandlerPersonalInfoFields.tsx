
import { Control } from "react-hook-form";
import { FormTextField } from "./FormTextField";

interface HandlerPersonalInfoFieldsProps {
  control: Control<any>;
}

export function HandlerPersonalInfoFields({ control }: HandlerPersonalInfoFieldsProps) {
  return (
    <div className="space-y-5">
      <FormTextField 
        control={control}
        name="name"
        label="Handler's Name"
        placeholder="John Doe"
      />

      <FormTextField 
        control={control}
        name="email"
        label="Email Address"
        type="email"
        placeholder="john.doe@example.com"
      />

      <FormTextField 
        control={control}
        name="phone"
        label="Contact Number"
        placeholder="+1 (123) 456-7890"
        description="We'll use this for class updates and notifications"
      />
    </div>
  );
}
