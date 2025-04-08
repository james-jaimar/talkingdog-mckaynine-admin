
import { jsPDF } from "npm:jspdf@2.5.1";

/**
 * Adds a PAID stamp to the invoice PDF
 */
export function addPaidStamp(doc: jsPDF, pageWidth: number): void {
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
}
