

# Fix: Duncan Miller Invoice Mess — Root Cause Analysis & Plan

## What Happened

When Ady added Duncan Miller (dog: Darcy) to "14h00 Beginner Obedience", the system detected that Duncan is a **household member** of Dean Nolte (via the `handler_households` table). Dean Nolte already had a draft/sent invoice (`INV-McD-2603-0035`) for Bronze CGC (dog: Diggory, R1,680).

The household discount logic kicked in and added Darcy's course fee to **Dean Nolte's invoice** with a 25% multi-dog discount (R1,327.50 instead of R1,770).

### Three problems resulted:

**1. Duplicate ghost item on Dean's invoice**
The `addToExistingInvoice` function was called and inserted an item, but it appears there was a double execution — there are **two** items for "Darcy Beginner Obedience" on Dean's invoice:
- Ghost item (no `booking_id`): R1,327.50 — created at 12:00:25
- Real item (with `booking_id`): R1,327.50 — created at 12:01:29

This inflated the invoice total from the correct R3,007.50 to R4,335.00.

**2. Duncan's handler detail page shows inflated amount**
The `useClientInvoices` hook (used in HandlerInvoices) correctly finds Dean's invoice via the `invoice_additional_recipients` table. However, it **recalculates the total from items** (lines 94-97), completely ignoring any invoice-level discounts. So the displayed total is wrong.

**3. "Not showing on invoices page"**
Duncan's item is on Dean Nolte's invoice, which is allocated to April (`franchise_report_month = '2026-04'`). If Ady has the month filter set to "Current Month" (March), it won't appear. The invoice IS in the system — just under Dean's name in April.

## Fix Plan

### Step 1: Data cleanup — Remove the ghost invoice item

Delete the duplicate item with no `booking_id` from Dean Nolte's invoice, and recalculate the invoice total to the correct R3,007.50.

```sql
-- Delete ghost item
DELETE FROM invoice_items WHERE id = 'f7fe1e9f-951f-41ba-8472-cdef87167bb5';

-- Fix invoice total: 1680 (Dean) + 1327.50 (Duncan discounted) = 3007.50
UPDATE invoices SET subtotal = 3007.50, total = 3007.50 WHERE id = '4e2f6889-5e22-4296-9033-015ecbe1e13f';
```

### Step 2: Fix `useClientInvoices` total recalculation

**File:** `src/hooks/invoices/queries/useClientInvoices.ts`

Remove lines 94-104 that recalculate `subtotal`, `tax_amount`, and `total` from items. The invoice record already has the correct totals from the database (including discounts). The current code overwrites these with naive item sums, which is wrong whenever there's a discount.

Replace with a simple items-array normalization without overwriting totals.

### Step 3: Fix the race condition in `addToExistingInvoice`

**File:** `src/components/classes/handlers/hooks/add-handler-modal/addToExistingInvoice.ts`

The ghost item suggests that when `addToExistingInvoice` inserts items, it can sometimes insert items without the `booking_id` (the booking doesn't exist yet at that point? Or a double-click). Looking at the flow more carefully:

In `addHandlerToClass.ts`, bookings are created BEFORE `addToExistingInvoice` is called (line 136 before line 196), so `bookingIds` should be populated. The ghost item's timestamp (12:00:25) is BEFORE the booking creation (12:01:28), which means either:
- There was a first failed attempt (double-click) that inserted the item but failed to complete
- Or there's a race condition

Add a guard to prevent double-submission more robustly — the current `isProcessing` check is client-side only and doesn't prevent browser retries.

### Step 4: Also fix Lesley Holm's invoice (INV-McD-2603-0037)

This invoice has a single item with no `booking_id` for "Elementary Obedience for Gunner" at R680. This might be intentional (custom invoice) or another ghost. Need to verify with Ady, but it's only 1 item so it's not duplicated.

## Summary of Changes

1. **Data fix**: Delete ghost item, correct Dean Nolte's invoice total
2. **Code fix in `useClientInvoices.ts`**: Stop recalculating totals from items — use DB totals
3. **Code fix in `addHandlerToClass.ts`**: Add database-level duplicate prevention (check if item already exists for this booking before inserting)

