
# Fix Starter Kit Allocation Integration

## Problem Summary

When handlers are enrolled in puppy classes with an enrollment fee, starter kits are not being allocated from inventory. Investigation of invoice INV-McD-2602-0020 (Alex Martin / Toast) revealed two bugs in the invoice creation flow.

## Root Causes

### Bug 1: `item_type` Field Not Saved to Database

**Location:** `src/lib/invoices/createInvoiceUtils.ts` (lines 139-146)

When invoice items are inserted, the mapping omits the `item_type` field:

```typescript
// Current code - MISSING item_type
const itemsWithInvoiceId = calculatedData.items.map((item: any) => ({
  invoice_id: invoice.id,
  description: item.description,
  quantity: item.quantity,
  unit_price: item.unit_price,
  amount: item.quantity * item.unit_price,
  booking_id: item.booking_id || null
  // item_type is NOT included!
}));
```

This causes all items to receive the database default value of `'course_fee'`, even enrollment fee items.

### Bug 2: Wrong ID Passed to Allocation Function

**Location:** `src/components/classes/handlers/hooks/add-handler-modal/createInvoiceForHandler.ts` (lines 192-198)

The code passes the invoice ID instead of the invoice_item_id:

```typescript
const allocationResult = await allocateStarterKit(
  result.id, // This is the INVOICE ID, not the invoice_item_id!
  handlerId,
  dogName,
  branchId
);
```

The `allocate_starter_kit` database function expects an invoice_item_id to link the allocation record properly.

---

## Solution

### Fix 1: Include `item_type` in Invoice Item Insert

**File:** `src/lib/invoices/createInvoiceUtils.ts`

Add `item_type` to the item mapping:

```typescript
const itemsWithInvoiceId = calculatedData.items.map((item: any) => ({
  invoice_id: invoice.id,
  description: item.description,
  quantity: item.quantity,
  unit_price: item.unit_price,
  amount: item.quantity * item.unit_price,
  booking_id: item.booking_id || null,
  item_type: item.item_type || 'course_fee'  // ADD THIS
}));
```

Also modify the insert to return the created items so we can get the actual invoice_item_id:

```typescript
const { data: insertedItems, error: itemsError } = await supabase
  .from('invoice_items')
  .insert(itemsWithInvoiceId)
  .select();  // Return created items with their IDs
```

Return both invoice and items from the function.

### Fix 2: Pass Correct Invoice Item ID to Allocation

**File:** `src/components/classes/handlers/hooks/add-handler-modal/createInvoiceForHandler.ts`

Update to use the actual invoice_item_id from the created items:

```typescript
// After invoice creation, find the enrollment fee item from returned data
if (enrollmentFee && enrollmentFee > 0 && result?.items) {
  const enrollmentFeeItem = result.items.find(
    (item: any) => item.item_type === 'enrollment_fee'
  );
  
  if (enrollmentFeeItem && branchId) {
    const allocationResult = await allocateStarterKit(
      enrollmentFeeItem.id,  // Use the actual invoice_item_id
      handlerId,
      dogName,
      branchId
    );
    // ... handle result
  }
}
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/invoices/createInvoiceUtils.ts` | Add `item_type` to insert mapping; return inserted items with IDs |
| `src/components/classes/handlers/hooks/add-handler-modal/createInvoiceForHandler.ts` | Use actual invoice_item_id for starter kit allocation |

---

## Data Fix for Existing Record

After deployment, run this SQL to fix Alex Martin's invoice:

```sql
-- Fix item_type for enrollment fee
UPDATE invoice_items 
SET item_type = 'enrollment_fee' 
WHERE invoice_id = 'b8fe7f21-844c-45f6-ab36-e2b255eb5cc3'
  AND description LIKE 'Enrollment fee%';

-- Manually allocate starter kit for Toast
SELECT public.allocate_starter_kit(
  '6ce4cba7-085f-4a32-a776-7e143d54b82a',  -- enrollment fee invoice_item_id
  '205231cc-3989-4755-a621-885853ddedd9',  -- handler_id (Alex Martin)
  'Toast',                                   -- dog_name
  (SELECT branch_id FROM invoices WHERE id = 'b8fe7f21-844c-45f6-ab36-e2b255eb5cc3')
);
```

---

## Expected Outcome

After fix:
1. Enrollment fee items will be correctly stored with `item_type = 'enrollment_fee'`
2. Starter kit allocation will be triggered with the correct invoice_item_id
3. Stock will decrement properly and allocation records will link to the correct invoice item
4. Low stock warnings will appear when stock falls below 5
