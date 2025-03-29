
import { Control } from "react-hook-form";
import { FormTextField } from "./FormTextField";

interface HandlerPersonalInfoFieldsProps {
  control: Control<any>;
}

export function HandlerPersonalInfoFields({ control }: HandlerPersonalInfoFieldsProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormTextField 
          control={control}
          name="firstName"
          label="First Name"
          placeholder="John"
        />
        <FormTextField 
          control={control}
          name="lastName"
          label="Last Name"
          placeholder="Doe"
        />
      </div>

      <FormTextField 
        control={control}
        name="email"
        label="Email"
        type="email"
        placeholder="john.doe@example.com"
      />

      <FormTextField 
        control={control}
        name="phone"
        label="Phone Number"
        placeholder="+1 (123) 456-7890"
        description="We'll use this for class updates and notifications"
      />
    </div>
  );
}
