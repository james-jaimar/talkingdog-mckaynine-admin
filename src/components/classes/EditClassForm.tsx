import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClassForm } from "./hooks/useClassForm";
import { Class } from "./types/class";
import { FeeFields } from "./form-sections/FeeFields";
import { CLASS_TYPES } from "./types/class-types";
import { useEffect } from "react";
import { ClassWithSchedules } from "./hooks/types/class-with-schedules";

interface EditClassFormProps {
  // Accept either Class or ClassWithSchedules to make it more flexible
  classData: Class | ClassWithSchedules;
  currentBranchName?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EditClassForm({ classData, currentBranchName, onSuccess, onCancel }: EditClassFormProps) {
  const { form, isSubmitting, branches, isLoadingBranches, onSubmit } = useClassForm({ 
    classData, 
    onSuccess 
  });

  // Log the classData and form values to verify they are correct
  useEffect(() => {
    console.log("EditClassForm - Original class data:", classData);
    console.log("EditClassForm - Fee values in class data:", {
      course_fee: classData.course_fee,
      enrollment_fee: classData.enrollment_fee,
      mckaynine_commission_type: classData.mckaynine_commission_type,
      mckaynine_commission_value: classData.mckaynine_commission_value,
      admin_fee_type: classData.admin_fee_type,
      admin_fee_value: classData.admin_fee_value,
      trainer_fee_type: classData.trainer_fee_type,
      trainer_fee_value: classData.trainer_fee_value,
    });
    console.log("EditClassForm - Current form values:", form.getValues());
    console.log("EditClassForm - Current branch name:", currentBranchName);
  }, [classData, form, currentBranchName]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Puppy Training" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe what the class covers..." 
                  className="min-h-[100px]" 
                  {...field} 
                  value={field.value || ''} // Handle null/undefined description
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="class_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Class Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CLASS_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="branchId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Branch</FormLabel>
                <Select 
                  disabled={isLoadingBranches} 
                  onValueChange={field.onChange} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={currentBranchName || "Select branch"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.value} value={branch.value}>
                        {branch.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (minutes)</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacity</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FeeFields control={form.control} />

        <div className="flex justify-end space-x-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Update Class"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
