
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { MultiSelect, OptionType } from "@/components/ui/multi-select";
import { UseFormReturn } from "react-hook-form";
import { TrainerFormValues } from "../schemas/trainerFormSchema";
import { branchIdsToOptions, hasBranchData, specialtiesAsOptions } from "../utils/optionUtils";
import { useState, useEffect } from "react";
import { Loader } from "lucide-react";

interface TrainerSpecialtyFieldsProps {
  form: UseFormReturn<TrainerFormValues>;
  branches: OptionType[];
  isLoadingBranches?: boolean;
}

export function TrainerSpecialtyFields({ 
  form, 
  branches = [],
  isLoadingBranches = false
}: TrainerSpecialtyFieldsProps) {
  const [specialtyOptions] = useState<OptionType[]>([
    { label: "Obedience Training", value: "Obedience Training" },
    { label: "Behavioral Correction", value: "Behavioral Correction" },
    { label: "Puppy Training", value: "Puppy Training" },
    { label: "Agility Training", value: "Agility Training" },
    { label: "Service Dog Training", value: "Service Dog Training" },
    { label: "Therapy Dog Training", value: "Therapy Dog Training" },
    { label: "Search & Rescue", value: "Search & Rescue" },
  ]);

  // Get form values
  const branchIds = form.watch('branchIds') || [];
  const specialties = form.watch('specialties') || [];
  
  useEffect(() => {
    console.log("TrainerSpecialtyFields render with branchIds:", branchIds);
    console.log("Available branches:", branches);
    console.log("Branches loading:", isLoadingBranches);
  }, [branchIds, branches, isLoadingBranches]);

  // Convert branch IDs to options for display - ensure this never returns undefined
  const selectedBranchOptions = branchIdsToOptions(branchIds, branches);
  
  // Convert specialties to options for display - ensure this never returns undefined
  const selectedSpecialtyOptions = specialtiesAsOptions(specialties);

  return (
    <>
      <FormField
        control={form.control}
        name="branchIds"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Branches</FormLabel>
            <FormControl>
              {isLoadingBranches ? (
                <div className="flex items-center space-x-2 h-10 px-3 py-2 border rounded-md">
                  <Loader className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading branches...</span>
                </div>
              ) : hasBranchData(branches) ? (
                <MultiSelect
                  options={branches || []}
                  value={selectedBranchOptions || []}
                  onChange={(selected) => {
                    const selectedIds = selected.map(item => item.value);
                    console.log("Branch selection changed to:", selectedIds);
                    form.setValue('branchIds', selectedIds, { 
                      shouldValidate: true, 
                      shouldDirty: true 
                    });
                  }}
                  placeholder="Select branches"
                  className="border border-input"
                />
              ) : (
                <div className="text-sm text-muted-foreground border border-input p-2 rounded">
                  No branches available. Please add branches first.
                </div>
              )}
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
                value={selectedSpecialtyOptions || []}
                onChange={(selected) => {
                  const selectedSpecialties = selected.map(item => item.value);
                  console.log("Specialty selection changed to:", selectedSpecialties);
                  form.setValue('specialties', selectedSpecialties, { 
                    shouldValidate: true, 
                    shouldDirty: true 
                  });
                }}
                placeholder="Select specialties"
                className="border border-input"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
