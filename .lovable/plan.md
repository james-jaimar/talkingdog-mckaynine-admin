

## INV-McR-2603-0007 — Sophie Theodorou's R1,241.67 "Unallocated"

### What I'll check

This is the same class of issue we've seen twice now (Lesley Holm, Benjamin McNally) — an invoice line item whose `booking_id` is `NULL`, so the franchise/class report has no class context to attribute it to and drops it into "Unallocated (no booking link)".

I need to query the DB to confirm exactly what's going on for Sophie's invoice. Specifically:

1. **Pull the invoice + items** for `INV-McR-2603-0007`:
   - Item descriptions, amounts, `booking_id`, `io_inventory_code`, `item_type`
   - Invoice's `branch_id`, `term_id`, `client_id`, `franchise_report_month`
2. **Pull Sophie's client record(s)** — check whether there's a duplicate (like Benjamin) by searching on `lower(email) = 'sophietheodorou@hotmail.com'` and on phone
3. **Pull Sophie's bookings** in the Randburg branch around April 2026 — see what class(es) she's actually enrolled in, with dog + class name + schedule
4. **Cross-check**: does the item description (or amount) hint at which class it should be linked to?

### What I'll then propose (one of three outcomes)

**A — Single client, just an unlinked custom invoice** (most likely)
The invoice was raised via Custom Invoice without picking a booking. Fix: one-row UPDATE on `invoice_items.booking_id` to point at her actual class booking. R1,241.67 moves out of Unallocated into the correct class row, trainer commission gets calculated correctly.

**B — Duplicate client (Sophie exists twice, like Benjamin)**
Merge migration repointing `invoices.client_id`, `bookings.client_id`, `dogs.client_id`, `client_branches`, etc. from the duplicate to the canonical record, then delete the duplicate. Then fix the booking link as in (A) if needed.

**C — Genuinely non-class income** (e.g. merch, ad-hoc fee)
No fix needed — Unallocated is the correct bucket. We'd just confirm and move on.

### Out of scope until I see the data

- No code changes anticipated — the Custom Invoice form already supports linking, and we already added auto-select + the "0% commission" warning last round
- No bulk audit yet (we discussed this earlier as an optional follow-up — happy to run it after we've cleared the immediate three cases if you want)

### Next step

On approval I switch to default mode, run the read queries above, present findings, and propose the precise migration (single UPDATE for case A, merge migration for case B, or no-op for case C).

