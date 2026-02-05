

# Fix Trainer Payment Amount Mismatch

## The Problem

When marking trainer payments as paid, two issues are causing data discrepancies:

### Issue 1: Wrong Per-Class Amounts Stored

**Current behavior (WRONG):**
When paying a trainer for 2 classes with a total of R 2,760:
- System divides total evenly: R 2,760 / 2 = R 1,380 each
- Both classes stored with R 1,380

**Correct behavior:**
- 15h00 Yoga January: R 1,140 (5 handlers × R 570 × 40%)
- 16h15 Yoga January: R 1,620 (7 handlers × ~R 579 × 40%)

### Issue 2: Recent Trainer Payments Shows Individual Records

The "Recent Trainer Payments" table displays each `trainer_payments` record as a separate row. When a single payment covers multiple classes, it appears as multiple confusing entries (e.g., Leanne shows twice with R 1,380 each instead of once with R 2,760).

---

## The Solution

### Fix 1: Store Actual Per-Class Commission Amounts

**File:** `src/hooks/useMarkTrainerPaymentsPaid.ts`

Instead of passing a total amount and dividing it in the edge function, pass the actual per-class amounts from the classDetails.

```text
Current Flow:
  Client sends: { amount: 2760, scheduleIds: [A, B] }
  Edge function: 2760 / 2 = 1380 per schedule  ❌

New Flow:
  Client sends: { classAmounts: { A: 1140, B: 1620 }, scheduleIds: [A, B] }
  Edge function: Use exact amounts from classAmounts  ✓
```

**File:** `supabase/functions/update-trainer-payments/index.ts`

Update edge function to accept `classAmounts` object and use the exact amount for each schedule.

### Fix 2: Aggregate Payment Transactions in Recent Payments View

**File:** `src/components/invoices/reports/payment-history/TrainerPaymentHistory.tsx`

Group payment records by trainer + payment_date + payment_method to show single rows for multi-class payments.

```text
Current Display:
  Leanne Williams | 05/02/2026 | R 1,380.00 | Bank Transfer
  Leanne Williams | 05/02/2026 | R 1,380.00 | Bank Transfer

New Display:
  Leanne Williams | 05/02/2026 | R 2,760.00 | Bank Transfer | (2 classes)
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useMarkTrainerPaymentsPaid.ts` | Build `classAmounts` map from classDetails and pass to edge function |
| `supabase/functions/update-trainer-payments/index.ts` | Accept `classAmounts` and use exact per-class amounts |
| `src/components/invoices/reports/payment-history/TrainerPaymentHistory.tsx` | Aggregate payment records by transaction |

---

## Technical Details

### useMarkTrainerPaymentsPaid.ts Changes

```typescript
// Build classAmounts map from class details
const classAmounts: Record<string, number> = {};
if (params.classDetails) {
  params.classDetails.forEach(cls => {
    classAmounts[cls.scheduleId] = cls.potentialRevenue;
  });
}

// Pass to edge function
const { error, data } = await supabase.functions.invoke('update-trainer-payments', {
  body: {
    trainerId: params.trainerId,
    scheduleIds: params.scheduleIds,
    classAmounts,  // NEW: exact per-class amounts
    // ... other fields
  }
});
```

### Edge Function Changes

```typescript
interface PaymentUpdateRequest {
  // ... existing fields
  classAmounts?: Record<string, number>;  // NEW
}

// When creating/updating records, use exact amounts
if (payload.classAmounts && payload.classAmounts[scheduleId]) {
  updateData.amount = payload.classAmounts[scheduleId];
}
```

### TrainerPaymentHistory.tsx Changes

```typescript
// After fetching payments, group by transaction
const groupedPayments = payments.reduce((groups, payment) => {
  const key = `${payment.trainer_id}-${payment.payment_date}-${payment.payment_method}`;
  if (!groups[key]) {
    groups[key] = {
      ...payment,
      amount: 0,
      classCount: 0
    };
  }
  groups[key].amount += payment.amount;
  groups[key].classCount += 1;
  return groups;
}, {});
```

---

## Data Migration (Optional)

For Leanne's existing incorrect records, a one-time fix query:

```sql
-- Fix 15h00 Yoga January (should be R 1,140)
UPDATE trainer_payments 
SET amount = 1140 
WHERE id = '9a82d42e-87ba-4953-abb4-f86a36d1c1e8';

-- Fix 16h15 Yoga January (should be R 1,620)
UPDATE trainer_payments 
SET amount = 1620 
WHERE id = '96524c14-1b6d-4d96-88f5-2c55a2a36bb6';
```

---

## Expected Result After Fix

**Recent Trainer Payments:**
| Trainer | Date | Amount | Method |
|---------|------|--------|--------|
| Leanne Williams | 05/02/2026 | R 2,760.00 | Bank Transfer (2 classes) |

**Database Records:**
| schedule_id | amount |
|-------------|--------|
| 15h00 Yoga January | R 1,140.00 |
| 16h15 Yoga January | R 1,620.00 |

