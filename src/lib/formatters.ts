/**
 * Format a number as currency (ZAR by default)
 */
export const formatCurrency = (value: number, currency = 'ZAR', locale = 'en-ZA'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value).replace('R', 'R '); // Ensure space after R
};

/**
 * Format a number with commas as thousands separators
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat().format(value);
};

/**
 * Format a percentage value
 */
export const formatPercent = (value: number): string => {
  return `${value}%`;
};

/**
 * Format a date as a string
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString();
};
