
# Fix Financial Report Not Respecting report_month_override

## Problem
The **Franchise Report** correctly shows classes in their overridden month (e.g., a Jan 30 class appearing in February), but the **Financial Report** does not -- it only uses `issued_date` to filter invoices.

## Root Cause
`ClassFinancialReport` uses `useClassFinancialData`, which calls `useFinancialQuery` with `'term'` mode. This mode filters purely by `issued_date` range and completely ignores the `franchise_report_month` field on invoices.

Since the Financial Report is a **monthly** report (it has its own month/year selector), it should use `'monthly'` mode instead -- the same logic that makes the Franchise Report work correctly.

## Fix

### File: `src/hooks/useClassFinancialData.ts`

Add a `filterMode` parameter so callers can choose between `'term'` and `'monthly'` modes:

- Accept an optional `filterMode` parameter (default: `'term'` to preserve dashboard behavior)
- Pass it through to `useFinancialQuery`

### File: `src/components/invoices/reports/ClassFinancialReport.tsx`

Pass `'monthly'` as the filter mode when calling `useClassFinancialData`, since this is a month-specific report that should respect `franchise_report_month`.

## Technical Details

| Change | File | Detail |
|--------|------|--------|
| Add `filterMode` param | `useClassFinancialData.ts` | New optional 4th parameter, defaults to `'term'` |
| Pass `'monthly'` | `ClassFinancialReport.tsx` | Calls `useClassFinancialData(branchId, from, to, 'monthly')` |

This is a two-line change that aligns the Financial Report with the Franchise Report's month-override logic, while keeping the Dashboard unchanged (still using `'term'` mode).
