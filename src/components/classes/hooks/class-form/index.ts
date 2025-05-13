
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { classFormSchema } from "../../schemas/classFormSchema";
import { useBranches } from "./useBranches";
import { useClassSubmit } from "./useClassSubmit";
import { getDefaultValues } from "./useDefaultValues";
import { UseClassFormProps, UseClassFormResult } from "./types";

export function useClassForm({ classData, onSuccess }: UseClassFormProps): UseClassFormResult {
  const { branches, isLoadingBranches } = useBranches();
  const { onSubmit, isSubmitting } = useClassSubmit(classData, onSuccess);
  
  // Pre-populate form with class data or set defaults
  const defaultValues = getDefaultValues(classData);
  
  const form = useForm({
    resolver: zodResolver(classFormSchema),
    defaultValues,
  });

  // Make sure form gets updated if classData changes
  useEffect(() => {
    if (classData) {
      form.reset(getDefaultValues(classData));
    }
  }, [classData, form]);

  return {
    form,
    isSubmitting,
    branches,
    isLoadingBranches,
    onSubmit
  };
}
