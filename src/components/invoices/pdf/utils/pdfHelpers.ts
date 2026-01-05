
import { jsPDF } from "jspdf";

// Cache for compressed logo to avoid re-processing
let compressedLogoCache: string | null = null;

/**
 * Compresses the logo image to reduce PDF file size
 */
const getCompressedLogo = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (compressedLogoCache) {
      resolve(compressedLogoCache);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Create canvas at reduced size for smaller file
      const canvas = document.createElement("canvas");
      const maxWidth = 400; // Reduced from original for smaller file size
      const scale = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * scale;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Convert to JPEG with quality setting for compression
      compressedLogoCache = canvas.toDataURL("image/jpeg", 0.7);
      resolve(compressedLogoCache);
    };
    img.onerror = () => reject(new Error("Failed to load logo"));
    img.src = "/lovable-uploads/mckaynine_delta_long_2025.png";
  });
};

/**
 * Adds a logo to the PDF document
 * Returns { ok: boolean, bottomY: number } for positioning content below
 */
export const addLogoToPdf = async (doc: jsPDF, pageWidth: number): Promise<{ ok: boolean; bottomY: number }> => {
  const logoY = 10;
  const logoHeight = 20;
  const logoWidth = 70;
  
  try {
    const compressedLogo = await getCompressedLogo();
    const xPosition = (pageWidth - logoWidth) / 2;
    
    doc.addImage(compressedLogo, "JPEG", xPosition, logoY, logoWidth, logoHeight);
    console.log("Logo added successfully (compressed)");
    
    doc.setTextColor(0, 0, 0);
    return { ok: true, bottomY: logoY + logoHeight };
  } catch (logoError) {
    console.error("Error adding logo to PDF:", logoError);
    
    // Fall back to text title if logo fails
    doc.setFontSize(20);
    doc.text("McKaynine Training Centre", pageWidth / 2, 20, { align: 'center' });
    console.log("Fallback to text title");
    return { ok: false, bottomY: 25 };
  }
};

/**
 * Helper to calculate dynamic position based on content
 */
export const calculateDynamicPosition = (doc: jsPDF, basePosition: number, itemsCount: number): number => {
  const extraSpace = Math.max(0, itemsCount - 5) * 5;
  return basePosition + extraSpace;
};
