
import { jsPDF } from "jspdf";

/**
 * Adds a logo to the PDF document
 */
export const addLogoToPdf = (doc: jsPDF, pageWidth: number) => {
  try {
    // Use the new McKaynine Delta logo
    const logoPath = "/lovable-uploads/mckaynine_delta_long_2025.png";
    
    // Set logo dimensions for proper display - optimized for new taller logo
    const imgWidth = 80;
    const imgHeight = 25;
    const xPosition = (pageWidth - imgWidth) / 2; // Center horizontally
    
    // Add the logo image with JPEG compression for smaller file size
    doc.addImage(logoPath, "JPEG", xPosition, 10, imgWidth, imgHeight, undefined, "MEDIUM");
    console.log("Logo added successfully from:", logoPath);
    
    // Reset text color to black for the rest of the document
    doc.setTextColor(0, 0, 0);
    
    return true;
  } catch (logoError) {
    console.error("Error adding logo to PDF:", logoError);
    
    // Fall back to text title if logo fails
    doc.setFontSize(20);
    doc.text("McKaynine Training Centre", pageWidth / 2, 20, { align: 'center' });
    console.log("Fallback to text title");
    return false;
  }
};

/**
 * Helper to calculate dynamic position based on content
 */
export const calculateDynamicPosition = (doc: jsPDF, basePosition: number, itemsCount: number): number => {
  // Add more space if there are many items
  const extraSpace = Math.max(0, itemsCount - 5) * 5;
  return basePosition + extraSpace;
};
