
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
    console.log("branchIdsToOptions: No valid branchIds provided:", branchIds);
    return [];
  }
  
  if (!branches || !Array.isArray(branches) || branches.length === 0) {
    console.warn("branchIdsToOptions: No branches provided");
    return [];
  }
  
  // Log for debugging
  console.log("branchIdsToOptions processing:", { 
    branchIdsInput: branchIds, 
    branchesInput: branches,
    branchesCount: branches.length
  });
  
  try {
    // Find matching branches or create placeholder options
    const result = branchIds
      .filter(id => id && typeof id === 'string')
      .map(id => {
        // Find matching branch
        const matchingBranch = branches.find(branch => branch && branch.value === id);
        
        // Return matching branch or fallback
        return matchingBranch || { 
          value: id, 
          label: `Branch ${id.substring(0, 6)}...` 
        };
      });
    
    console.log("branchIdsToOptions result:", result);
    return result;
  } catch (error) {
    console.error("Error in branchIdsToOptions:", error);
    return [];
  }
};
