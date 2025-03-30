import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { MultiSelect, OptionType } from "@/components/ui/multi-select";
import { UseFormReturn } from "react-hook-form";
import { TrainerFormValues } from "../schemas/trainerFormSchema";
import { branchIdsToOptions, specialtiesAsOptions } from "../utils/optionUtils";
import { useState, useEffect, useCallback } from "react";

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

  // Get form values with extra safety checks
  const watchedBranchIds = form.watch('branchIds');
  const watchedSpecialties = form.watch('specialties');
  
  // Always ensure we have arrays, even if form.watch returns undefined
  const branchIds = Array.isArray(watchedBranchIds) ? watchedBranchIds : [];
  const specialties = Array.isArray(watchedSpecialties) ? watchedSpecialties : [];
  
  // Ensure branches is a valid array
  const validBranches = Array.isArray(branches) ? branches : [];
  
  // Log form state and branches for debugging
  useEffect(() => {
    console.log("TrainerSpecialtyFields state:", { 
      watchedBranchIds,
      watchedSpecialties,
      branchIds,
      specialties,
      branches: validBranches,
      branchesIsArray: Array.isArray(branches),
      branchesLength: validBranches.length
    });
  }, [watchedBranchIds, watchedSpecialties, branchIds, specialties, validBranches, branches]);

  // Create branch options
  const safeBranchOptions = branchIdsToOptions(branchIds, validBranches);
  
  // Create specialty options  
  const safeSpecialtyOptions = specialtiesAsOptions(specialties);

  // Safe branch change handler with enhanced error checking
  const handleBranchChange = useCallback((selected: OptionType[]) => {
    try {
      console.log("Branch selection changed:", selected);
      
      // Ensure selected is an array
      if (!Array.isArray(selected)) {
        console.error("handleBranchChange: selected is not an array:", selected);
        return;
      }
      
      // Map values with thorough validation
      const selectedValues = selected
        .filter(item => item && typeof item === 'object' && 'value' in item && typeof item.value === 'string')
        .map(item => item.value);
      
      console.log("Setting branchIds to:", selectedValues);
      
      // Use setValue to update the form
      if (form && typeof form.setValue === 'function') {
        form.setValue('branchIds', selectedValues, { shouldValidate: true, shouldDirty: true });
      } else {
        console.error("form.setValue is not a function:", form);
      }
    } catch (error) {
      console.error("Error in branch onChange handler:", error);
      // Keep the current value if there's an error
    }
  }, [form]);

  // Safe specialty change handler with enhanced error checking
  const handleSpecialtyChange = useCallback((selected: OptionType[]) => {
    try {
      console.log("Specialty selection changed:", selected);
      
      // Ensure selected is an array
      if (!Array.isArray(selected)) {
        console.error("handleSpecialtyChange: selected is not an array:", selected);
        return;
      }
      
      // Map values with thorough validation
      const selectedValues = selected
        .filter(item => item && typeof item === 'object' && 'value' in item && typeof item.value === 'string')
        .map(item => item.value);
      
      console.log("Setting specialties to:", selectedValues);
      
      // Use setValue to update the form
      if (form && typeof form.setValue === 'function') {
        form.setValue('specialties', selectedValues, { shouldValidate: true, shouldDirty: true });
      } else {
        console.error("form.setValue is not a function:", form);
      }
    } catch (error) {
      console.error("Error in specialty onChange handler:", error);
      // Keep the current value if there's an error
    }
  }, [form]);

  // Render with extra type safety
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
