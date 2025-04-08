
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
    
    // Create a new graphics state object
    const gState = new doc.GState({opacity: 0.3});
    
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
  const logoPath = "/lovable-uploads/bb90b920-3e7c-4462-a0f1-d47b855c07b7.png";
  try {
    // Set logo to 75% of page width
    const imgWidth = pageWidth * 0.75;
    // Calculate height proportionally (assuming original aspect ratio)
    const imgHeight = imgWidth * (45/160); // Maintain aspect ratio
    const xPosition = (pageWidth - imgWidth) / 2;
    
    doc.addImage(logoPath, "PNG", xPosition, 10, imgWidth, imgHeight);
    return true;
  } catch (error) {
    console.error("Error adding logo:", error);
    // If logo fails to load, add a text title instead
    doc.setFontSize(20);
    doc.text("McKaynine Training Centre", pageWidth / 2, 20, { align: 'center' });
    return false;
  }
};
