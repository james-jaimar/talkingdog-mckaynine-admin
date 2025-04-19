
/**
 * Format a number as currency in South African Rands (ZAR)
 * @param value A number to format
 * @returns A formatted currency string
 */
export function formatCurrency(value: number): string {
  // Use the South African locale for proper formatting
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    currencyDisplay: 'symbol',
    // Ensure we get the "R" symbol instead of "ZAR"
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Format a decimal value as a percentage
 * @param value A decimal value (e.g., 0.15 for 15%)
 * @returns A formatted percentage string (e.g., "15.0%")
 */
export function formatPercentage(value: number): string {
  if (value === undefined || value === null) return "0.0%";
  
  // Make sure we're working with a decimal between 0-1
  // If value is already in percentage form (e.g., 15 for 15%)
  // convert it to decimal form (e.g., 0.15)
  const normalizedValue = value > 1 ? value / 100 : value;
  
  return new Intl.NumberFormat('en-ZA', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(normalizedValue);
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
    
    return new Intl.DateTimeFormat('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
}
