
import { jsPDF } from "npm:jspdf@2.5.1";

/**
 * Adds a PAID stamp to the invoice PDF
 */
export function addPaidStamp(doc: jsPDF, pageWidth: number): void {
  try {
    console.log("Starting to add PAID stamp");
    
    // Set appearance for the "PAID" stamp
    doc.setFillColor(39, 174, 96); // Green color
    doc.setTextColor(255, 255, 255); // White text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(72);
    
    // Calculate position for the center of the page
    const stampX = pageWidth / 2;
    const stampY = 120;
    
    // Create a new graphics state for opacity
    const gState = new doc.GState({opacity: 0.3});
    
    // Save current graphics state
    doc.saveGraphicsState();
    
    // Set transparency using the correct opacity method for jsPDF
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
    
    console.log("PAID stamp added successfully");
  } catch (error) {
    console.error("Error adding PAID stamp:", error);
    // Continue without stamp rather than failing the entire PDF generation
  }
}
