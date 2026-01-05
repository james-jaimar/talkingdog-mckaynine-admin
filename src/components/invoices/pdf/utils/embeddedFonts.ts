/**
 * Embedded font utility for jsPDF
 * Uses Roboto font which is Apache 2.0 licensed and can be freely embedded
 * This ensures PDFs render correctly regardless of the viewer's installed fonts
 */

import { jsPDF } from "jspdf";

// Fonts are bundled with the app (no network dependency) and embedded into jsPDF.
// This guarantees consistent rendering/printing for users without local fonts installed.

import robotoRegularUrl from "@/assets/fonts/Roboto-Regular.ttf?url";
import robotoBoldUrl from "@/assets/fonts/Roboto-Bold.ttf?url";

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
    // Load bundled TTF files (served by Vite) and convert to base64
    const [regular, bold] = await Promise.all([
      fetchFontAsBase64(robotoRegularUrl),
      fetchFontAsBase64(robotoBoldUrl),
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

    // Register the fonts with jsPDF (Identity-H ensures TTF embedding + Unicode mapping)
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal", "Identity-H");
    doc.addFont("Roboto-Bold.ttf", "Roboto", "bold", "Identity-H");

    // Validate the fonts are actually registered (jsPDF may silently fall back otherwise)
    const fontList = (doc as any).getFontList?.() as Record<string, string[]> | undefined;
    const hasRoboto = !!fontList?.Roboto?.includes("normal") && !!fontList?.Roboto?.includes("bold");
    if (!hasRoboto) {
      console.error("Roboto font registration failed. Font list:", fontList);
      doc.setFont("helvetica", "normal");
      return false;
    }

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
