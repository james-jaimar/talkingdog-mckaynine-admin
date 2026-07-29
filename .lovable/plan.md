## What I verified

- The invoice in question is **INV-McD-2607-0037** for Angela Glover.
- It has two course-fee lines:
  - **14h00 Elementary Obedience / Therese**: R1,260.00
  - **14h00 Bronze CGC / Maria**: R1,680.00
- Invoice total course revenue is **R2,940.00**.
- Both classes use the same trainer commission rate: **40%**.
- Because it is a same-handler, multi-trainer, same-rate, multi-dog-discount case, the trainer base should be shared:

```text
R2,940.00 / 2 trainers = R1,470.00 base each
R1,470.00 * 40% = R588.00 commission each
```

## Confirmed root cause

The frontend canonical calculator already has the correct same-rate gate and should split this case correctly when it receives both invoice lines together.

The database function **`calculate_trainer_payment_for_schedule` is still schedule-scoped too early**. It starts from only the current schedule’s bookings, so when recalculating Therese’s class it only sees the R1,260 line; when recalculating Maria’s class it only sees the R1,680 line. It therefore cannot see the sibling trainer line on the same invoice and cannot apply the fairness split.

That is why stored/recalculated trainer payments can show:

```text
Therese: R1,260 * 40% = R504.00
Maria:   R1,680 * 40% = R672.00
```

instead of:

```text
Therese: R588.00
Maria:   R588.00
```

## Implementation plan

1. **Update the database trainer payment function**
   - Change `calculate_trainer_payment_for_schedule` so it first finds invoices touched by the target schedule, then loads all course-fee booking lines on those invoices.
   - Apply the existing canonical gates across the full invoice:
     - more than one trainer
     - one handler/client
     - invoice has a multi-dog discount reason
     - all affected lines have the same trainer fee type and value
   - Then return only the amount for the requested schedule/trainer.

2. **Keep the mixed-rate safety fix intact**
   - The Puppy bug remains protected: if trainer rates differ, do not redistribute.
   - Same-rate invoices like Angela’s do redistribute.

3. **Add regression coverage**
   - Add a test case for Angela’s invoice shape:
     - R1,260 + R1,680
     - same handler
     - two trainers
     - both at 40%
     - expected trainer base R1,470 each and commission R588 each.
   - Fix the existing Vitest file import issue (`describe/it/expect`) so the regression actually runs.

4. **Recalculate/verify Angela’s case**
   - After the DB function update, verify the function returns **R588.00** for both Therese and Maria’s schedules on this invoice context.
   - If any stored `trainer_payments` rows for those schedules are stale, update/recreate them through the existing payment recalculation path rather than hand-editing unrelated report math.

5. **Validate report consistency**
   - Confirm the trainer report and financial report agree for this invoice:

```text
Invoice source of truth: R2,940.00
Therese commission:     R588.00
Maria commission:       R588.00
Total trainer cost:     R1,176.00
```

## Important note

The source of truth remains the **net course-fee invoice line total**. The only special rule here is not changing revenue; it is only changing the **trainer commission base** when a multi-dog discount was manually/structurally applied to one trainer’s line but the business rule says that discount should be shared fairly across same-rate trainers.