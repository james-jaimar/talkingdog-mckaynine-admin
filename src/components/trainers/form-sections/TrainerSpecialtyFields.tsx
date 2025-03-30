
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { MultiSelect, OptionType } from "@/components/ui/multi-select";
import { UseFormReturn } from "react-hook-form";
import { TrainerFormValues } from "../schemas/trainerFormSchema";
import { branchIdsToOptions, specialtiesAsOptions } from "../utils/optionUtils";
import { useState, useEffect } from "react";

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

  // Create safe versions of the current form values
  const branchIds = form.watch('branchIds') || [];
  const specialties = form.watch('specialties') || [];
  
  // Log values for debugging
  useEffect(() => {
    console.log("Current branchIds:", branchIds);
    console.log("Available branches:", branches);
    console.log("Current specialties:", specialties);
  }, [branchIds, branches, specialties]);

  // Create a safeguard for branch IDs to prevent errors during rendering
  const safeBranchOptions = branchIdsToOptions(branchIds, branches || []);
  const safeSpecialtyOptions = specialtiesAsOptions(specialties);

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
                options={Array.isArray(branches) ? branches : []}
                value={safeBranchOptions}
                onChange={(selected) => {
                  console.log("Selected branches:", selected);
                  if (Array.isArray(selected)) {
                    const selectedValues = selected.map(item => item?.value).filter(Boolean);
                    field.onChange(selectedValues);
                  } else {
                    console.error("Selected branches is not an array:", selected);
                    field.onChange([]);
                  }
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
                  if (Array.isArray(selected)) {
                    const selectedValues = selected.map(item => item?.value).filter(Boolean);
                    field.onChange(selectedValues);
                  } else {
                    console.error("Selected specialties is not an array:", selected);
                    field.onChange([]);
                  }
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
