import { jsPDF } from "jspdf";

// Use the JPG logo directly (already has white background, no transparency issues)
const LOGO_PATH = "/lovable-uploads/mckaynine_delta_long_2025.jpg";

/**
 * Adds a logo to the PDF document
 * Returns { ok: boolean, bottomY: number } for positioning content below
 */
export const addLogoToPdf = async (doc: jsPDF, pageWidth: number): Promise<{ ok: boolean; bottomY: number }> => {
  const logoY = 10;
  const logoHeight = 20;
  const logoWidth = 70;
  
  try {
    const xPosition = (pageWidth - logoWidth) / 2;
    
    doc.addImage(LOGO_PATH, "JPEG", xPosition, logoY, logoWidth, logoHeight);
    console.log("Logo added successfully");
    
    doc.setTextColor(0, 0, 0);
    return { ok: true, bottomY: logoY + logoHeight };
  } catch (logoError) {
    console.error("Error adding logo to PDF:", logoError);
    
    // Fall back to text title if logo fails
    doc.setFontSize(20);
    doc.text("McKaynine Training Centre", pageWidth / 2, 20, { align: 'center' });
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
