

# Move Month Selector Inside Financial Report Tab

## Overview

The Franchise Report tab has its own month/year selector inside the component. The user wants the same pattern for the Financial Report tab - the month selector should be **inside** the ClassFinancialReport component, not at the page level.

## Current State

| Tab | Month Selector Location |
|-----|------------------------|
| Financial Report | Page level (passed as prop) |
| Classes List | Page level (no selector used) |
| Franchise Report | **Inside component** (self-managed) |
| Trainers | Page level (passed as prop) |

## Target State

| Tab | Month Selector Location |
|-----|------------------------|
| Financial Report | **Inside component** (like Franchise) |
| Classes List | Page level (unchanged) |
| Franchise Report | Inside component (unchanged) |
| Trainers | Page level (unchanged) |

---

## Implementation

### Step 1: Update ClassFinancialReport Component

**File:** `src/components/invoices/reports/ClassFinancialReport.tsx`

Add internal month/year state and MonthSelector (similar to FranchiseClassesReport):

1. **Add imports:**
   - Import `MonthSelector` from `./MonthSelector`
   - Import `startOfMonth`, `endOfMonth` from `date-fns`

2. **Add internal state:**
   ```typescript
   const currentDate = new Date();
   const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
   const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
   ```

3. **Compute dateRange internally:**
   ```typescript
   const dateRange = {
     from: startOfMonth(new Date(selectedYear, selectedMonth - 1)),
     to: endOfMonth(new Date(selectedYear, selectedMonth - 1))
   };
   
   const fromDate = dateRange.from.toISOString();
   const toDate = dateRange.to.toISOString();
   ```

4. **Add MonthSelector to header:**
   Place the MonthSelector next to the Refresh button in the CardHeader

5. **Remove dateRange prop:**
   The component becomes self-contained like FranchiseClassesReport

### Step 2: Update FinancialReports Page

**File:** `src/pages/FinancialReports.tsx`

1. **Remove page-level MonthSelector** from the header since Financial Report now has its own

2. **Remove month/year state** that was only used for Financial Report

3. **Update ClassFinancialReport usage:**
   Remove the `dateRange` prop since it's now self-managed

4. **Keep dateRange for Trainers tab:**
   The Trainers tab still needs the dateRange prop, so we may need to keep some page-level state or let Trainers also manage its own dates

---

## Technical Details

### ClassFinancialReport Changes

The component interface changes from:
```typescript
interface ClassFinancialReportProps {
  dateRange?: { from: Date; to: Date };
  onRefreshSuccess?: () => void;
}
```

To either no props (fully self-contained) or:
```typescript
interface ClassFinancialReportProps {
  onRefreshSuccess?: () => void;
}
```

### Month Label

Add a computed month label for display (like Franchise Report shows "February 2026"):
```typescript
const monthNames = ['January', 'February', ...];
const monthLabel = `${monthNames[selectedMonth - 1]} ${selectedYear}`;
```

This can be shown in the card title: "Class Financial Report - February 2026"

---

## Result

After implementation:
- Financial Report tab will have its own month/year dropdown (like Franchise Report in screenshot 3)
- Each tab that needs date filtering manages its own state
- Cleaner separation of concerns between tabs
- Consistent user experience between Financial Report and Franchise Report tabs

