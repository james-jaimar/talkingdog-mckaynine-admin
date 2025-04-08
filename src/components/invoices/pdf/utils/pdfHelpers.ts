
import { jsPDF } from "jspdf";

/**
 * Adds a logo to the PDF document
 */
export const addLogoToPdf = (doc: jsPDF, pageWidth: number) => {
  try {
    // Use the McKaynine logo
    const logoPath = "/lovable-uploads/bb90b920-3e7c-4462-a0f1-d47b855c07b7.png";
    
    // Set logo dimensions - 75% of page width
    const imgWidth = pageWidth * 0.75; // 75% of page width
    const imgHeight = 45; // Adjusted height 
    const xPosition = (pageWidth - imgWidth) / 2; // Center horizontally
    
    // Add the logo image - use an absolute path for better reliability
    doc.addImage(logoPath, "PNG", xPosition, 10, imgWidth, imgHeight);
    console.log("Logo added successfully from:", logoPath);
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
 * Helper to calculate dynamic start position based on content
 */
export const calculateDynamicPosition = (doc: jsPDF, basePosition: number, itemsCount: number): number => {
  // Add more space if there are many items
  const extraSpace = Math.max(0, itemsCount - 5) * 5;
  return basePosition + extraSpace;
};
