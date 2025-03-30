
import { useState } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { MultiSelect, OptionType } from "@/components/ui/multi-select";
import { UseFormReturn } from "react-hook-form";
import { TrainerFormValues } from "../schemas/trainerFormSchema";
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

  const branchIds = form.watch('branchIds') || [];
  const specialties = form.watch('specialties') || [];
  
  // Convert branch IDs to options for display
  const selectedBranchOptions = branchIds.map(id => {
    const branch = branches.find(b => b.value === id);
    return branch || { label: `Branch ${id.substring(0, 6)}...`, value: id };
  });
  
  // Convert specialties to options for display
  const selectedSpecialtyOptions = specialties.map(specialty => ({
    label: specialty,
    value: specialty
  }));

  console.log('Debug: branches', branches);
  console.log('Debug: branchIds', branchIds);
  console.log('Debug: selectedBranchOptions', selectedBranchOptions);

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
              ) : branches.length > 0 ? (
                <MultiSelect
                  options={branches}
                  value={selectedBranchOptions}
                  onChange={(selected) => {
                    const selectedIds = selected.map(item => item.value);
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
                value={selectedSpecialtyOptions}
                onChange={(selected) => {
                  const selectedSpecialties = selected.map(item => item.value);
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
