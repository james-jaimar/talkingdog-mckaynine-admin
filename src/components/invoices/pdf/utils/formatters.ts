
import { formatCurrency, formatDate } from "@/lib/formatters";

/**
 * Splits text to fit within a specified page width
 */
export const splitTextToFitPage = (doc: any, text: string, maxWidth: number) => {
  return doc.splitTextToSize(text, maxWidth);
};

// Export the formatters to be used elsewhere
export { formatCurrency, formatDate };
