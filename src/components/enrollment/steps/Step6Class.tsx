import { UseFormReturn } from "react-hook-form";
import { FullEnrollmentFormValues } from "../types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardList, MapPin, Megaphone, Check, MessageCircle, Camera, Pen } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step6ClassProps {
  form: UseFormReturn<FullEnrollmentFormValues>;
  branches: Array<{ id: string; name: string }>;
}

const classTypes = [
  { value: "Puppy", label: "Puppy", icon: "🐕" },
  { value: "Elementary", label: "Elementary", icon: "📚" },
  { value: "Obedience", label: "Obedience", icon: "🎓" },
  { value: "CGC Bronze", label: "CGC Bronze", icon: "🥉" },
  { value: "Other", label: "Other", icon: "✨" },
];

const heardFromOptions = [
  { id: "google" as const, label: "Google" },
  { id: "vet" as const, label: "My Vet" },
  { id: "friends" as const, label: "Friends/Family" },
  { id: "breeder" as const, label: "Breeder/Shelter" },
  { id: "beenBefore" as const, label: "Been Before" },
];

const permissionOptions = [
  { value: "yes", label: "Yes", color: "green" },
  { value: "no", label: "No", color: "red" },
  { value: "unsure", label: "Unsure", color: "yellow" },
];

const acknowledgements = [
  { 
    id: "onleadSocializingAcknowledged", 
    text: "I understand that on-lead socialising is not permitted" 
  },
  { 
    id: "equipmentSupervisionAcknowledged", 
    text: "I'll make sure my dog (or minors) don't go onto training equipment without supervision" 
  },
  { 
    id: "trainingEquipmentAcknowledged", 
    text: "I've made sure my pup/dog has the correct training equipment" 
  },
  { 
    id: "treatsAcknowledged", 
    text: "I'll bring (lots of) small, soft training treats" 
  },
  { 
    id: "wasteDisposalAcknowledged", 
    text: "I'll bring bags for any waste disposal" 
  },
];

