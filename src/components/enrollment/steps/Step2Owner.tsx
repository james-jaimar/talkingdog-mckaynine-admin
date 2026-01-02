import { UseFormReturn } from "react-hook-form";
import { FullEnrollmentFormValues } from "../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Briefcase, Stethoscope } from "lucide-react";

interface Step2OwnerProps {
  form: UseFormReturn<FullEnrollmentFormValues>;
}

export function Step2Owner({ form }: Step2OwnerProps) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
          <User className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Tell Us About You</h2>
        <p className="text-muted-foreground">Let's start with your contact details</p>
      </div>

      {/* Form Fields */}
      <div className="space-y-5 max-w-lg mx-auto">
        {/* Owner Name */}
        <div className="space-y-2">
          <Label htmlFor="ownerName" className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            Your Name *
          </Label>
          <Input
            id="ownerName"
            placeholder="Enter your full name"
            {...register("ownerName")}
            className="h-12"
          />
          {errors.ownerName && (
            <p className="text-destructive text-sm">{errors.ownerName.message}</p>
          )}
        </div>

        {/* Account Holder Name */}
        <div className="space-y-2">
          <Label htmlFor="accountHolderName" className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            Account Holder Name
            <span className="text-xs text-muted-foreground">(if different from above)</span>
          </Label>
          <Input
            id="accountHolderName"
            placeholder="Leave blank if same as your name"
            {...register("accountHolderName")}
            className="h-12"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            Email Address *
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            {...register("email")}
            className="h-12"
          />
          {errors.email && (
            <p className="text-destructive text-sm">{errors.email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            Cell Phone *
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="e.g., 082 123 4567"
            {...register("phone")}
            className="h-12"
          />
          {errors.phone && (
            <p className="text-destructive text-sm">{errors.phone.message}</p>
          )}
        </div>

        {/* Occupation */}
        <div className="space-y-2">
          <Label htmlFor="occupation" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            Occupation
            <span className="text-xs text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="occupation"
            placeholder="What do you do?"
            {...register("occupation")}
            className="h-12"
          />
        </div>

        {/* Vet Name */}
        <div className="space-y-2">
          <Label htmlFor="vetName" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
            Which Vet Do You Use? *
          </Label>
          <Input
            id="vetName"
            placeholder="Name of your vet/clinic"
            {...register("vetName")}
            className="h-12"
          />
          {errors.vetName && (
            <p className="text-destructive text-sm">{errors.vetName.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
