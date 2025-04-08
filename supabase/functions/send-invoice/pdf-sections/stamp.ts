
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
    
    // Create a graphics state for opacity using the correct method for jsPDF
    let gState;
    try {
      gState = (doc as any).GState({opacity: 0.3});
    } catch (e) {
      console.error("Error creating GState:", e);
      // Continue without opacity if GState isn't working
    }
    
    // Save current graphics state
    doc.saveGraphicsState();
    
    // Set transparency if gState was successfully created
    if (gState) {
      try {
        (doc as any).setGState(gState);
      } catch (e) {
        console.error("Error setting GState:", e);
      }
    }
    
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
