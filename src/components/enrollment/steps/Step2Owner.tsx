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
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-customer-accent/10 mb-2">
          <User className="h-8 w-8 text-customer-accent" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Tell Us About You</h2>
        <p className="text-gray-500">Let's start with your contact details</p>
      </div>

      {/* Form Fields - 2 column grid on larger screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {/* Owner Name */}
        <div className="space-y-2">
          <Label htmlFor="ownerName" className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            Your Name *
          </Label>
          <Input
            id="ownerName"
            placeholder="Enter your full name"
            {...register("ownerName")}
            className="h-12 border-gray-200 focus:border-customer-accent focus:ring-customer-accent"
          />
          {errors.ownerName && (
            <p className="text-destructive text-sm">{errors.ownerName.message}</p>
          )}
        </div>

        {/* Account Holder Name */}
        <div className="space-y-2">
          <Label htmlFor="accountHolderName" className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            Account Holder Name
            <span className="text-xs text-gray-400">(if different from above)</span>
          </Label>
          <Input
            id="accountHolderName"
            placeholder="Leave blank if same as your name"
            {...register("accountHolderName")}
            className="h-12 border-gray-200 focus:border-customer-accent focus:ring-customer-accent"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400" />
            Email Address *
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            {...register("email")}
            className="h-12 border-gray-200 focus:border-customer-accent focus:ring-customer-accent"
          />
          {errors.email && (
            <p className="text-destructive text-sm">{errors.email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-400" />
            Cell Phone *
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="e.g., 082 123 4567"
            {...register("phone")}
            className="h-12 border-gray-200 focus:border-customer-accent focus:ring-customer-accent"
          />
          {errors.phone && (
            <p className="text-destructive text-sm">{errors.phone.message}</p>
          )}
        </div>

        {/* Occupation */}
        <div className="space-y-2">
          <Label htmlFor="occupation" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-gray-400" />
            Occupation
            <span className="text-xs text-gray-400">(optional)</span>
          </Label>
          <Input
            id="occupation"
            placeholder="What do you do?"
            {...register("occupation")}
            className="h-12 border-gray-200 focus:border-customer-accent focus:ring-customer-accent"
          />
        </div>

        {/* Vet Name */}
        <div className="space-y-2">
          <Label htmlFor="vetName" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-gray-400" />
            Which Vet Do You Use? *
          </Label>
          <Input
            id="vetName"
            placeholder="Name of your vet/clinic"
            {...register("vetName")}
            className="h-12 border-gray-200 focus:border-customer-accent focus:ring-customer-accent"
          />
          {errors.vetName && (
            <p className="text-destructive text-sm">{errors.vetName.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
