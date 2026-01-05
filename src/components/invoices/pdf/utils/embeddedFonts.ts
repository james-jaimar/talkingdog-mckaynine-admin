/**
 * Embedded font utility for jsPDF
 * Uses Roboto font which is Apache 2.0 licensed and can be freely embedded
 * This ensures PDFs render correctly regardless of the viewer's installed fonts
 */

import { jsPDF } from "jspdf";

// We'll load the fonts from Google Fonts CDN and convert to base64 at runtime
// This is more efficient than bundling large base64 strings

let fontsLoaded = false;
let robotoRegular: string | null = null;
let robotoBold: string | null = null;

/**
 * Fetches a font file and converts it to base64
 */
async function fetchFontAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Loads and caches the Roboto fonts
 */
async function loadFonts(): Promise<void> {
  if (fontsLoaded) return;

  try {
    // Using Google Fonts API to get the actual TTF files
    // These are the direct TTF URLs for Roboto
    const [regular, bold] = await Promise.all([
      fetchFontAsBase64('https://fonts.gstatic.com/s/roboto/v32/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf'),
      fetchFontAsBase64('https://fonts.gstatic.com/s/roboto/v32/KFOlCnqEu92Fr1MmWUlvAx05IsDqlA.ttf')
    ]);

    if (regular && regular.length > 1000 && bold && bold.length > 1000) {
      robotoRegular = regular;
      robotoBold = bold;
      fontsLoaded = true;
      console.log("Roboto fonts loaded and cached for PDF embedding:", {
        regularLength: regular.length,
        boldLength: bold.length
      });
    } else {
      console.warn("Font data appears invalid, using fallback");
    }
  } catch (error) {
    console.error("Failed to load fonts, falling back to standard fonts:", error);
    // Don't throw - we'll fall back to standard fonts
  }
}

/**
 * Adds embedded Roboto fonts to a jsPDF document
 * Call this immediately after creating the jsPDF instance
 */
export async function addEmbeddedFonts(doc: jsPDF): Promise<boolean> {
  await loadFonts();

  if (!robotoRegular || !robotoBold) {
    console.warn("Fonts not available, using standard helvetica");
    doc.setFont("helvetica", "normal");
    return false;
  }

  try {
    // Add the font files to the virtual file system
    doc.addFileToVFS("Roboto-Regular.ttf", robotoRegular);
    doc.addFileToVFS("Roboto-Bold.ttf", robotoBold);

    // Register the fonts with jsPDF
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");

    // Set as default font
    doc.setFont("Roboto", "normal");
    
    return true;
  } catch (error) {
    console.error("Failed to add embedded fonts:", error);
    doc.setFont("helvetica", "normal");
    return false;
  }
}

/**
 * Helper to set font with fallback
 * Use this instead of doc.setFont directly
 */
export function setFont(doc: jsPDF, style: "normal" | "bold" = "normal"): void {
  try {
    // Try to use Roboto first
    doc.setFont("Roboto", style);
  } catch {
    // Fall back to helvetica if Roboto not available
    doc.setFont("helvetica", style);
  }
}
