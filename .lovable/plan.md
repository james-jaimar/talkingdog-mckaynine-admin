

## Fix: Household Rebalanced Invoice Missing `franchise_report_month`

### Problem

The `rebalanceHouseholdInvoices` function creates a new invoice without setting `franchise_report_month`. The standard invoice creation path (`createInvoiceUtils.ts`) auto-calculates this from `issued_date`, but the rebalance function bypasses that utility and does a raw insert.

This causes the "Unallocated Invoices Found" warning for Arianna's invoice (INV-McD-2603-0027).

### Fix

**File: `src/components/classes/handlers/hooks/add-handler-modal/rebalanceHouseholdInvoices.ts`**

Two changes:

1. **Fetch `franchise_report_month` from the existing invoice** (line ~70 select query) — add it to the select fields so we can copy it to the new invoice.

2. **Set `franchise_report_month` on the new invoice insert** (line ~222-237) — use the existing invoice's value if available, otherwise auto-calculate from `issued_date` (same logic as `createInvoiceUtils`):
   ```typescript
   const autoReportMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
   franchise_report_month: existingInvoice.franchise_report_month || autoReportMonth,
   ```

### Files changed
- `rebalanceHouseholdInvoices.ts` — fetch and propagate `franchise_report_month`

