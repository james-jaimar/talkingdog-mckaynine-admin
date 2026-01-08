import { jsPDF } from "jspdf";
import { getBranchLogo, getBranchDisplayName } from "@/lib/branchLogo";

/**
 * Adds a logo to the PDF document
 * Returns { ok: boolean, bottomY: number } for positioning content below
 * @param doc - The jsPDF document instance
 * @param pageWidth - The page width for centering
 * @param branchName - Optional branch name to determine logo (defaults to Delta)
 */
export const addLogoToPdf = async (doc: jsPDF, pageWidth: number, branchName?: string): Promise<{ ok: boolean; bottomY: number }> => {
  const logoY = 10;
  const logoHeight = 20;
  const logoWidth = 70;
  const logoPath = getBranchLogo(branchName, 'jpg');
  const displayName = getBranchDisplayName(branchName);
  
  try {
    const xPosition = (pageWidth - logoWidth) / 2;
    
    doc.addImage(logoPath, "JPEG", xPosition, logoY, logoWidth, logoHeight);
    console.log("Logo added successfully");
    
    doc.setTextColor(0, 0, 0);
    return { ok: true, bottomY: logoY + logoHeight };
  } catch (logoError) {
    console.error("Error adding logo to PDF:", logoError);
    
    // Fall back to text title if logo fails
    doc.setFontSize(20);
    doc.text(displayName, pageWidth / 2, 20, { align: 'center' });
    console.log("Fallback to text title");
    return { ok: false, bottomY: 25 };
  }
};

/**
 * Helper to calculate dynamic position based on content
 */
export const calculateDynamicPosition = (doc: jsPDF, basePosition: number, itemsCount: number): number => {
  const extraSpace = Math.max(0, itemsCount - 5) * 5;
  return basePosition + extraSpace;
};
