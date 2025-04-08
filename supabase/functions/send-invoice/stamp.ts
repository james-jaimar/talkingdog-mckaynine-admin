
// This file is kept for compatibility but the functionality is disabled
// as it was causing issues with PDF generation

import { jsPDF } from "npm:jspdf@2.5.1";

/**
 * Stub function that doesn't add a PAID stamp - functionality removed as requested
 */
export function addPaidStamp(doc: jsPDF, pageWidth: number): void {
  // Stamp functionality removed as requested by user
  console.log("PAID stamp functionality has been disabled");
}
