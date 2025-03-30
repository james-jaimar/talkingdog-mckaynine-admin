
import { OptionType } from "@/components/ui/multi-select";

// Helper function to convert array of strings to array of OptionType objects
export const specialtiesAsOptions = (specialties: string[] | null): OptionType[] => {
  if (!specialties || !Array.isArray(specialties)) return [];
  return specialties.map(specialty => ({
    label: specialty,
    value: specialty
  }));
};

// Helper function to convert branch IDs to OptionType objects
export const branchIdsToOptions = (branchIds: string[] | null, branches: OptionType[]): OptionType[] => {
  if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0) return [];
  if (!branches || branches.length === 0) return [];
  
  return branchIds.map(id => {
    const branch = branches.find(b => b.value === id);
    return branch || { value: id, label: `Branch ${id.substring(0, 8)}...` };
  }).filter(Boolean);
};
