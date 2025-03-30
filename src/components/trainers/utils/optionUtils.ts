
import { OptionType } from "@/components/ui/multi-select";

/**
 * Helper function to convert array of strings to array of OptionType objects
 * with strong validation to prevent "undefined is not iterable" errors
 */
export const specialtiesAsOptions = (specialties: string[] | null | undefined): OptionType[] => {
  if (!specialties || !Array.isArray(specialties)) return [];
  
  // Filter out any non-string values and map to OptionType
  return specialties
    .filter(specialty => typeof specialty === 'string' && specialty.trim() !== '')
    .map(specialty => ({
      label: specialty,
      value: specialty
    }));
};

/**
 * Helper function to convert branch IDs to OptionType objects
 * with strong validation to prevent "undefined is not iterable" errors
 */
export const branchIdsToOptions = (
  branchIds: string[] | null | undefined, 
  branches: OptionType[]
): OptionType[] => {
  if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0) return [];
  if (!branches || !Array.isArray(branches) || branches.length === 0) return [];
  
  // Log for debugging
  console.log("Converting branchIds to options:", { branchIds, branches });
  
  // Safely map branch IDs to OptionType objects
  const result = branchIds
    .filter(id => typeof id === 'string' && id.trim() !== '')
    .map(id => {
      const branch = branches.find(b => b && typeof b === 'object' && 'value' in b && b.value === id);
      return branch || { value: id, label: `Branch ${id.substring(0, 8)}...` };
    });
  
  // Log the result for debugging
  console.log("Result of branchIdsToOptions:", result);
  
  return result;
};
