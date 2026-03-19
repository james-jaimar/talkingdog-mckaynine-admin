

## Fix: Household Invoice Rebalancing Missing `term_id`

### Problem

When a household member is added to a class, `rebalanceHouseholdInvoices` creates a new invoice but **never sets `term_id`**. This causes:

1. **Invoices invisible on the Invoices page** — the page defaults to "Current Term" filter, which matches on `term_id`. Null `term_id` invoices are filtered out.
2. **Missing from financial reports** — term-based dashboards also filter by `term_id`.

Current Domoney data confirms this: invoices INV-McD-2603-0022, 0023, 0024 all have `term_id: NULL`.

The `addHandlerToClass` function already has `termId` available (from `fetchScheduleId`) but doesn't pass it to the rebalance function.

### Fix

**File: `src/components/classes/handlers/hooks/add-handler-modal/rebalanceHouseholdInvoices.ts`**

1. Add `termId?: string | null` to the `RebalanceParams` interface
2. Include `term_id: params.termId || null` in the new invoice INSERT (line 221-236)

**File: `src/components/classes/handlers/hooks/add-handler-modal/addHandlerToClass.ts`**

3. Pass `termId` (already available at line 49) into the `rebalanceHouseholdInvoices` call (around line 155-167) as a new property

### Data cleanup

4. Fix the 3 existing Domoney invoices by setting their `term_id` to the correct term (Term 2, since they're for classes starting in the new term). This is a one-time SQL update.

### Files changed
- `rebalanceHouseholdInvoices.ts` — accept and use `termId`
- `addHandlerToClass.ts` — pass `termId` to rebalance call
- One-time DB fix for existing null `term_id` invoices

