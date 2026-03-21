import { useMemo } from "react";
import { format, addMonths } from "date-fns";

export interface MonthOption {
  value: string; // "2026-01" format
  label: string; // "January 2026"
}

export function useMonthOptions() {
  const options = useMemo<MonthOption[]>(() => {
    const result: MonthOption[] = [];
    const now = new Date();
    // Show 6 months back and 12 months forward
    const start = addMonths(now, -2);
    for (let i = 0; i < 14; i++) {
      const d = addMonths(start, i);
      result.push({
        value: format(d, "yyyy-MM"),
        label: format(d, "MMMM yyyy"),
      });
    }
    return result;
  }, []);

  return { months: options };
}

export function formatTargetMonth(value: string | null): string {
  if (!value) return "";
  const [year, month] = value.split("-");
  const d = new Date(parseInt(year), parseInt(month) - 1);
  return format(d, "MMM yyyy");
}
