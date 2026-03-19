

## Fix: Household Rebalance Discount Applied to Wrong Amount

### The bug

The code applies the 25% discount to the **entire combined total** of both handlers. It should only apply 25% to the **second handler's fee**.

```text
CURRENT (wrong):
  combined = 2160 + 1770 = 3930
  discount = 3930 × 25% = 982.50
  after discount = 2947.50
  per handler = 1473.75  ← matches the wrong number on screen

CORRECT:
  discount only on 2nd = 1770 × 25% = 442.50
  discounted 2nd = 1327.50
  combined after discount = 2160 + 1327.50 = 3487.50
  per handler = 1743.75  ← what user expects
```

### Fix

**File: `src/components/classes/handlers/hooks/add-handler-modal/rebalanceHouseholdInvoices.ts`**

Replace lines 127-133 — change the discount calculation so only `newClassPrice` is discounted, not the existing handler's fees:

```typescript
// 3. Apply 25% discount ONLY to the new (second) handler's course fee
const newClassDiscount = newClassPrice * 0.25;
const discountedNewClassPrice = newClassPrice - newClassDiscount;
const combinedAfterDiscount = existingCourseFeeTotal + discountedNewClassPrice;

// 4. Split 50/50
const sharePerHandler = Math.round((combinedAfterDiscount / 2) * 100) / 100;
```

Update the `householdDiscount` variable reference (used in logs and task description) to use `newClassDiscount` instead.

### Files changed
- `rebalanceHouseholdInvoices.ts` — fix discount to apply only to the 2nd handler's fee

