/**
 * Format a number as currency in South African Rands (ZAR)
 * @param value A number to format
 * @returns A formatted currency string
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(value);
}

/**
 * Format a decimal value as a percentage
 * @param value A decimal value (e.g., 0.15)
 * @returns A formatted percentage string (e.g., "15%")
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Format a date string into a human-readable format
 * @param dateString A date string or Date object
 * @returns A formatted date string
 */
export function formatDate(dateString?: string | Date | null): string {
  if (!dateString) return "";
  
  try {
    // Handle different input types
    let date: Date;
    
    if (dateString instanceof Date) {
      date = dateString;
    } else {
      // Try to parse ISO string format
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) return "";
    
    return new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
}
