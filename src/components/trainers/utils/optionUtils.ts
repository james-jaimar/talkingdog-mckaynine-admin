
import { OptionType } from "@/components/ui/multi-select";

/**
 * Helper function to convert array of strings to array of OptionType objects
 * with enhanced validation to prevent "undefined is not iterable" errors
 */
export const specialtiesAsOptions = (specialties: string[] | null | undefined): OptionType[] => {
  try {
    // Super defensive check to ensure we have a valid array
    if (!specialties) {
      console.log("specialtiesAsOptions: received null or undefined input");
      return [];
    }
    
    if (!Array.isArray(specialties)) {
      console.error("specialtiesAsOptions: received non-array:", specialties);
      return [];
    }
    
    // Filter out any non-string values and map to OptionType
    const validSpecialties = specialties.filter(specialty => typeof specialty === 'string' && specialty.trim() !== '');
    
    const options = validSpecialties.map(specialty => ({
      label: specialty,
      value: specialty
    }));
    
    // Log for debugging
    console.log("specialtiesAsOptions result:", { 
      input: specialties, 
      validSpecialties,
      output: options 
    });
    
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
    // Defensive checks for null/undefined
    if (!branchIds) {
      console.log("branchIdsToOptions: branchIds is null or undefined");
      return [];
    }
    
    if (!branches) {
      console.log("branchIdsToOptions: branches is null or undefined");
      return [];
    }
    
    // Type checking
    if (!Array.isArray(branchIds)) {
      console.error("branchIdsToOptions: branchIds is not an array:", branchIds);
      return [];
    }
    
    if (!Array.isArray(branches)) {
      console.error("branchIdsToOptions: branches is not an array:", branches);
      return [];
    }
    
    console.log("branchIdsToOptions starting with:", {
      branchIds,
      branches,
      branchIdsLength: branchIds.length,
      branchesLength: branches.length
    });
    
    // Filter to ensure valid IDs
    const validBranchIds = branchIds.filter(id => typeof id === 'string' && id.trim() !== '');
    
    // Create valid branch objects
    const validBranches = branches.filter(b => 
      b && typeof b === 'object' && 'value' in b && 'label' in b &&
      typeof b.value === 'string' && typeof b.label === 'string'
    );
    
    // Log for debugging
    console.log("branchIdsToOptions processing:", { 
      branchIds,
      validBranchIds, 
      branches,
      validBranches,
      branchesIsArray: Array.isArray(branches)
    });
    
    if (validBranchIds.length === 0) {
      console.log("branchIdsToOptions: no valid branch IDs");
      return [];
    }
    
    if (validBranches.length === 0) {
      console.log("branchIdsToOptions: no valid branches");
      return [];
    }
    
    // Map IDs to options with fallback
    const result = validBranchIds.map(id => {
      const branch = validBranches.find(b => b.value === id);
      return branch || { 
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
