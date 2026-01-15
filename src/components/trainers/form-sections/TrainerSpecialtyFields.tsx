
import { useState, useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { TrainerFormValues } from "../schemas/trainerFormSchema";
import { Loader } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface TrainerSpecialtyFieldsProps {
  form: UseFormReturn<TrainerFormValues>;
  branches: { label: string; value: string }[];
  isLoadingBranches?: boolean;
}

export function TrainerSpecialtyFields({ 
  form, 
  branches = [],
  isLoadingBranches = false
}: TrainerSpecialtyFieldsProps) {
  const [specialtyOptions] = useState([
    { label: "Obedience Training", value: "Obedience Training" },
    { label: "Behavioral Correction", value: "Behavioral Correction" },
    { label: "Puppy Training", value: "Puppy Training" },
    { label: "Agility Training", value: "Agility Training" },
    { label: "Service Dog Training", value: "Service Dog Training" },
    { label: "Therapy Dog Training", value: "Therapy Dog Training" },
    { label: "Search & Rescue", value: "Search & Rescue" },
  ]);

  // Debug log to check branches data
  useEffect(() => {
    console.log("[TrainerSpecialtyFields] Branches:", branches);
    console.log("[TrainerSpecialtyFields] Current branch value:", form.getValues("branchIds"));
  }, [branches, form]);

  return (
    <>
      <FormField
        control={form.control}
        name="branchIds"
        render={({ field }) => {
          const selectedBranches = field.value || [];
          
          return (
            <FormItem>
              <FormLabel>Branches</FormLabel>
              <FormControl>
                {isLoadingBranches ? (
                  <div className="flex items-center space-x-2 h-10 px-3 py-2 border rounded-md">
                    <Loader className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading branches...</span>
                  </div>
                ) : branches.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 border border-input p-3 rounded-md">
                    {branches.map((branch) => {
                      const isChecked = selectedBranches.includes(branch.value);
                      return (
                        <div key={branch.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`branch-${branch.value}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const updatedValues = checked
                                ? [...selectedBranches, branch.value]
                                : selectedBranches.filter(id => id !== branch.value);
                              
                              form.setValue('branchIds', updatedValues, {
                                shouldValidate: true,
                                shouldDirty: true
                              });
                            }}
                          />
                          <label 
                            htmlFor={`branch-${branch.value}`}
                            className="text-sm cursor-pointer"
                          >
                            {branch.label}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground border border-input p-2 rounded">
                    No branches available. Please add branches first.
                  </div>
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />
      
      <div className="space-y-3">
        <FormLabel>Specialties</FormLabel>
        <div className="grid grid-cols-2 gap-2">
          {specialtyOptions.map((specialty) => (
            <FormField
              key={specialty.value}
              control={form.control}
              name="specialties"
              render={({ field }) => {
                const specialties = field.value || [];
                const isChecked = specialties.includes(specialty.value);
                
                return (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          const updatedValues = checked
                            ? [...specialties, specialty.value]
                            : specialties.filter(value => value !== specialty.value);
                          
                          form.setValue('specialties', updatedValues, {
                            shouldValidate: true,
                            shouldDirty: true
                          });
                        }}
                      />
                    </FormControl>
                    <span className="text-sm">{specialty.label}</span>
                  </FormItem>
                );
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
