
import { useClassForm as useClassFormImplementation } from "./class-form";
import { UseClassFormProps, UseClassFormResult } from "./class-form/types";

export function useClassForm(props: UseClassFormProps): UseClassFormResult {
  return useClassFormImplementation(props);
}
