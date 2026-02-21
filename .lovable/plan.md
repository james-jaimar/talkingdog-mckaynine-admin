

# Fix: Dashboard Revenue Discrepancy (R1,490 Missing)

## Root Cause Found

The discrepancy is exactly R1,490.00 -- caused by invoice **INV-McD-2601-0055** (Jane & Richard, R1,490.00). This invoice belongs to the **Delta branch** (`invoice.branch_id = Delta`), but the client's `branch_id` is set to **Randburg**.

The Dashboard filters invoices using `inv.client?.branch_id === currentBranch?.id` (the **client's** branch), while the Financial Report filters using `invoice.branch_id` (the **invoice's** branch). Since this client is registered under Randburg but trained at Delta, their invoice gets dropped from the Dashboard but correctly appears in the Financial Report.

There is also a second invoice going the other direction: **INV-McR-2601-0012** (Simone Dias, R1,755.00) belongs to Randburg but the client is registered under Delta. This would cause the same discrepancy on the Randburg dashboard.

## The Fix

Change the branch filter in the Dashboard from `inv.client?.branch_id` to `inv.branch_id` -- matching how the Financial Report and the RPC already work. The invoice's own `branch_id` field is the authoritative record of which branch the revenue belongs to.

## Technical Details

### Files to edit:

1. **`src/components/financial/FinancialDashboardContent.tsx`** (line 38)
   - Change: `inv.client?.branch_id === currentBranch?.id`
   - To: `inv.branch_id === currentBranch?.id`
   - Update the warning log accordingly

2. **`src/pages/FinancialDashboard.tsx`** (line 42)
   - Same change -- this standalone dashboard page has the identical bug

Both files use the same pattern. The `branch_id` field is already available on the Invoice type (defined in `src/hooks/invoices/types.ts` line 56) and is returned by the `get_invoices_with_items` RPC.

No database changes needed. No other files affected.

