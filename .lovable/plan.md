## What I found

You’re right to be irritated. This should be simple, but the app currently has **multiple calculation paths** for the same business concept.

Verified from the code and live database:

1. **Class Financial Report has its own calculator**
   - `useFinancialQuery` fetches invoices/items/bookings.
   - `useFinancialProcessor` applies invoice discounts, groups by class, calculates franchise/admin/instructor/profit.
   - I recently added a separate copy of the multi-dog redistribution logic there. That was a patch, not a proper consolidation.

2. **Trainer Payments Summary has a different calculator**
   - `useTrainerPaymentData` fetches trainers/schedules/bookings/items.
   - It runs `redistributeMultiTrainerItems` before calculating trainer totals.
   - It uses `trainer_payments` mostly for paid/unpaid status, not as the source of all displayed totals.

3. **The database function has a third formula**
   - `calculate_trainer_payment(p_booking_id)` simply sums raw `invoice_items.amount` for a booking and applies the class trainer percentage.
   - It does **not** apply invoice-level discounts.
   - It does **not** know about the multi-dog fairness rule.
   - It is used by the trigger and some recalculation utilities.

4. **There is another trainer report component with yet another formula**
   - `TrainerPaymentReport.tsx` calculates directly from raw item amounts and booking creation dates.
   - It is not using the same logic as the Trainers tab or the Class Financial Report.

5. **The persisted `trainer_payments` ledger is incomplete**
   - Live DB check: **575 paid course-fee invoice items linked to bookings have no matching `trainer_payments` row**.
   - So we cannot safely say “just use `trainer_payments` as source of truth” until it is repaired/backfilled.

## Why the discrepancies happen

The app is answering the same question in different ways:

```text
Invoice item amount → booking → class schedule → trainer → trainer fee %
```

…but that calculation exists in several places, with slightly different assumptions:

- raw amount vs discounted net amount
- class-level rounding vs item-level rounding
- persisted DB payment amount vs freshly recalculated frontend amount
- multi-dog redistribution applied in one place but not another
- hard-coded fallback rates for unallocated rows
- paid status coming from `trainer_payments`, but amount sometimes coming from invoice items

That is why a trainer can show one number on a statement and another number in the financial report.

## The fix I recommend

Consolidate to **one authoritative calculation model** and make every report use it.

### 1. Define the canonical commission line

Every course-fee invoice item should resolve to one financial line:

```text
invoice_item
  → booking
  → class_schedule
  → class
  → trainer
```

For each line we calculate:

- actual class revenue from the invoice item net amount
- trainer commission base
- trainer commission amount
- franchise fee
- admin fee
- profit
- branch
- term/month
- invoice status
- whether it is allocated or unallocated

Enrollment fees stay excluded from trainer/franchise/admin fee calculations.

### 2. Keep the one explicit exception: multi-dog fairness

Because the Robin/Dan case was confirmed as correct:

- Invoice total course fees: `R3030`
- Two trainers/classes
- Fair split base: `R1515` each
- At 40%, each trainer gets `R606`

This rule should exist **once**, not copied in report code.

### 3. Move the calculation into one shared source

Create a single canonical calculation service/query used by:

- Class Financial Report
- Trainers tab / Trainer Payment Summary
- trainer statement PDFs
- mark-as-paid flow
- recalculation/backfill tools

The current duplicated frontend functions should be removed or reduced to presentation-only grouping.

### 4. Replace the database recalculation function

Update `calculate_trainer_payment` so it uses the same canonical rule:

- discounted net course-fee amount
- correct class trainer percentage/fixed fee
- same multi-dog fairness rule
- cents rounding

Then the trigger and repair tools stop creating stale/wrong rows.

### 5. Backfill and repair `trainer_payments`

Run a controlled repair:

- create missing `trainer_payments` rows for linked course-fee invoice items
- recalculate pending/unpaid records from the canonical calculation
- audit already-paid records before changing historical paid amounts
- preserve payment dates, documents and references

### 6. Remove bad fallback maths

For unallocated invoice items, stop inventing trainer/admin/franchise fees with hard-coded 40/10/15 rates.

If an item has no booking link, we should show:

```text
Unallocated revenue: yes
Trainer fee: unknown / 0 until linked
Reason: no booking link
```

That makes the report honest instead of mathematically pretending we know which class/trainer it belongs to.

### 7. Validate against the known problem cases

Before calling it fixed, verify exact line-level output for:

- **Suzette Nel / INV-McD-2607-0014**
  - WT: `R2160 × 40% = R864`
  - Yoga: `R600 × 40% = R240`

- **Robin Williams and Dan Erasmus / INV-McD-2607-0008**
  - Split base: `R1515 + R1515`
  - Steve: `R606`
  - Therese: `R606`

- **Maria Branco discrepancy**
  - Trainer statement and Class Financial Report must produce the same trainer fee total.

## Outcome

After this, there should be only one answer to:

```text
What is the trainer fee for this invoice item?
```

Every screen will either display that answer directly or group those same canonical lines by class/trainer/month/term.