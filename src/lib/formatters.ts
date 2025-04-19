/**
 * Format a number as currency
 * @param value A number to format
 * @returns A formatted currency string
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
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
