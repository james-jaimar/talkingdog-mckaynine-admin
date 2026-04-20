
You're right — let me re-check before planning further changes.

## What I'll verify

Looking at `CreateCustomInvoice.tsx` (the handler-detail custom invoice flow), the file summary already shows:
- A "Link to Class" select dropdown
- A `handleBookingSelect` that auto-fills the IO inventory code
- Booking data fetched via `useQuery` for the client's confirmed bookings
- The submitted item carries `booking_id` through to `createInvoice`

So the **UI capability already exists**. That means for Lesley Holm's R680 invoice, one of two things happened:
1. The admin didn't pick a booking from the "Link to Class" dropdown when raising it (left as "None"), or
2. The dropdown didn't surface Lesley's Elementary booking at the time (e.g. filter showed only unpaid/unenrolled, and her booking was already enrolled/paid)

## Revised plan

### Fix 1 — Repair Lesley's R680 (unchanged, still needed)

One-row update on `invoice_items.aacef2f1-887f-48c5-9825-f27b8c932f2f`:
```
booking_id = '435231ba-709d-4629-aa32-007834dfedbd'
```
This moves R680 from "Unallocated" into the Elementary class row in the franchise report and restores correct trainer commission.

### Fix 2 — Investigate why the link wasn't used

Before changing any UI, I'll check `CreateCustomInvoice.tsx` to confirm:
- **What bookings the dropdown shows** — if it filters to "unpaid only" or "unenrolled only", an already-enrolled handler getting a top-up wouldn't see their existing booking and the admin would have no choice but to leave it unlinked
- **Whether selection is optional vs nudged** — if it's an unobtrusive optional field, easy to overlook on a top-up

Likely outcomes from that check:

- **If filter is too narrow** → broaden it to show *all active bookings for the current term* (paid + enrolled included), so top-up invoices can attach to existing enrolments
- **If selection was just skipped** → add a soft prompt: "This handler has 1 active booking — link this invoice to it?" (yes/no, defaults to yes), to make the right path the easy path
- **If both are fine** → no UI change; just the DB repair, and we note the lesson (admins must remember to pick the booking on top-ups)

### Fix 3 — Optional bulk audit

Run a read-only query to find other historical custom-invoice items where:
- `booking_id IS NULL`
- handler has an active booking in the same term
- description hints at a class (contains words like "elementary", "puppy", "top-up", "balance")

Surface as a list — we review together and bulk-link the obvious matches. No automatic changes.

## Files I'll need to look at before finalising

- `src/components/handlers/detail/CreateCustomInvoice.tsx` — confirm the dropdown's booking filter
- The hook it uses to fetch bookings (likely `useClientBookings` or inline query)

## Out of scope

- Forcing the booking link to be mandatory — non-class billing (merch, fines, ad-hoc fees) still legitimately leaves it blank
- IO document changes — internal attribution only

**Approve this and I'll switch to default mode, run the DB repair for Lesley, then inspect the dropdown filter and propose the smallest UI nudge needed (if any).**
