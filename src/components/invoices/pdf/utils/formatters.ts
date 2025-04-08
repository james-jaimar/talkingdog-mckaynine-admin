
import { formatCurrency, formatDate } from "@/lib/formatters";

/**
 * Splits text to fit within a specified page width
 */
export const splitTextToFitPage = (doc: any, text: string, maxWidth: number) => {
  const textWidth = doc.getStringUnitWidth(text) * doc.getFontSize() / doc.internal.scaleFactor;
  if (textWidth <= maxWidth) {
    return [text];
  }
  
  // Simple split by words
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = doc.getStringUnitWidth(testLine) * doc.getFontSize() / doc.internal.scaleFactor;
    
    if (testWidth > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
};
