
/**
 * Utility functions for term data handling
 */

export function formatTermDisplay(termNumber: number | null, year: number | null): string {
  if (!termNumber || !year) return "No term selected";
  return `Term ${termNumber}, ${year}`;
}

export function getTermNumberFromDate(date: Date): number {
  const month = date.getMonth() + 1;
  // Terms 1: Jan-Mar, 2: Apr-Jun, 3: Jul-Sep, 4: Oct-Dec
  return Math.ceil(month / 3);
}
