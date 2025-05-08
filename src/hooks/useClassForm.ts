
// This file is kept for backwards compatibility
// It re-exports the hook from its new location in the components directory
import { useClassForm as useClassFormComponent } from "@/components/classes/hooks/useClassForm";

export function useClassForm(classData: any) {
  return useClassFormComponent({ classData });
}
