

## Problem

The Financial Dashboard has two different data pipelines that are now inconsistent:

1. **Revenue metrics cards** (top row) — filter invoices by `term_id` → correctly shows R 3370
2. **Expense breakdown + Revenue Allocation** — use `useClassFinancialData` → `useFinancialQuery`, which filters by `issued_date` within the term's calendar date range (Apr 1 - Jun 30 for Term 2) → finds zero invoices because they were issued in March

After adding `term_id` to invoices, the financial query pipeline was not updated to use it.

## Solution

Update `useFinancialQuery` to accept an optional `termId` parameter. When provided (in term mode), filter invoices by `term_id` instead of `issued_date` range. This aligns both data pipelines.

### Files to modify

| File | Change |
|---|---|
| `src/hooks/financial/useFinancialQuery.ts` | Add `termId?: string` parameter. When `filterMode === 'term'` and `termId` is provided, filter by `.eq('term_id', termId)` instead of date range. Keep date range as fallback for invoices without `term_id`. |
| `src/hooks/useClassFinancialData.ts` | Accept and pass `termId` to `useFinancialQuery` |
| `src/components/financial/FinancialDashboardContent.tsx` | Pass `termData?.id` as `termId` to `useClassFinancialData` |
| `src/pages/FinancialDashboard.tsx` | Pass `termData?.id` as `termId` to `useClassFinancialData` |

### Key change in `useFinancialQuery`

```text
Current (term mode):
  .gte('issued_date', fromDate)
  .lte('issued_date', toDate)

New (term mode with termId):
  .eq('term_id', termId)
  
Fallback (term mode without termId):
  .gte('issued_date', fromDate)  // backward compat
  .lte('issued_date', toDate)
```

This is a small, surgical change that aligns the expense/fee calculations with the already-working revenue metrics.

