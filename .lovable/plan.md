
# Fix 1-Cent Franchise Fee Rounding Discrepancy

## Problem

The Financial Report (R10,089.75) and Franchise Report (R10,089.76) differ by exactly 1 cent due to inconsistent rounding strategies.

---

## Root Cause

| Report | Rounding Strategy |
|--------|-------------------|
| Franchise Report | Rounds each handler's franchise fee to cents using `roundToCents()` BEFORE summing |
| Financial Report | Sums raw floating-point values, only rounds at display time |

This is a classic "when to round" problem in financial software.

---

## Solution

Update the Financial Report's processor (`useFinancialProcessor.ts`) to match the Franchise Report's rounding strategy - round each fee calculation to cents before accumulating.

### File to Modify

`src/hooks/financial/useFinancialProcessor.ts`

### Changes

Apply `roundToCents()` to each fee calculation (franchise, admin, instructor):

**Current Code (lines 160-179):**
```typescript
// Franchise/Commission fee
if (isFixedAmount(classData.mckaynine_commission_type)) {
  summary.franchiseFee += commissionValue;
} else {
  summary.franchiseFee += amount * (commissionValue / 100);
}

// Admin fee
if (isFixedAmount(classData.admin_fee_type)) {
  summary.adminFee += adminValue;
} else {
  summary.adminFee += amount * (adminValue / 100);
}

// Trainer/Instructor fee
if (isFixedAmount(classData.trainer_fee_type)) {
  summary.instructorFee += trainerValue;
} else {
  summary.instructorFee += amount * (trainerValue / 100);
}
```

**Updated Code:**
```typescript
// Franchise/Commission fee (round per-item to match Franchise Report)
if (isFixedAmount(classData.mckaynine_commission_type)) {
  summary.franchiseFee += roundToCents(commissionValue);
} else {
  summary.franchiseFee += roundToCents(amount * (commissionValue / 100));
}

// Admin fee (round per-item for consistency)
if (isFixedAmount(classData.admin_fee_type)) {
  summary.adminFee += roundToCents(adminValue);
} else {
  summary.adminFee += roundToCents(amount * (adminValue / 100));
}

// Trainer/Instructor fee (round per-item for consistency)
if (isFixedAmount(classData.trainer_fee_type)) {
  summary.instructorFee += roundToCents(trainerValue);
} else {
  summary.instructorFee += roundToCents(amount * (trainerValue / 100));
}
```

### Also Update Unallocated Fees (lines 206-208)

Apply the same rounding to unallocated fee calculations:

```typescript
const unallocatedAdminFee = roundToCents(unallocatedCourseFee * (avgAdminPercent / 100));
const unallocatedTrainerFee = roundToCents(unallocatedCourseFee * (avgTrainerPercent / 100));
const unallocatedFranchiseFee = roundToCents(unallocatedCourseFee * (avgFranchisePercent / 100));
```

---

## Technical Notes

- The `roundToCents` function already exists in `src/lib/invoiceMath.ts` and is the canonical rounding function
- This function is already imported in `useFinancialProcessor.ts` (line 4)
- After this change, both reports will use "round-then-sum" strategy, ensuring identical results

---

## Expected Outcome

After implementation:
1. Financial Report and Franchise Report will show **identical** franchise fee values
2. All fee calculations (admin, trainer, franchise) will be consistent across reports
3. The difference between reports will be R0.00 instead of R0.01
