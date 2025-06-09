
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";
import { Class } from "../types/class";
import { classFormSchema, ClassFormValues } from "../schemas/classFormSchema";
import { ClassWithSchedules } from "./types/class-with-schedules";
import { createDefaultFormValues } from "./utils/form-defaults";
import { useBranchOptions } from "./utils/branch-fetcher";
import { useClassSubmission } from "./utils/class-submission";
import { showClassErrorToast } from "./utils/toast-actions";

// Define a union type that can be either Class or ClassWithSchedules
type ClassData = Class | ClassWithSchedules;

interface UseClassFormProps {
  classData: ClassData | null;
  onSuccess?: () => void;
}

export function useClassForm({ classData, onSuccess }: UseClassFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { branches, isLoadingBranches } = useBranchOptions();
  const { submitClass } = useClassSubmission();
  
  // Initialize form with default values
  const defaultValues = createDefaultFormValues(classData);
  console.log("DEBUG: useClassForm defaultValues:", defaultValues);
  
  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues,
  });

  // Update form when classData changes
  useEffect(() => {
    if (classData) {
      const updateValues = createDefaultFormValues(classData);
      console.log("DEBUG: useClassForm effect updateValues:", updateValues);
      form.reset(updateValues);
    }
  }, [classData, form]);
  
  const onSubmit = async (values: ClassFormValues) => {
    console.log("DEBUG: useClassForm onSubmit called with values:", values);
    setIsSubmitting(true);
    
    try {
      await submitClass(values, classData, onSuccess);
    } catch (error) {
      console.error("DEBUG: Error in useClassForm onSubmit:", error);
      showClassErrorToast(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return {
    form,
    isSubmitting,
    branches,
    isLoadingBranches,
    onSubmit
  };
}
