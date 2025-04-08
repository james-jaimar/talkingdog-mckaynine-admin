
import { jsPDF } from "jspdf";

/**
 * Adds a PAID stamp to the invoice PDF
 */
export const addPaidStamp = (doc: jsPDF, pageWidth: number) => {
  try {
    console.log("Adding PAID stamp to client-side PDF");
    
    // Set appearance for the "PAID" stamp
    doc.setFillColor(39, 174, 96); // Green color
    doc.setTextColor(255, 255, 255); // White text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(72);
    
    // Calculate position for the center of the page
    const stampX = pageWidth / 2;
    const stampY = 120;
    
    // Create graphics state for opacity - Fix: don't use 'new' keyword
    const gState = doc.GState({opacity: 0.3});
    
    // Save current graphics state
    doc.saveGraphicsState();
    
    // Set transparency using the proper method for jsPDF
    doc.setGState(gState);
    
    // Add rotated "PAID" text as a stamp
    doc.text("PAID", stampX, stampY, { 
      align: 'center',
      angle: -30
    });
    
    // Restore graphics state to reset opacity
    doc.restoreGraphicsState();
    
    // Reset styles for the rest of the document
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    
    console.log("PAID stamp added successfully to client PDF");
  } catch (error) {
    console.error("Error adding PAID stamp:", error);
    // Continue without stamp rather than failing the entire PDF generation
  }
};

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

