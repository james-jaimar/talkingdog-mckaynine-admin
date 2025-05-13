
import { Class } from "../../types/class";
import { ClassWithSchedules } from "../types/class-with-schedules";
import { ClassFormValues } from "../../schemas/classFormSchema";

// Branch option type
export type BranchOption = {
  label: string;
  value: string;
};

// Define a union type that can be either Class or ClassWithSchedules
export type ClassData = Class | ClassWithSchedules;

export interface UseClassFormProps {
  classData: ClassData | null;
  onSuccess?: () => void;
}

export interface UseClassFormResult {
  form: any; // ReturnType from useForm
  isSubmitting: boolean;
  branches: BranchOption[];
  isLoadingBranches: boolean;
  onSubmit: (values: ClassFormValues) => Promise<void>;
}
