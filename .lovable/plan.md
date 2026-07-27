## Problem

Trainer commissions are being split across trainers for invoices that just happen to have two unrelated classes on them (one handler, two classes, two trainers, no discount). This is a side effect of the recent "merge new enrollments into existing draft invoice" change combined with the current redistribution rule, which fires whenever a single invoice has course-fee items resolving to more than one trainer.

## Fix

Tighten `redistributeMultiTrainerItems` (`src/hooks/trainer-payments/utils/redistributeMultiTrainerItems.ts`) so it only redistributes when **both** are true:

1. The invoice was created with a multi-dog discount — detected via `invoices.discount_reason` containing `"multi-dog"` (this is the exact literal set in `createInvoiceForHandler.ts`). Fallback: `monetary_discount > 0` **and** `discount_reason` mentions multi-dog. Either signal alone is not enough.
2. The trainers' items resolve to bookings belonging to the **same handler** (`bookings.client_id` — already the only case we care about, but we assert it explicitly to be safe).

If either condition fails → pass items through unchanged, per-trainer commission on the exact invoiced amount.

## Implementation

1. **Extend the input** to `redistributeMultiTrainerItems` with an `invoicesById` map containing `{ discount_reason, monetary_discount, client_id }` for each `invoice_id` in scope.
2. **In `useTrainerPaymentData.ts`**, when we fetch `allInvoiceItems`, also fetch the parent invoices (already in scope for other logic — confirm and reuse; otherwise add a lightweight `invoices` select for the distinct invoice ids) and build the map, then pass it into `redistributeMultiTrainerItems`.
3. **In the function**, before computing `sharePerTrainer`, gate on:
   ```ts
   const invoice = invoicesById.get(invoiceId);
   const hasMultiDogDiscount =
     !!invoice &&
     (invoice.monetary_discount ?? 0) > 0 &&
     /multi-?dog/i.test(invoice.discount_reason ?? "");
   const sameHandler = /* all bookings for these items share one client_id */;
   if (!hasMultiDogDiscount || !sameHandler) { result.push(...items); continue; }
   ```
4. Keep the existing scale-factor math for the qualifying case — that behavior is correct and matches the original intent.
5. Update the console log to state which gate passed/failed, so future debugging is easy.

## Verification

- Query recent trainer_payments for the affected handler and confirm each trainer's amount matches `calculate_trainer_payment(booking_id)` for their own booking (no averaging).
- Confirm a known 2-dogs-same-class multi-dog-discount invoice still averages correctly.
- No schema changes. No edge function changes. No migration.

## Out of scope

- No change to the draft-merge behavior in `createInvoiceForHandler.ts`.
- No change to the 25% discount rule itself.
- No backfill; existing `trainer_payments` rows will refresh next time `calculate_trainer_payment` runs for their booking (or we can trigger a manual recompute for the affected handler after the code fix — I'll flag which handler once you point me at them).