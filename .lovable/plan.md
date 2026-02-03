
# Fix: Month/Year Selector Missing in Empty State

## Problem

The Financial Report tab works correctly when data exists (like in Delta branch), but when there's no data for the selected period (like in Randburg), the month/year selector disappears. This creates a catch-22: users can't change the month to find data because the controls are hidden.

## Root Cause

In `ClassFinancialReport.tsx`, there are three render states:
1. **Loading** (lines 98-118): Shows spinner, no month selector
2. **Empty** (lines 120-143): Shows "No financial data" message, **no month selector** 
3. **Data exists** (lines 146-224): Shows full report with month selector

The empty state is missing the MonthSelector component, trapping users on a month that has no data.

## Solution

Add the MonthSelector to the empty state so users can always change the month/year, even when no data is displayed.

---

## Technical Changes

**File:** `src/components/invoices/reports/ClassFinancialReport.tsx`

### Current Empty State (lines 120-143):
```tsx
if (!classFinances || classFinances.length === 0) {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Class Financial Report</CardTitle>
        <Button ...>Refresh</Button>
      </CardHeader>
      <CardContent className="text-center">
        <p>No financial data available...</p>
      </CardContent>
    </Card>
  );
}
```

### Updated Empty State:
```tsx
if (!classFinances || classFinances.length === 0) {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Class Financial Report - {monthLabel}</CardTitle>
        <div className="flex items-center gap-2">
          <MonthSelector
            month={selectedMonth}
            year={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
          />
          <Button ...>Refresh</Button>
        </div>
      </CardHeader>
      <CardContent className="text-center">
        <p>No financial data available...</p>
      </CardContent>
    </Card>
  );
}
```

---

## Summary

| State | Before | After |
|-------|--------|-------|
| Loading | No selector | No change (acceptable during load) |
| Empty | No selector | Month/year selector shown |
| With data | Selector shown | No change |

This ensures users can always navigate between months regardless of whether data exists for the current selection.
