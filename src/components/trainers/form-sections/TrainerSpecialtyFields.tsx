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

  // Get form values with fallbacks
  const watchedBranchIds = form.watch('branchIds');
  const watchedSpecialties = form.watch('specialties');
  
  // Make super sure these are arrays
  const branchIds = Array.isArray(watchedBranchIds) ? watchedBranchIds : [];
  const specialties = Array.isArray(watchedSpecialties) ? watchedSpecialties : [];
  
  // Log values for debugging
  useEffect(() => {
    console.log("TrainerSpecialtyFields state:", { 
      branchIds, 
      specialties,
      branches,
      watchedBranchIds,
      watchedSpecialties
    });
  }, [branchIds, branches, specialties, watchedBranchIds, watchedSpecialties]);

  // Make sure branches is a valid array
  const validBranches = Array.isArray(branches) ? branches : [];
  
  // Convert to options using our utility functions with fallbacks
  const safeBranchOptions = branchIdsToOptions(branchIds, validBranches);
  const safeSpecialtyOptions = specialtiesAsOptions(specialties);

  useEffect(() => {
    console.log("TrainerSpecialtyFields converted options:", { 
      safeBranchOptions, 
      safeSpecialtyOptions 
    });
  }, [safeBranchOptions, safeSpecialtyOptions]);

  const handleBranchChange = (selected: OptionType[]) => {
    try {
      console.log("Branch selection changed:", selected);
      if (Array.isArray(selected)) {
        const selectedValues = selected
          .filter(item => item && typeof item === 'object' && 'value' in item)
          .map(item => item?.value)
          .filter(Boolean) as string[];
        
        console.log("Setting branchIds to:", selectedValues);
        form.setValue('branchIds', selectedValues, { shouldValidate: true, shouldDirty: true });
      } else {
        console.error("Selected branches is not an array:", selected);
        form.setValue('branchIds', [], { shouldValidate: true, shouldDirty: true });
      }
    } catch (error) {
      console.error("Error in branch onChange handler:", error);
      // Keep the current value if there's an error
    }
  };

  const handleSpecialtyChange = (selected: OptionType[]) => {
    try {
      console.log("Specialty selection changed:", selected);
      if (Array.isArray(selected)) {
        const selectedValues = selected
          .filter(item => item && typeof item === 'object' && 'value' in item)
          .map(item => item?.value)
          .filter(Boolean) as string[];
        
        console.log("Setting specialties to:", selectedValues);
        form.setValue('specialties', selectedValues, { shouldValidate: true, shouldDirty: true });
      } else {
        console.error("Selected specialties is not an array:", selected);
        form.setValue('specialties', [], { shouldValidate: true, shouldDirty: true });
      }
    } catch (error) {
      console.error("Error in specialty onChange handler:", error);
      // Keep the current value if there's an error
    }
  };

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
                options={validBranches}
                value={safeBranchOptions}
                onChange={handleBranchChange}
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
                onChange={handleSpecialtyChange}
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
