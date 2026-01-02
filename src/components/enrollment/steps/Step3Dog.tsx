import { UseFormReturn } from "react-hook-form";
import { FullEnrollmentFormValues } from "../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dog, Calendar, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step3DogProps {
  form: UseFormReturn<FullEnrollmentFormValues>;
}

const acquiredFromOptions = [
  "KUSA", "Breeder", "SPCA/AACL", "Rescue org", "Family/friends", 
  "Advert", "Born in home", "Stray", "Other"
];

const ageAtAcquisitionOptions = [
  "Less than 2 months", "2-4 months", "4-12 months", "Older than 1 year"
];

export function Step3Dog({ form }: Step3DogProps) {
  const { register, watch, setValue, formState: { errors } } = form;
  const gender = watch("gender");
  const spayNeuterStatus = watch("spayNeuterStatus");
  const acquiredFrom = watch("acquiredFrom");
  const ageAtAcquisition = watch("ageAtAcquisition");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-customer-accent/10 mb-2">
          <Dog className="h-8 w-8 text-customer-accent" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Your Pup's Details</h2>
        <p className="text-gray-500">Tell us about your furry friend</p>
      </div>

      {/* Form Fields - use full width with grid layout */}
      <div className="space-y-6">
        {/* Dog Name & Birth Date - 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <div className="space-y-2">
            <Label htmlFor="dogName" className="flex items-center gap-2">
              <Dog className="h-4 w-4 text-gray-400" />
              Dog's Name *
            </Label>
            <Input
              id="dogName"
              placeholder="What's your pup called?"
              {...register("dogName")}
              className="h-12 border-gray-200 focus:border-customer-accent focus:ring-customer-accent"
            />
            {errors.dogName && (
              <p className="text-destructive text-sm">{errors.dogName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              Birth Date *
            </Label>
            <Input
              id="birthDate"
              type="date"
              {...register("birthDate")}
              className="h-12 border-gray-200 focus:border-customer-accent focus:ring-customer-accent"
            />
            {errors.birthDate && (
              <p className="text-destructive text-sm">{errors.birthDate.message}</p>
            )}
          </div>
        </div>

        {/* Gender and Breed - side by side on larger screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {/* Gender Selection */}
          <div className="space-y-3">
            <Label>Gender *</Label>
            <div className="grid grid-cols-2 gap-3">
            {["Male", "Female"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setValue("gender", option as "Male" | "Female")}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2",
                  gender === option
                    ? "border-customer-accent bg-customer-accent/5 ring-2 ring-customer-accent/20"
                    : "border-gray-200 hover:border-customer-accent/50"
                )}
              >
                <span className="text-2xl">{option === "Male" ? "♂️" : "♀️"}</span>
                <span className="font-medium">{option}</span>
              </button>
            ))}
          </div>
            {errors.gender && (
              <p className="text-destructive text-sm">{errors.gender.message}</p>
            )}
          </div>

          {/* Breed */}
          <div className="space-y-3">
            <Label htmlFor="breed">Breed *</Label>
            <Input
              id="breed"
              placeholder="e.g., Golden Retriever, Mixed Breed"
              {...register("breed")}
              className="h-12 border-gray-200 focus:border-customer-accent focus:ring-customer-accent"
            />
            {errors.breed && (
              <p className="text-destructive text-sm">{errors.breed.message}</p>
            )}
          </div>
        </div>
        {/* Spay/Neuter Status - wider layout */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-gray-400" />
            Spay/Neuter Status *
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "When old enough", label: "When old enough" },
              { value: "Already done", label: "Already done" },
              { value: "Not planning", label: "Not planning to" }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue("spayNeuterStatus", option.value as any)}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium",
                  spayNeuterStatus === option.value
                    ? "border-customer-accent bg-customer-accent/5"
                    : "border-gray-200 hover:border-customer-accent/50"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          {errors.spayNeuterStatus && (
            <p className="text-destructive text-sm">{errors.spayNeuterStatus.message}</p>
          )}
        </div>

        {/* Acquired From - 3x3 grid on larger screens */}
        <div className="space-y-3">
          <Label>Where Did You Get Your Dog? *</Label>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
            {acquiredFromOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setValue("acquiredFrom", option as any)}
                className={cn(
                  "p-2 rounded-lg border-2 transition-all duration-200 text-xs sm:text-sm",
                  acquiredFrom === option
                    ? "border-customer-accent bg-customer-accent/5"
                    : "border-gray-200 hover:border-customer-accent/50"
                )}
              >
                {option}
              </button>
            ))}
          </div>
          {acquiredFrom === "Other" && (
            <Input
              placeholder="Please specify..."
              {...register("acquiredFromOther")}
              className="mt-2 border-gray-200 focus:border-customer-accent focus:ring-customer-accent"
            />
          )}
          {errors.acquiredFrom && (
            <p className="text-destructive text-sm">{errors.acquiredFrom.message}</p>
          )}
        </div>

        {/* Age at Acquisition - 4 columns on larger screens */}
        <div className="space-y-3">
          <Label>Age When You Got Them *</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ageAtAcquisitionOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setValue("ageAtAcquisition", option as any)}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all duration-200 text-sm",
                  ageAtAcquisition === option
                    ? "border-customer-accent bg-customer-accent/5"
                    : "border-gray-200 hover:border-customer-accent/50"
                )}
              >
                {option}
              </button>
            ))}
          </div>
          {errors.ageAtAcquisition && (
            <p className="text-destructive text-sm">{errors.ageAtAcquisition.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
