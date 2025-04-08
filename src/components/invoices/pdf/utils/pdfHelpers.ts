
import { jsPDF } from "jspdf";

/**
 * Adds a logo to the PDF document
 */
export const addLogoToPdf = (doc: jsPDF, pageWidth: number) => {
  try {
    // Use the McKaynine logo with paws on both sides
    const logoPath = "/lovable-uploads/bb90b920-3e7c-4462-a0f1-d47b855c07b7.png";
    
    // Set logo dimensions for proper display
    const imgWidth = 170;
    const imgHeight = 55;
    const xPosition = (pageWidth - imgWidth) / 2; // Center horizontally
    
    // Add the logo image
    doc.addImage(logoPath, "PNG", xPosition, 10, imgWidth, imgHeight);
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
