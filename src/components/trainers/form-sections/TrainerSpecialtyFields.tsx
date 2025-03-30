
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { MultiSelect, OptionType } from "@/components/ui/multi-select";
import { UseFormReturn } from "react-hook-form";
import { TrainerFormValues } from "../schemas/trainerFormSchema";
import { branchIdsToOptions, specialtiesAsOptions } from "../utils/optionUtils";
import { useState, useEffect } from "react";
import { Loader } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TrainerSpecialtyFieldsProps {
  form: UseFormReturn<TrainerFormValues>;
  branches: OptionType[];
  isLoadingBranches?: boolean;
}

export function TrainerSpecialtyFields({ 
  form, 
  branches,
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
  
  // Log state for debugging
  useEffect(() => {
    console.log("TrainerSpecialtyFields render:", { 
      branchIds,
      specialties,
      branches,
      branchesCount: branches?.length || 0,
      isLoadingBranches
    });
  }, [branchIds, specialties, branches, isLoadingBranches]);

  return (
    <>
      <FormField
        control={form.control}
        name="branchIds"
        render={() => (
          <FormItem>
            <FormLabel>Branches</FormLabel>
            <FormControl>
              {isLoadingBranches ? (
                <div className="flex items-center space-x-2 h-10 px-3 py-2 border rounded-md">
                  <Loader className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading branches...</span>
                </div>
              ) : branches && branches.length > 0 ? (
                <MultiSelect
                  options={branches}
                  value={branchIdsToOptions(branchIds, branches)}
                  onChange={(selected) => {
                    const selectedIds = selected.map(item => item.value);
                    console.log("Branch selection changed to:", selectedIds);
                    form.setValue('branchIds', selectedIds, { 
                      shouldValidate: true, 
                      shouldDirty: true 
                    });
                  }}
                  placeholder="Select branches"
                />
              ) : (
                <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
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
        render={() => (
          <FormItem>
            <FormLabel>Specialties</FormLabel>
            <FormControl>
              <MultiSelect
                options={specialtyOptions}
                value={specialtiesAsOptions(specialties)}
                onChange={(selected) => {
                  const selectedSpecialties = selected.map(item => item.value);
                  console.log("Specialty selection changed to:", selectedSpecialties);
                  form.setValue('specialties', selectedSpecialties, { 
                    shouldValidate: true, 
                    shouldDirty: true 
                  });
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
