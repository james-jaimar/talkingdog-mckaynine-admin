
import { OptionType } from "@/components/ui/multi-select";

/**
 * Helper function to convert array of strings to array of OptionType objects
 */
export const specialtiesAsOptions = (specialties: string[] | null | undefined): OptionType[] => {
  // Ensure specialties is a valid array
  if (!specialties || !Array.isArray(specialties) || specialties.length === 0) {
    console.log("specialtiesAsOptions: Empty or invalid input, returning empty array");
    return [];
  }
  
  // Map to OptionType objects
  const result = specialties
    .filter(specialty => typeof specialty === 'string' && specialty.trim() !== '')
    .map(specialty => ({
      label: specialty,
      value: specialty
    }));
    
  console.log("specialtiesAsOptions result:", result);
  return result;
};

/**
 * Helper function to convert branch IDs to OptionType objects
 */
export const branchIdsToOptions = (
  branchIds: string[] | null | undefined, 
  branches: OptionType[] | null | undefined
): OptionType[] => {
  // Ensure we have valid inputs
  if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0) {
    console.log("branchIdsToOptions: Empty or invalid branchIds, returning empty array");
    return [];
  }
  
  if (!branches || !Array.isArray(branches) || branches.length === 0) {
    console.log("branchIdsToOptions: Empty or invalid branches, returning empty array");
    return [];
  }
  
  // Find matching branches - ensure we don't return undefined values
  const result = branchIds
    .filter(id => id && typeof id === 'string')
    .map(id => {
      const matchingBranch = branches.find(branch => 
        branch && 
        typeof branch === 'object' && 
        'value' in branch && 
        branch.value === id
      );
      
      return matchingBranch || { value: id, label: `Branch ${id.substring(0, 6)}...` };
    });
  
  console.log("branchIdsToOptions result:", result);
  return result;
};

/**
 * Helper function to check if branch data is valid and has content
 */
export const hasBranchData = (branches: OptionType[] | null | undefined): boolean => {
  if (!branches) return false;
  if (!Array.isArray(branches)) return false;
  if (branches.length === 0) return false;
  
  // Check if branches have valid structure
  const validBranches = branches.filter(branch => 
    branch && 
    typeof branch === 'object' && 
    'label' in branch && 
    typeof branch.label === 'string' &&
    'value' in branch && 
    typeof branch.value === 'string'
  );
  
  const isValid = validBranches.length > 0;
  console.log("hasBranchData check:", { branches, validBranches, isValid });
  return isValid;
};
