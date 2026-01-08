/**
 * Branch logo paths and utilities for dynamic logo display
 */

export const BRANCH_LOGOS = {
  delta: "/lovable-uploads/mckaynine_delta_long_2025.png",
  randburg: "/lovable-uploads/mckaynine_randburg_long_2025.jpg",
} as const;

// JPG versions for PDFs (white background, no transparency issues)
export const BRANCH_LOGOS_JPG = {
  delta: "/lovable-uploads/mckaynine_delta_long_2025.jpg",
  randburg: "/lovable-uploads/mckaynine_randburg_long_2025.jpg",
} as const;

export type BranchKey = keyof typeof BRANCH_LOGOS;

/**
 * Get the logo path for a branch based on branch name
 * @param branchName - The branch name (e.g., "McKaynine Delta", "McKaynine Randburg")
 * @param format - 'png' for web display, 'jpg' for PDFs
 * @returns The logo path
 */
export function getBranchLogo(branchName?: string | null, format: 'png' | 'jpg' = 'png'): string {
  const logos = format === 'jpg' ? BRANCH_LOGOS_JPG : BRANCH_LOGOS;
  
  if (!branchName) {
    return logos.delta; // Default to Delta
  }
  
  const lowerName = branchName.toLowerCase();
  
  if (lowerName.includes('randburg')) {
    return logos.randburg;
  }
  
  if (lowerName.includes('delta')) {
    return logos.delta;
  }
  
  // Default to Delta for unknown branches
  return logos.delta;
}

/**
 * Get the branch display name for alt text
 */
export function getBranchDisplayName(branchName?: string | null): string {
  if (!branchName) {
    return "McKaynine Delta";
  }
  
  const lowerName = branchName.toLowerCase();
  
  if (lowerName.includes('randburg')) {
    return "McKaynine Randburg";
  }
  
  if (lowerName.includes('delta')) {
    return "McKaynine Delta";
  }
  
  return "McKaynine";
}

/**
 * Detect branch key from branch name
 */
export function getBranchKey(branchName?: string | null): BranchKey {
  if (!branchName) return 'delta';
  
  const lowerName = branchName.toLowerCase();
  
  if (lowerName.includes('randburg')) return 'randburg';
  if (lowerName.includes('delta')) return 'delta';
  
  return 'delta';
}