export function Step6Class({ form, branches }: Step6ClassProps) {
  const { watch, setValue, register, formState: { errors } } = form;
  const classType = watch("classType");
  const branchId = watch("branchId");
  const heardFrom = watch("heardFrom");
  const whatsappPermission = watch("whatsappPermission");
  const photoPermission = watch("photoPermission");
  const termsAgreed = watch("termsAgreed");

  const toggleHeardFrom = (id: keyof typeof heardFrom) => {
    setValue(`heardFrom.${id}`, !heardFrom?.[id]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-customer-accent/10 mb-2">
          <ClipboardList className="h-8 w-8 text-customer-accent" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Almost There!</h2>
        <p className="text-gray-500">Select your class and complete the final steps</p>
      </div>

      <div className="space-y-8 max-w-xl mx-auto">
        {/* Class Type */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Which Class Are You Enrolling For? *</Label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {classTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setValue("classType", type.value as any)}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-1",
                  classType === type.value
                    ? "border-customer-accent bg-customer-accent/10"
                    : "border-gray-200 hover:border-customer-accent/50"
                )}
              >
                <span className="text-xl">{type.icon}</span>
                <span className="text-xs font-medium">{type.label}</span>
              </button>
            ))}
          </div>
          {classType === "Other" && (
            <Input
              placeholder="Please specify..."
              {...register("classTypeOther")}
              className="mt-2 border-gray-200 focus:border-customer-accent focus:ring-customer-accent"
            />
          )}
          {errors.classType && (
            <p className="text-destructive text-sm">{errors.classType.message}</p>
          )}
        </div>

        {/* Branch Selection */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Which Branch? *
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {branches.map((branch) => (
              <button
                key={branch.id}
                type="button"
                onClick={() => setValue("branchId", branch.id)}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium",
                  branchId === branch.id
                    ? "border-customer-accent bg-customer-accent/10"
                    : "border-gray-200 hover:border-customer-accent/50"
                )}
              >
                {branch.name}
              </button>
            ))}
          </div>
          {errors.branchId && (
            <p className="text-destructive text-sm">{errors.branchId.message}</p>
          )}
        </div>

        {/* How Did You Hear About Us */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            How Did You Hear About Us?
          </Label>
          <div className="flex flex-wrap gap-2">
            {heardFromOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => toggleHeardFrom(option.id)}
                className={cn(
                  "px-4 py-2 rounded-full border-2 transition-all duration-200 text-sm font-medium",
                  heardFrom?.[option.id]
                    ? "border-customer-accent bg-customer-accent/10"
                    : "border-gray-200 hover:border-customer-accent/50"
                )}
              >
                {heardFrom?.[option.id] && <Check className="h-3 w-3 inline mr-1" />}
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* WhatsApp Permission */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
          <div className="flex items-start gap-3">
            <MessageCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
            <div className="flex-1">
              <Label className="font-semibold">WhatsApp Group Permission</Label>
              <p className="text-sm text-gray-500">
                May we add you to a class WhatsApp group for urgent notifications?
              </p>
            </div>
          </div>
          <div className="flex gap-2 pl-8">
            {permissionOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue("whatsappPermission", option.value as any)}
                className={cn(
                  "px-4 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium flex-1",
                  whatsappPermission === option.value
                    ? option.color === "green"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : option.color === "red"
                      ? "border-rose-500 bg-rose-50 text-rose-700"
                      : "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-gray-200 hover:border-customer-accent/50"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Photo Permission */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
          <div className="flex items-start gap-3">
            <Camera className="h-5 w-5 text-sky-500 mt-0.5" />
            <div className="flex-1">
              <Label className="font-semibold">Photo Permission</Label>
              <p className="text-sm text-gray-500">
                May we post graduation/class photos on our social media?
              </p>
            </div>
          </div>
          <div className="flex gap-2 pl-8">
            {permissionOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue("photoPermission", option.value as any)}
                className={cn(
                  "px-4 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium flex-1",
                  photoPermission === option.value
                    ? option.color === "green"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : option.color === "red"
                      ? "border-rose-500 bg-rose-50 text-rose-700"
                      : "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-gray-200 hover:border-customer-accent/50"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Acknowledgements Checklist */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Checklist</Label>
          <div className="space-y-2">
            {acknowledgements.map((ack) => {
              const isChecked = watch(ack.id as any);
              return (
                <div
                  key={ack.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-all",
                    isChecked
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-gray-200"
                  )}
                >
                  <Checkbox
                    id={ack.id}
                    checked={isChecked}
                    onCheckedChange={(checked) => setValue(ack.id as any, checked === true)}
                    className="mt-0.5 data-[state=checked]:bg-customer-accent data-[state=checked]:border-customer-accent"
                  />
                  <Label htmlFor={ack.id} className="text-sm cursor-pointer flex-1">
                    {ack.text}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Terms & Signature */}
        <div className="bg-customer-accent/5 rounded-xl p-5 space-y-4 border border-customer-accent/20">
          <div className="flex items-start gap-3">
            <Checkbox
              id="termsAgreed"
              checked={termsAgreed}
              onCheckedChange={(checked) => setValue("termsAgreed", checked === true)}
              className="mt-0.5 data-[state=checked]:bg-customer-accent data-[state=checked]:border-customer-accent"
            />
            <Label htmlFor="termsAgreed" className="text-sm cursor-pointer">
              By signing below, I affirm that I voluntarily agree to the McKaynine Terms & Conditions 
              and acknowledge that all information provided is accurate.
            </Label>
          </div>
          {errors.termsAgreed && (
            <p className="text-destructive text-sm">{errors.termsAgreed.message}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="signatureName" className="flex items-center gap-2">
                <Pen className="h-4 w-4" />
                Your Name *
              </Label>
              <Input
                id="signatureName"
                placeholder="Type your full name"
                {...register("signatureName")}
                className="border-gray-200 focus:border-customer-accent focus:ring-customer-accent"
              />
              {errors.signatureName && (
                <p className="text-destructive text-sm">{errors.signatureName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="signatureDate">Date *</Label>
              <Input
                id="signatureDate"
                type="date"
                {...register("signatureDate")}
                className="border-gray-200 focus:border-customer-accent focus:ring-customer-accent"
              />
              {errors.signatureDate && (
                <p className="text-destructive text-sm">{errors.signatureDate.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
