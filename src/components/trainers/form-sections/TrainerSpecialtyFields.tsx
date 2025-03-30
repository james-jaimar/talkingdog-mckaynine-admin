
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { MultiSelect, OptionType } from "@/components/ui/multi-select";
import { UseFormReturn } from "react-hook-form";
import { TrainerFormValues } from "../schemas/trainerFormSchema";
import { branchIdsToOptions, specialtiesAsOptions } from "../utils/optionUtils";
import { useState } from "react";

interface TrainerSpecialtyFieldsProps {
  form: UseFormReturn<TrainerFormValues>;
  branches: OptionType[];
}

export function TrainerSpecialtyFields({ form, branches }: TrainerSpecialtyFieldsProps) {
  const [specialtyOptions] = useState<OptionType[]>([
    { label: "Obedience Training", value: "Obedience Training" },
    { label: "Behavioral Correction", value: "Behavioral Correction" },
    { label: "Puppy Training", value: "Puppy Training" },
    { label: "Agility Training", value: "Agility Training" },
    { label: "Service Dog Training", value: "Service Dog Training" },
    { label: "Therapy Dog Training", value: "Therapy Dog Training" },
    { label: "Search & Rescue", value: "Search & Rescue" },
  ]);

  // Create a safeguard for branch IDs to prevent errors during rendering
  const safeBranchOptions = branchIdsToOptions(form.watch('branchIds'), branches);
  const safeSpecialtyOptions = specialtiesAsOptions(form.watch('specialties'));

  return (
    <>
      <FormField
        control={form.control}
        name="branchIds"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Branches</FormLabel>
            <FormControl>
              <MultiSelect
                options={branches}
                value={safeBranchOptions}
                onChange={(selected) => {
                  console.log("Selected branches:", selected);
                  field.onChange(selected.map(item => item.value));
                }}
                placeholder="Select branches"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="specialties"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Specialties</FormLabel>
            <FormControl>
              <MultiSelect
                options={specialtyOptions}
                value={safeSpecialtyOptions}
                onChange={(selected) => {
                  console.log("Selected specialties:", selected);
                  field.onChange(selected.map(item => item.value));
                }}
                placeholder="Select specialties"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
