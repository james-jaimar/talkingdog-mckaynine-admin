## Goal

1. Fix the multi-dog trainer fairness rule to match your definition.
2. Audit every July 2026 multi-dog invoice and correct any calculations that drift from the rule.

## The corrected rule

When an invoice has:
- A multi-dog discount reason, AND
- More than one trainer across its course lines, AND
- One handler (one client) across those lines

Then, regardless of the trainers' commission rates:

- Take the invoice's net course total (sum of the discounted line amounts).
- Split it evenly across the trainers — that is each trainer's "base amount".
- Each trainer then applies THEIR OWN commission % to their half.

The class-level franchise (15%) and admin (10%) fees stay tied to each actual line's net amount (they are not redistributed), because those fees follow revenue, not the trainer.

### What changes in code

`src/lib/financial/canonicalCommission.ts` — remove the "same-rate" gate. The redistribution block currently only runs when every trainer on the invoice has an identical fee signature (line 211: `feeSignatures.size !== 1` bails out). That gate is what's producing Ady's complaint on INV-McD-2607-0037: Therese is at 40% on a discounted line (R1,260), Maria is at 40% on a full-price line (R1,680) — same rate today so it happens to be fine there — but the rule should apply even when rates differ. Drop the `feeSignatures.size !== 1` check; keep the other gates (multi-trainer, single client, multi-dog reason).

Mirror the same removal in Postgres `public.calculate_trainer_payment_for_schedule` so DB-side trainer payment totals agree with the UI.

Update `src/lib/financial/canonicalCommission.test.ts`:
- Keep the Angela Glover case (same-rate) — result unchanged.
- Change the "different-rate" test so it now EXPECTS redistribution: e.g. Ady 75% + Steve 40% on a R1,117.50 + R1,680 invoice → each trainer's base = R1,398.75 → Ady commission R1,049.06, Steve R559.50.
- Add a case that also confirms franchise/admin fees are still computed off each line's own net (not the redistributed base).

### What this means for the earlier Puppy R210.94 regression

That fix was gated on "same rate only" as a safety net against overallocation. Re-running the math with the correct rule on INV-McD-2607-0009 (Ady 75% + Steve 40%, net R2,797.50): trainer commissions total R1,608.56, franchise R419.63, admin R279.75 → total fees R2,307.94 → profit R489.56. No negative profit, no overallocation. Safe to remove the gate.

## July 2026 audit

I've enumerated every July invoice flagged as multi-dog. Six invoices, all Delta, all with `monetary_discount = 0` (discounts were baked into line amounts, not stored as a monetary discount — so `net = amount` per line):

| Invoice | Handler shape | Trainers | Course subtotal | Action after rule fix |
|---|---|---|---|---|
| INV-McD-2607-0008 | 1 handler, 2 dogs, 2 classes | Therese 40% + Steve 40% (R1,260 + R1,770) | R3,030 | Redistribute → R1,515 each. Therese R606, Steve R606. |
| INV-McD-2607-0009 | 1 handler, 2 dogs, 2 classes (+2 enrollment) | Ady 75% + Therese 40% (R1,117.50 + R1,680) | R2,797.50 | Redistribute → R1,398.75 each. Ady R1,049.06, Therese R559.50. |
| INV-McD-2607-0016 | 1 handler, 1 trainer only | Ady (single class) | R1,050 | No redistribution — single trainer. Verify commission = 75% × R1,050. |
| INV-McD-2607-0017 | 1 handler, 1 trainer only | Therese (single class) | R1,050 | No redistribution — single trainer. Verify commission = 40% × R1,050. |
| INV-McD-2607-0031 | 1 handler, 1 trainer only | (single class) | R3,780 | No redistribution. Verify commission at class's own rate. |
| INV-McD-2607-0037 | 1 handler, 2 dogs, 2 classes | Therese 40% + Maria 40% (R1,260 + R1,680) | R2,940 | Redistribute → R1,470 each. Therese R588, Maria R588. (Already fixed manually; this makes it deterministic.) |

For the three single-trainer invoices (0016, 0017, 0031) the rule doesn't apply and existing math should already be right — I'll verify each stored trainer payment matches `class_rate × subtotal` after the migration runs.

For the three multi-trainer invoices (0008, 0009, 0037), after the code + DB fix I'll call `update-trainer-payments` (or update `trainer_payments` rows directly) so the pending amounts reflect the recalculated schedule totals for those trainers, and then eyeball the Class Financial Report to confirm the two views match to the cent.

## Sequence

1. Edit `src/lib/financial/canonicalCommission.ts` — remove same-rate gate.
2. Migration on `public.calculate_trainer_payment_for_schedule` — remove same-rate gate.
3. Update `src/lib/financial/canonicalCommission.test.ts` — flip the different-rate expectation, keep same-rate case, add fees-not-redistributed check. Run `bunx vitest run canonicalCommission`.
4. Refresh stored `trainer_payments` for the three affected July schedules (INV-McD-2607-0008, 0009, 0037) so pending amounts match the new recalculation.
5. Verify by reading Class Financial Report (July) and Trainer Statements — every trainer total should equal the sum of their fair-share commissions from the report.
6. Report exact before/after numbers per invoice back to you.

## No changes required

- Discount detection logic (already handles both stored `monetary_discount` and pre-discounted line amounts).
- Franchise/admin fee computation (stays per-line on net).
- Overallocation guards (kept; will only fire in true edge cases now).
