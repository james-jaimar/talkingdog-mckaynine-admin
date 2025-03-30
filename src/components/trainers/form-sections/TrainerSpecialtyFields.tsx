
import { useState } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { TrainerFormValues } from "../schemas/trainerFormSchema";
import { Loader } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  // For branch selection
  return (
    <>
      <FormField
        control={form.control}
        name="branchIds"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Branch</FormLabel>
            <FormControl>
              {isLoadingBranches ? (
                <div className="flex items-center space-x-2 h-10 px-3 py-2 border rounded-md">
                  <Loader className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading branches...</span>
                </div>
              ) : branches.length > 0 ? (
                <Select 
                  onValueChange={(value) => {
                    form.setValue('branchIds', [value], { 
                      shouldValidate: true, 
                      shouldDirty: true 
                    });
                  }}
                  value={field.value && field.value.length > 0 ? field.value[0] : undefined}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.value} value={branch.value}>
                        {branch.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
      
      <div className="space-y-3">
        <FormLabel>Specialties</FormLabel>
        <div className="grid grid-cols-2 gap-2">
          {specialtyOptions.map((specialty) => (
            <FormField
              key={specialty.value}
              control={form.control}
              name="specialties"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value?.includes(specialty.value)}
                      onCheckedChange={(checked) => {
                        const currentValues = field.value || [];
                        const updatedValues = checked
                          ? [...currentValues, specialty.value]
                          : currentValues.filter(value => value !== specialty.value);
                        
                        form.setValue('specialties', updatedValues, {
                          shouldValidate: true,
                          shouldDirty: true
                        });
                      }}
                    />
                  </FormControl>
                  <span className="text-sm">{specialty.label}</span>
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    </>
  );
}
