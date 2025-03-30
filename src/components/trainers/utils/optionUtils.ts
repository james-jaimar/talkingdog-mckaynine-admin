
import { OptionType } from "@/components/ui/multi-select";

/**
 * Helper function to convert array of strings to array of OptionType objects
 */
export const specialtiesAsOptions = (specialties: string[] | null | undefined): OptionType[] => {
  // Ensure specialties is a valid array
  if (!specialties || !Array.isArray(specialties) || specialties.length === 0) {
    return [];
  }
  
  // Map to OptionType objects
  return specialties
    .filter(specialty => typeof specialty === 'string' && specialty.trim() !== '')
    .map(specialty => ({
      label: specialty,
      value: specialty
    }));
};

/**
 * Helper function to convert branch IDs to OptionType objects
 */
export const branchIdsToOptions = (
  branchIds: string[] | null | undefined, 
  branches: OptionType[]
): OptionType[] => {
  // Ensure we have valid inputs
  if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0) {
    return [];
  }
  
  if (!branches || !Array.isArray(branches) || branches.length === 0) {
    return [];
  }
  
  // Find matching branches
  const result = branchIds
    .filter(id => id && typeof id === 'string')
    .map(id => {
      const matchingBranch = branches.find(branch => branch && branch.value === id);
      return matchingBranch || { value: id, label: `Branch ${id.substring(0, 6)}...` };
    });
  
  return result;
};

/**
 * Helper function to check if branch data is valid and has content
 */
export const hasBranchData = (branches: OptionType[] | null | undefined): boolean => {
  return Boolean(branches && Array.isArray(branches) && branches.length > 0);
};
