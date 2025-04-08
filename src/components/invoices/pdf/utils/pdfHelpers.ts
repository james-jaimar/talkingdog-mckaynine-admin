
import { jsPDF } from "jspdf";

/**
 * Adds a PAID stamp to the invoice PDF
 */
export const addPaidStamp = (doc: jsPDF, pageWidth: number) => {
  // Use proper casting to access advanced jsPDF methods
  const docWithContext = doc as unknown as {
    setGlobalAlpha: (alpha: number) => void;
    saveGraphicsState: () => void;
    restoreGraphicsState: () => void;
    translate: (x: number, y: number) => void;
    rotate: (angle: number) => void;
  };
  
  // Set transparency
  docWithContext.setGlobalAlpha(0.3);
  
  // Set appearance for the "PAID" stamp
  doc.setFillColor(39, 174, 96); // Green color
  doc.setTextColor(255, 255, 255); // White text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(72);
  
  // Rotate and position the "PAID" text as a stamp
  docWithContext.saveGraphicsState();
  docWithContext.translate(pageWidth / 2, 120);
  docWithContext.rotate(-30);
  doc.text("PAID", 0, 0, { align: 'center' });
  docWithContext.restoreGraphicsState();
  
  // Reset styles for the rest of the document
  docWithContext.setGlobalAlpha(1);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
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
