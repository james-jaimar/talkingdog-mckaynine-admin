
# Replace Date Range Picker with Month Selector on Financial Reports

## Overview

Replace the current date range picker on the Financial Reports page with a simple month/year dropdown selector, matching the Franchise Report tab's interface. This makes it easier to quickly select a specific month rather than picking two dates.

## Current Behavior

- The Financial Reports page uses a `DateRangePicker` that requires selecting two dates via calendar
- Users must click, navigate through calendars, and select start/end dates

## New Behavior

- Two simple dropdowns: Month (January-December) and Year
- Single click to open dropdown, select value
- Much faster for monthly reporting workflows

---

## Implementation

### File: `src/pages/FinancialReports.tsx`

#### Step 1: Update Imports

Replace `DateRangePicker` import with `MonthSelector`:

```typescript
// Remove this:
import { DateRangePicker } from "@/components/dashboard/financial/DateRangePicker";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

// Add this:
import { MonthSelector } from "@/components/invoices/reports/MonthSelector";
import { startOfMonth, endOfMonth } from "date-fns";
```

#### Step 2: Update State Management

Replace the date range state with month/year state:

```typescript
// Remove existing dateRange state (lines 25-28)
// Replace with:
const currentDate = new Date();
const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // 1-12
const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

// Compute date range from month/year selection
const dateRange = {
  from: startOfMonth(new Date(selectedYear, selectedMonth - 1)),
  to: endOfMonth(new Date(selectedYear, selectedMonth - 1))
};
```

#### Step 3: Update Term Effect

Simplify the term change effect to update month/year instead of date range:

```typescript
useEffect(() => {
  if (termDateRange) {
    console.log("FinancialReports: Term date range changed, updating month/year");
    const termStart = new Date(termDateRange.startDate);
    setSelectedMonth(termStart.getMonth() + 1);
    setSelectedYear(termStart.getFullYear());
  }
}, [termDateRange]);
```

#### Step 4: Replace DateRangePicker in JSX

Replace the `DateRangePicker` component (lines 98-101) with `MonthSelector`:

```tsx
<MonthSelector
  month={selectedMonth}
  year={selectedYear}
  onMonthChange={setSelectedMonth}
  onYearChange={setSelectedYear}
/>
```

#### Step 5: Remove unused handler

Remove the `handleDateRangeChange` function (lines 77-82) as it's no longer needed.

---

## Result

| Before | After |
|--------|-------|
| Calendar popup requiring two date selections | Two dropdown selectors for month and year |
| Complex interaction | Single-click selection |
| Matches different pattern than Franchise tab | Consistent with Franchise Report tab |

The computed `dateRange` will automatically update when month or year changes, triggering the existing data refresh logic without any changes needed to `ClassFinancialReport` or other components.
