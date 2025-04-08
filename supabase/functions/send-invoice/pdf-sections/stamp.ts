
import { jsPDF } from "npm:jspdf@2.5.1";

/**
 * Adds a PAID stamp to the invoice PDF
 */
export function addPaidStamp(doc: jsPDF, pageWidth: number): void {
  // Set appearance for the "PAID" stamp
  doc.setFillColor(39, 174, 96); // Green color
  doc.setTextColor(255, 255, 255); // White text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(72);
  
  // Calculate position for the center of the page
  const stampX = pageWidth / 2;
  const stampY = 120;
  
  // Save current graphics state
  doc.saveGraphicsState();
  
  // Set transparency using the standard opacity method
  // This is the correct method supported by jsPDF
  doc.setGState(new (doc as any).GState({ opacity: 0.3 }));
  
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
}
