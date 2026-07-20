
## What actually happened
You were right — those four handlers (Carina/Lulu, Gael/Rusty, Kamal/Tyson, Dean/Bodhi) are all currently booked into the **15h00 Elementary Obedience** class (schedule `238ee692-7ef6-45b7-abe3-a435d837aeca`, class `794346d8-b14a-4035-b3ea-49ce4eaf6877`). The class was almost certainly created as "16h00", the invoice items were generated at that time (which is why the descriptions still say "16h00 Elementary Obedience"), and then the class time got changed to 15h00 later.

When Ady renamed/rescheduled the class, the item descriptions weren't rewritten. More importantly, at some point the `booking_id` on those four invoice items got cleared (or the original booking was replaced with a new one), so the items no longer point at a booking — which is exactly why the financial report throws them into Unallocated and the handler page shows "Not Invoiced".

## Fix

Two data updates on the four `invoice_items`, no code changes:

1. Set `booking_id` on each item to the matching handler's booking in the 15h00 EO schedule:

| Invoice | Handler / Dog | invoice_item id | booking_id |
|---|---|---|---|
| INV-McD-2607-0007 | Carina Saunders / Lulu | `3ce0470f-ba29-4424-bd7d-e14f12781275` | `8bc2cac2-118c-4175-9b4d-8c974c03f825` |
| INV-McD-2607-0012 | GAEL GILCHRIST / Rusty | `3e0b58cd-6087-42f2-848c-9726a50c98f9` | `5bb3f3a0-f795-4420-8160-e266c4ee4f10` |
| INV-McD-2607-0015 | Kamal Patel / Tyson | `0a5908e2-55a7-4296-ac3c-3e9cc1a66458` | `95f43a3f-b146-402d-8bc7-747aa197803b` |
| INV-McD-2607-0026 | DEAN ORMSBY / Bodhi | `32450f1c-8f77-4d56-83bb-7ff0f3bda651` | `117ac129-cc5f-441f-9887-12af622abfc1` |

2. Update each item's `description` from `16h00 Elementary Obedience training class for X` to `15h00 Elementary Obedience training class for X`, so it matches reality on the invoice PDF too.

Attaching the `booking_id` will also fire the existing `create_trainer_payment_for_booking` trigger, which creates the trainer_payments row for that booking — so the trainer will get their commission on the R6,720, and the Unallocated row on the Term 3 report drops to zero (for these four).

Carina's invoice also has a duplicate "Enrolment Fee" line at R265 with `item_type = 'course_fee'` — that's a separate small data-hygiene issue I'll leave alone unless you want it corrected in the same pass.

## Why the handler page said "Not Invoiced"
The Payment column reads from `invoice_items.booking_id`, not from the invoice's client_id. With `booking_id = NULL`, the class handler row has no way to find the paid invoice, so it falls back to "Not Invoiced". Once the links are set, those four rows will flip to "Paid" automatically on the next load.

Approve and I'll run the four updates.
