

# Fix Financial Dashboard Revenue Discrepancy

## The Problem

The Financial Dashboard mixes two independent data sources for its metrics cards:

- **Total Revenue**: Sourced from `useClassFinancialData` (class/booking-based calculations)
- **Collected / Pending / Overdue**: Sourced from invoice status filtering

Because these pipelines process data differently (one groups by class bookings, the other sums invoice line items by status), they can produce different totals -- even when all invoices are paid. The result is a confusing display where Total Revenue does not equal Collected + Pending + Overdue.

The Invoices page does not have this problem because it uses a single source (invoices) for all four cards.

## The Fix

Use **one consistent source** for the top-row metrics cards. Specifically, use the invoice-based `revenueMetrics` (which already calculates collected, pending, and overdue correctly) for **Total Revenue** as well. The class-based `totalRevenue` from `classFinances` will continue to be used only for the expense breakdown cards (Admin Fee, Trainer Fee, Franchise Fee, Profit), where class-level granularity is actually needed.

## Technical Details

### File: `src/components/financial/FinancialDashboardContent.tsx`

**Current code (line 155):**
```typescript
const totalRevenue = classFinancesTotalRevenue;
```

**Change:** Pass the invoice-based `revenueMetrics.totalRevenue` (course fees, excluding enrollment) to `FinancialMetricsCards` instead of the class-based total.

Specifically:
1. On line 275, change the `totalRevenue` prop passed to `FinancialMetricsCards` from the class-based `totalRevenue` to `revenueMetrics.totalRevenue`
2. Keep the class-based `totalRevenue` for `ExpenseBreakdownCards` (line 284) and `RevenueAllocationChart` (line 300) since those need class-level fee breakdowns

This is a single-line prop change. The `revenueMetrics` object already computes `totalRevenue` correctly as the sum of all non-enrollment course fee amounts from invoices (line 112), and it already correctly splits that into collected, pending, and overdue by invoice status. Using the same source for all four cards guarantees they always balance: Total = Collected + Pending + Overdue.

### Why This Is Safe

- The Invoices page already uses this same invoice-based approach and shows correct, balanced numbers (100% collection rate when all paid)
- The expense breakdown cards (Admin Fee, Trainer Fee, etc.) still use class-based data, which is correct for those calculations since fees are defined per-class
- No other components are affected

