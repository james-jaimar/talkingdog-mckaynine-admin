import { UseFormReturn } from "react-hook-form";
import { FullEnrollmentFormValues } from "../types";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step4HomeProps {
  form: UseFormReturn<FullEnrollmentFormValues>;
}

const petOptions = [
  { id: "dogs" as const, label: "Dog/s", icon: "🐕" },
  { id: "cats" as const, label: "Cat/s", icon: "🐱" },
  { id: "birds" as const, label: "Bird/s", icon: "🐦" },
  { id: "livestock" as const, label: "Livestock", icon: "🐄" },
  { id: "none" as const, label: "None", icon: "—" },
];

const childrenOptions = [
  { value: "Babies/toddlers", label: "Babies/Toddlers", icon: "👶" },
  { value: "Children", label: "Children", icon: "👧" },
  { value: "Teenagers", label: "Teenagers", icon: "🧑" },
  { value: "None", label: "None", icon: "—" },
];

const socialCategories = [
  { key: "dogs" as const, label: "Dogs", icon: "🐕" },
  { key: "animals" as const, label: "Other Animals", icon: "🐾" },
  { key: "people" as const, label: "People", icon: "👥" },
];

const socialRatings = ["Great", "OK", "Not good"] as const;

export function Step4Home({ form }: Step4HomeProps) {
  const { watch, setValue, formState: { errors } } = form;
  const otherPets = watch("otherPets");
  const childrenAtHome = watch("childrenAtHome");
  const socialBehavior = watch("socialBehavior");

  const togglePet = (petId: keyof typeof otherPets) => {
    if (petId === "none") {
      // If selecting "None", clear all other pets
      setValue("otherPets", { dogs: false, cats: false, birds: false, livestock: false, none: true });
    } else {
      // If selecting any pet, clear "None" and toggle the pet
      setValue(`otherPets.none`, false);
      setValue(`otherPets.${petId}`, !otherPets?.[petId]);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-customer-accent/10 mb-2">
          <Home className="h-8 w-8 text-customer-accent" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Home & Social Life</h2>
        <p className="text-gray-500">Help us understand your pup's environment</p>
      </div>

      <div className="space-y-6 lg:space-y-8">
        {/* Other Pets */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Other Pets at Home</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {petOptions.map((pet) => (
              <button
                key={pet.id}
                type="button"
                onClick={() => togglePet(pet.id)}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2",
                  otherPets?.[pet.id]
                    ? "border-customer-accent bg-customer-accent/10"
                    : "border-gray-200 hover:border-customer-accent/50"
                )}
              >
                <span className="text-2xl">{pet.icon}</span>
                <span className="text-sm font-medium">{pet.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Children at Home */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Children at Home *</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {childrenOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue("childrenAtHome", option.value as any)}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2",
                  childrenAtHome === option.value
                    ? "border-customer-accent bg-customer-accent/10"
                    : "border-gray-200 hover:border-customer-accent/50"
                )}
              >
                <span className="text-2xl">{option.icon}</span>
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
          {errors.childrenAtHome && (
            <p className="text-destructive text-sm">{errors.childrenAtHome.message}</p>
          )}
        </div>

        {/* Social Behavior */}
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-base font-semibold">Social Behavior *</Label>
            <p className="text-sm text-gray-500">
              How does your puppy/dog get along with...
            </p>
          </div>

          <div className="space-y-4">
            {socialCategories.map((category) => (
              <div key={category.key} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{category.icon}</span>
                  <span className="font-medium">{category.label}</span>
                </div>
                <div className="flex gap-2">
                  {socialRatings.map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setValue(`socialBehavior.${category.key}`, rating)}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium",
                        socialBehavior?.[category.key] === rating
                          ? rating === "Great"
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : rating === "OK"
                            ? "border-amber-500 bg-amber-50 text-amber-700"
                            : "border-rose-500 bg-rose-50 text-rose-700"
                          : "border-gray-200 hover:border-customer-accent/50"
                      )}
                    >
                      {rating === "Great" && "😊 "}{rating === "OK" && "😐 "}{rating === "Not good" && "😟 "}
                      {rating}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social Behavior Details */}
        <div className="space-y-2">
          <Label htmlFor="socialBehaviorDetails">
            Additional Details
            <span className="text-gray-400 text-xs ml-2">(optional)</span>
          </Label>
          <Textarea
            id="socialBehaviorDetails"
            placeholder="Any specific behaviors or situations we should know about?"
            {...form.register("socialBehaviorDetails")}
            className="min-h-[100px] border-gray-200 focus:border-customer-accent focus:ring-customer-accent"
          />
        </div>
      </div>
    </div>
  );
}
