

# Investigation: Financial Report vs Trainer Statement Discrepancy

## Summary of Findings

You've identified a real bug. The **Financial Report** and **Trainer Statement** are showing different numbers for the same class because they filter data differently:

| Report | Handlers | Course Fees | Instructor/Trainer Fee |
|--------|----------|-------------|------------------------|
| Financial Report | 7 | R10,430 | R4,172 |
| Trainer Statement | 6 | R8,940 | R3,576 |
| **Missing** | 1 | R1,490 | R596 |

## Root Cause

The missing handler is **Jane & Richard** (with dog Tally). They are registered in the **Randburg** branch but enrolled in a **Delta** class.

### The Bug Location

In `src/hooks/trainer-payments/queries/fetchTrainerData.ts`, two functions incorrectly filter by the **client's branch** instead of the **class's branch** or **invoice's branch**:

**1. `fetchAllBookings()` - Line 137:**
```typescript
// WRONG: Filters by client.branch_id
.filter(booking => !branchId || booking.clients?.branch_id === branchId)
```

**2. `fetchAllInvoiceItems()` - Line 186:**
```typescript
// WRONG: Filters by client.branch_id via invoice
? invoiceItems.filter(item => item.invoices?.client?.branch_id === branchId)
```

### Why This Matters

- **Financial Report** correctly filters by `invoice.branch_id` (the invoice is assigned to Delta where the class is)
- **Trainer Statement** incorrectly filters by `client.branch_id` (Jane & Richard are registered to Randburg)

Since cross-branch bookings are allowed (and working correctly - the invoice IS assigned to the right branch), the trainer payment data should respect the invoice's branch, not the client's.

## The Fix

### File: `src/hooks/trainer-payments/queries/fetchTrainerData.ts`

**Change 1: `fetchAllBookings()` function**

The booking filter should check if the class's branch matches, not the client's branch. However, we don't have class info directly in this query. A better approach is to:
1. Remove the branch filter from this function (let all bookings through)
2. The filtering already happens in `useTrainerPaymentData.ts` where schedules are filtered by branch

**Change 2: `fetchAllInvoiceItems()` function**

Update to filter by `invoice.branch_id` directly instead of `invoice.client.branch_id`:

```typescript
// Before (line 163-175):
invoices:invoice_id (
  ...
  client:client_id (
    branch_id
  )
)

// After - add branch_id directly:
invoices:invoice_id (
  ...
  branch_id,  // Add this field
  client:client_id (
    branch_id
  )
)

// Before (line 185-187):
const filteredItems = branchId 
  ? invoiceItems.filter(item => item.invoices?.client?.branch_id === branchId)
  : invoiceItems;

// After:
const filteredItems = branchId 
  ? invoiceItems.filter(item => item.invoices?.branch_id === branchId)
  : invoiceItems;
```

### Additional Fix in `calculateTrainerFees.ts`

Line 57 also uses the wrong branch:
```typescript
// Before:
const invoiceBranchId = item.invoices?.client?.branch_id;

// After:
const invoiceBranchId = item.invoices?.branch_id;
```

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/trainer-payments/queries/fetchTrainerData.ts` | Fix branch filtering in `fetchAllBookings()` and `fetchAllInvoiceItems()` |
| `src/hooks/trainer-payments/utils/calculateTrainerFees.ts` | Fix branch comparison to use invoice.branch_id |
| `src/hooks/trainer-payments/types.ts` | Add `branch_id` to the InvoiceItem.invoices type if needed |

## Expected Result After Fix

The Trainer Statement for Ady Hawkins should show:
- **7 handlers** (including Jane & Richard)
- **Class Total: R4,172** (matching the Financial Report)

## Verification Steps

After the fix:
1. Navigate to Financial Reports → Trainers tab
2. Select Ady Hawkins → Generate Statement
3. Verify "15h00 Puppy Class Jan Feb" shows 7 handlers
4. Verify the commission total is R4,172 (or very close, accounting for any rounding)

