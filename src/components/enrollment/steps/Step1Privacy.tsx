import { UseFormReturn } from "react-hook-form";
import { FullEnrollmentFormValues } from "../types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PawPrint, Shield, Heart } from "lucide-react";

interface Step1PrivacyProps {
  form: UseFormReturn<FullEnrollmentFormValues>;
}

export function Step1Privacy({ form }: Step1PrivacyProps) {
  const { register, watch, setValue, formState: { errors } } = form;
  const privacyAgreed = watch("privacyPolicyAgreed");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-customer-accent/10 mb-4">
          <PawPrint className="h-10 w-10 text-customer-accent" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          Welcome to McKaynine!
        </h2>
        <p className="text-gray-500 max-w-md mx-auto">
          We're excited to have you and your furry friend join our training family. 
          Let's get you enrolled in just a few easy steps.
        </p>
      </div>

      {/* Benefits Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50 rounded-xl p-4 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <Heart className="h-6 w-6 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-sm text-emerald-900">Expert Training</h3>
          <p className="text-xs text-emerald-700">Professional trainers with years of experience</p>
        </div>
        <div className="bg-gradient-to-br from-customer-accent/5 to-customer-accent/10 border border-customer-accent/20 rounded-xl p-4 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-customer-accent/20 flex items-center justify-center mx-auto">
            <PawPrint className="h-6 w-6 text-customer-accent" />
          </div>
          <h3 className="font-semibold text-sm text-gray-900">Happy Pups</h3>
          <p className="text-xs text-gray-600">Socialization and fun for your dog</p>
        </div>
        <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 border border-violet-200/50 rounded-xl p-4 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center mx-auto">
            <Shield className="h-6 w-6 text-violet-600" />
          </div>
          <h3 className="font-semibold text-sm text-violet-900">Safe Environment</h3>
          <p className="text-xs text-violet-700">Controlled, safe training spaces</p>
        </div>
      </div>

      {/* Privacy Policy Agreement */}
      <div className="bg-gray-50 rounded-xl p-6 space-y-4 border border-gray-100">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Shield className="h-5 w-5 text-customer-accent" />
          Privacy & Consent
        </h3>
        <p className="text-sm text-gray-500">
          By proceeding with this enrollment, you acknowledge that you have read and agree to our 
          Privacy Policy. We take your privacy seriously and will only use your information to 
          provide you with the best training experience for you and your dog.
        </p>
        
        <div className="flex items-start space-x-3 pt-4">
          <Checkbox
            id="privacyPolicyAgreed"
            checked={privacyAgreed}
            onCheckedChange={(checked) => setValue("privacyPolicyAgreed", checked === true)}
            className="mt-1 data-[state=checked]:bg-customer-accent data-[state=checked]:border-customer-accent"
          />
          <div className="space-y-1">
            <Label 
              htmlFor="privacyPolicyAgreed" 
              className="text-sm font-medium cursor-pointer"
            >
              I agree to the Privacy Policy
            </Label>
            <p className="text-xs text-gray-400">
              You can view our full privacy policy on our website
            </p>
          </div>
        </div>
        
        {errors.privacyPolicyAgreed && (
          <p className="text-destructive text-sm mt-2">
            {errors.privacyPolicyAgreed.message}
          </p>
        )}
      </div>
    </div>
  );
}
