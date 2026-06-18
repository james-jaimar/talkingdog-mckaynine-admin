## What's actually wrong

The two invoices `INV-McD-2605-0017` and `INV-McD-2606-0013` are linked to booking `9185f2f2…`, which sits on class schedule `7353cf07…` — and that schedule is on **Term 1 2026** (start date 17 Jan).

But the invoices themselves are tagged **Term 2 2026** (`franchise_report_month` 2026-05 and 2026-06).

The trainer payments view filters schedules by the current term. So when Heidi is in Term 2, Steve's Term 1 schedule is filtered out, and the May/June invoice items hanging off the Term 1 booking go with it. That's why "those two invoices don't show up for Steve."

Steve *does* have a Term 2 2026 Working Trials schedule: `5ecd1fda…` (28 Mar). Benjamin already has a booking on that Term 2 schedule (`af12412d…`), and the March invoice `INV-McD-2603-0058` is already correctly linked to it (with a pending trainer payment of R288).

So the two May/June invoices were linked to the wrong booking — the leftover Term 1 one — instead of the Term 2 one.

## The fix (data only, no IO, no code)

Re-point the two invoice items from the Term 1 booking to the Term 2 booking, then refresh Steve's existing pending trainer payment for that Term 2 schedule:

1. `UPDATE invoice_items SET booking_id = 'af12412d-f23c-401e-a0fe-dfc7d93f8391' WHERE invoice_id IN ('a9e21816-9eb5-4723-a9de-d33666be04ac', '54ac1dfb-87e0-4105-b708-44b3e7fa0a14') AND booking_id = '9185f2f2-f491-4c79-be9d-30d5f3e497a1';`
2. Recalculate Steve's pending trainer payment on schedule `5ecd1fda…` so it covers all three Term 2 invoices on booking `af12412d`:
   - Total revenue on that booking after the move: R720 + R720 + R480 = R1920
   - Trainer fee = 40% = **R768**
   - `UPDATE trainer_payments SET amount = 768, updated_at = now() WHERE id = '130431d2-a59f-4f93-a6ba-356615a3107e';` (status stays `pending`)

After this:
- Steve sees both invoices on his Term 2 pending list (under the 28 Mar Working Trials schedule, alongside the March invoice), totalling R768 pending.
- The previously-paid Term 1 payment of R1344 (from the January invoice on the same booking) is untouched.
- No IO records are touched — only `invoice_items.booking_id` and `trainer_payments.amount` change. Invoice numbers, totals, IO sync fields, branch, term, franchise_report_month all stay exactly as they are.

## Out of scope

- Why the invoices got linked to the wrong booking in the first place (likely Heidi picked the older Term 1 booking from the dropdown when creating these as custom invoices on the correct client). Preventive UX change is a separate task — flag if you want me to do it next.
- The duplicate "Benjamin McNally (OLD)" client record — separate cleanup.

## Technical summary

Two SQL statements via the insert tool — one UPDATE on `invoice_items`, one UPDATE on `trainer_payments`. No migrations, no code changes, no edge function calls, no IO sync.
