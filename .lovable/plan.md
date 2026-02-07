
# Fix Financial Dashboard Data Source Mismatch

## Problem Summary

The Financial Dashboard shows **Collected Revenue (R85,415) > Total Revenue (R67,265)** which is mathematically impossible. This indicates two different data sources with incompatible date filtering.

## Root Cause

The dashboard pulls metrics from **two different hooks with different date filters**:

| Metric | Hook | Filter | Issue |
|--------|------|--------|-------|
| Total Revenue, Fees | `useFinancialQuery` | `franchise_report_month = '2026-01'` | Only filters by FIRST MONTH of term |
| Collected/Pending/Overdue | `useInvoices` + manual filter | `issued_date` in term range | Correctly filters entire term (Jan-Mar) |

### The Bug Location

**File:** `src/hooks/financial/useFinancialQuery.ts` (lines 66-73)

```typescript
if (fromDate && toDate) {
  const fromMonth = fromDate.substring(0, 7); // BUG: Only uses first month!
  invoicesQuery = invoicesQuery.or(
    `franchise_report_month.eq.${fromMonth},...`
  );
}
```

When Term 1 spans Jan 1 - Mar 31, this only extracts `2026-01` and ignores Feb/Mar entirely.

## Solution

**Option A (Recommended): Use `issued_date` range filter for dashboard**

The Financial Dashboard should filter by `issued_date` within the term range (consistent with collected/pending metrics), not by `franchise_report_month` which is designed for monthly franchise reports.

**Option B: Generate all months in range**

Extract all YYYY-MM values between fromDate and toDate and filter using `.in()`.

## Implementation Plan

### Part 1: Create a unified filtering approach

Update `useFinancialQuery.ts` to properly handle term date ranges:

```typescript
if (fromDate && toDate) {
  // For dashboard/term filtering: use issued_date range
  // This is consistent with how collected/pending revenue is calculated
  invoicesQuery = invoicesQuery
    .gte('issued_date', fromDate)
    .lte('issued_date', toDate);
}
```

### Part 2: Add a separate parameter for monthly report mode

Add an optional `filterMode` parameter to distinguish between:
- `'term'` - Uses issued_date range (for dashboard)
- `'monthly'` - Uses franchise_report_month (for Franchise/Financial Report tabs)

```typescript
export function useFinancialQuery(
  branchId?: string, 
  fromDate?: string, 
  toDate?: string,
  filterMode: 'term' | 'monthly' = 'term'
) {
  // ... in query:
  if (fromDate && toDate) {
    if (filterMode === 'monthly') {
      const fromMonth = fromDate.substring(0, 7);
      invoicesQuery = invoicesQuery.or(
        `franchise_report_month.eq.${fromMonth},...`
      );
    } else {
      // Default: term mode uses issued_date for consistency
      invoicesQuery = invoicesQuery
        .gte('issued_date', fromDate)
        .lte('issued_date', toDate);
    }
  }
}
```

### Part 3: Update callers

**Dashboard** (`useClassFinancialData.ts`):
```typescript
useFinancialQuery(branchId, normalizedFromDate, normalizedToDate, 'term')
```

**Financial Report** (when using this hook):
```typescript
useFinancialQuery(branchId, normalizedFromDate, normalizedToDate, 'monthly')
```

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/financial/useFinancialQuery.ts` | Add `filterMode` parameter, implement both filtering strategies |
| `src/hooks/useClassFinancialData.ts` | Pass `'term'` filter mode (or rely on default) |

## Expected Results

After implementation:
- Total Revenue = R91,400 (entire Term 1)
- Collected Revenue = R90,350 (paid invoices in Term 1)
- Pending Revenue = R1,050 (sent invoices in Term 1)
- Collection Rate = 98.9% (mathematically correct)

## Verification

The following equation should always hold true:
```
Total Revenue = Collected + Pending + Overdue
```

Currently broken: R67,265 != R85,415 + R1,050 + R0
After fix: R91,400 = R90,350 + R1,050 + R0 (correct)
