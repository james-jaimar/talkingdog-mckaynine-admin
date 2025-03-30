
// This file is kept as a compatibility layer but doesn't contain any actual implementation
// We've switched to using the standard Select component instead

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type OptionType = {
  label: string;
  value: string;
};

export interface MultiSelectProps {
  options: OptionType[];
  value: OptionType[];
  onChange: (value: OptionType[]) => void;
  placeholder?: string;
  className?: string;
}

// This is a stub component that redirects to the standard Select
// It's kept to prevent breaking existing code while we transition
export function MultiSelect(props: MultiSelectProps) {
  console.warn("MultiSelect is deprecated. Please use Select instead.");
  return null;
}
