
# Fix: Multi-Trainer Household Invoice — 50/50 Commission Split

## Problem

INV-McD-2603-0048 (Dean Nolte household) has two course fee items across two trainers:
- R1,680 → Maria Branco (Bronze CGC)
- R1,327.50 → Steve McClean (Beginner Obedience, 25% multi-dog discount baked in)
- Total: R3,007.50

Currently each trainer's commission is calculated on their item's raw amount (Maria: 40% × R1,680 = R672; Steve: 40% × R1,327.50 = R531). The discount unfairly penalises Steve's commission.

**Expected**: Total R3,007.50 ÷ 2 = R1,503.75 each → 40% = R601.50 per trainer.

## Solution

Create a pre-processing utility that detects multi-trainer invoices and redistributes amounts evenly before commission calculation. Apply it in `useTrainerPaymentData` before items are split per-trainer.

### New file: `src/hooks/trainer-payments/utils/redistributeMultiTrainerItems.ts`

**Algorithm:**
1. Group all invoice items by `invoice_id`
2. For each invoice group, resolve which trainer each item belongs to (via `booking_id` → lookup in bookings → `class_schedule_id` → lookup in schedules → `trainer_id`)
3. If items belong to multiple trainers:
   - Sum all course fee item amounts (exclude enrollment fees)
   - Divide equally by number of distinct trainers = `sharePerTrainer`
   - For each trainer's items: scale their amounts so the trainer's total equals `sharePerTrainer`
4. Return adjusted items (with modified `amount` and `unit_price`)

The function signature:
```typescript
function redistributeMultiTrainerItems(
  invoiceItems: InvoiceItem[],
  bookings: Booking[],
  schedules: Schedule[]
): InvoiceItem[]
```

### Modified file: `src/hooks/trainer-payments/useTrainerPaymentData.ts`

After line 95 (where `allInvoiceItems` and `allSubstitutes` are fetched), call the redistribution utility:

```typescript
const redistributedItems = redistributeMultiTrainerItems(
  allInvoiceItems, allBookings, allSchedules
);
```

Then use `redistributedItems` instead of `allInvoiceItems` when building `invoiceItemsByBooking` (lines 106-113) and when collecting per-trainer items (lines 174-178).

### No other files change

The existing `formatTrainerPaymentData` and `calculateClassRevenue` functions will automatically use the redistributed amounts since they receive items with adjusted `amount` values. The `applyInvoiceDiscountToItems` pipeline still works correctly because the invoice-level `monetary_discount` is 0 for this invoice (discount is baked into item prices).

## Why this approach

- **Single point of change**: The redistribution happens once, before any per-trainer processing
- **Non-destructive**: Only adjusts in-memory amounts for commission calculation — does not modify database records or invoice display
- **Handles future cases**: Any new multi-trainer household invoice will automatically get the 50/50 split
- **Enrollment fees excluded**: Only course fees are split; enrollment fees remain untouched
