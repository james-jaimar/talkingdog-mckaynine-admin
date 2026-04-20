

## What's actually happening

Benjamin McNally exists **twice** in the database:

| Client ID | First / Last | Email | Phone | Created | Has |
|---|---|---|---|---|---|
| `cd0ded91…` | "Benjamin" / "McNally" | benjamin8… (lowercase) | 0724584328 | 2026-01-04 | The handler page you're viewing. Has dog *Gordon* (`bb432b88…`). 2 invoices: Beg & Novice Jul-Sep, Beg & Novice Oct-Dec. |
| `4aac38aa…` | "Benjamin McNally" / "" (last_name empty, trailing space) | Benjamin8… (uppercase B) | 0724584328 | 2025-03-31 | The OLDER duplicate. Has its own dog *Gordon* (`e7676ff6…`). 1 custom invoice **INV-McD-2603-0058 R720** for "15h00 Working Trials training class for Gordon", linked to booking `af12412d…`. |

Same person, same phone, same email (just case-different), two separate client rows — and they each carry independent bookings, dogs, and invoices. The custom invoice was raised against the older record, so it correctly shows everywhere that uses `client_id` broadly (Invoices list, Franchise report — because the booking + branch are right) but is **invisible on the handler detail page** for `cd0ded91…`, which only queries its own client_id.

This is **not a code bug** — `useClientInvoices` is doing exactly the right thing. It's a data integrity issue: a duplicate client.

## Proposed fix — merge the duplicate into the canonical record

Treat `cd0ded91…` (the one currently shown as the handler) as canonical and merge `4aac38aa…` into it. Concretely:

1. **Re-point the orphaned data** from `4aac38aa…` → `cd0ded91…`:
   - `invoices.client_id` (the R720 custom invoice + any others)
   - `bookings.client_id` (the Working Trials booking → `af12412d…`)
   - `dogs.client_id` (the duplicate Gordon → `e7676ff6…`) — keep both Gordons for now; you can decide later whether to also dedupe the dog records
   - `client_branches`, `invoice_additional_recipients`, `client_notes`, etc. — any FK referencing the old client_id
2. **Delete the now-empty duplicate client** (`4aac38aa…`) so it can't trap future entries.
3. After merge, the handler page will show **3 invoices** (the 2 existing + INV-McD-2603-0058 R720) and **2 dogs named Gordon** (you can dedupe manually via the Dogs panel if desired).

I'll do this as a single migration wrapped in a transaction so it either all succeeds or rolls back. I'll also list every table I touched in the migration comment.

## Why duplicates happened (and how to prevent more)

The two emails differ only in case (`B` vs `b`). The `clients` table likely has no case-insensitive unique constraint on email or on (phone, email). Two paths could create this:
- Public enrollment form submitted with a different capitalisation
- Admin manually adding a handler when an existing one already matched on phone

**Optional follow-up (not in this fix unless you want it):**
- Add a partial unique index `UNIQUE (lower(email))` on `clients` so the next near-duplicate is rejected at the DB level
- Add a "possible duplicate" warning in `AddHandlerModal` when phone OR `lower(email)` already matches an existing client

## Out of scope

- Auditing every other duplicate handler in the system (let me know if you want a separate sweep — easy to query)
- Merging the two Gordon dog records (leaving both attached to the canonical handler; you can delete the unused one from the UI after confirming history)
- Any change to the IO document — internal attribution only

## Files affected

- New migration: re-point FKs from `4aac38aa…` to `cd0ded91…`, then delete the duplicate client
- No application code changes — `useClientInvoices` is correct as-is

