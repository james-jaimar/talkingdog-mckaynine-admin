
import { OptionType } from "@/components/ui/multi-select";

/**
 * Helper function to convert array of strings to array of OptionType objects
 * with enhanced validation to prevent "undefined is not iterable" errors
 */
export const specialtiesAsOptions = (specialties: string[] | null | undefined): OptionType[] => {
  try {
    // Super defensive check to ensure we have a valid array
    if (!specialties) return [];
    if (!Array.isArray(specialties)) {
      console.error("specialtiesAsOptions received non-array:", specialties);
      return [];
    }
    
    // Filter out any non-string values and map to OptionType
    const options = specialties
      .filter(specialty => typeof specialty === 'string' && specialty.trim() !== '')
      .map(specialty => ({
        label: specialty,
        value: specialty
      }));
    
    // Log what we're returning for debugging
    console.log("specialtiesAsOptions converted:", { input: specialties, output: options });
    return options;
  } catch (error) {
    console.error("Error in specialtiesAsOptions:", error);
    return [];
  }
};

/**
 * Helper function to convert branch IDs to OptionType objects
 * with enhanced validation to prevent "undefined is not iterable" errors
 */
export const branchIdsToOptions = (
  branchIds: string[] | null | undefined, 
  branches: OptionType[] | null | undefined
): OptionType[] => {
  try {
    // Defensive checks for null/undefined/non-arrays
    if (!branchIds) return [];
    if (!Array.isArray(branchIds)) {
      console.error("branchIdsToOptions received non-array branchIds:", branchIds);
      return [];
    }
    
    if (!branches) return [];
    if (!Array.isArray(branches)) {
      console.error("branchIdsToOptions received non-array branches:", branches);
      return [];
    }
    
    // Enhanced filtering to ensure valid data
    const validBranchIds = branchIds.filter(id => typeof id === 'string' && id.trim() !== '');
    
    if (validBranchIds.length === 0) return [];
    
    // Log for debugging
    console.log("branchIdsToOptions processing:", { 
      validBranchIds, 
      branches,
      branchesIsArray: Array.isArray(branches)
    });
    
    // Create safe branch mapping
    const validBranches = branches.filter(b => 
      b && typeof b === 'object' && 'value' in b && 'label' in b &&
      typeof b.value === 'string' && typeof b.label === 'string'
    );
    
    // Safely map branch IDs to OptionType objects with enhanced type checking
    const result = validBranchIds.map(id => {
      const branch = validBranches.find(b => b.value === id);
      return branch || { 
        value: id, 
        label: `Branch ${id.substring(0, 6)}...` 
      };
    });
    
    // Log the result for debugging
    console.log("branchIdsToOptions result:", result);
    
    return result;
  } catch (error) {
    console.error("Error in branchIdsToOptions:", error);
    return [];
  }
};
