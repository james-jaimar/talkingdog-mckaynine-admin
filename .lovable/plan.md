

# Add Class/Booking Link to Custom Invoices

## Problem

When Ady splits a client's payment into two invoices (e.g., R680 + R1,000 for Lesley Holm's Elementary Obedience), the second "custom" invoice has no `booking_id` on its items. This means:
- Trainer payment reports don't include the revenue
- IO sync has no automatic inventory code mapping
- The invoice is orphaned from the class it relates to

## Solution

Add a **class/booking selector** to the Custom Invoice form so each line item can optionally be linked to one of the client's active bookings. When a booking is selected, the item automatically inherits:
- `booking_id` → links to trainer for commission reports
- `io_inventory_code` → inherited from the class schedule (same logic as standard invoices)

### UX Changes to `CreateCustomInvoice.tsx`

1. **Fetch client's bookings** — query bookings for the `clientId` with joined class schedule data (class name, trainer name, io_inventory_code)
2. **Add a "Link to Class" dropdown per item** — optional Select field showing the client's classes (e.g., "14h00 Elementary Obedience - Gunner"). When selected, auto-fills `booking_id` and `io_inventory_code` on the item
3. **Update the form schema** — add optional `booking_id: z.string().optional()` to the item schema

### Data Changes

Pass `booking_id` through to the invoice item creation. The existing `createInvoice` mutation already supports `booking_id` on items — it just hasn't been populated from this form.

### Files Changed

1. **`src/components/handlers/detail/CreateCustomInvoice.tsx`**
   - Add `useQuery` to fetch client bookings with class schedule details
   - Add `booking_id` to the Zod schema items
   - Add a Select dropdown per item row: "Link to Class (Optional)" showing `{class time} {class type} for {dog name}`
   - When a booking is selected, auto-set `io_inventory_code` from the schedule data
   - Pass `booking_id` through in the items array to `createInvoice`

2. **No backend/migration changes needed** — `invoice_items.booking_id` column already exists and is nullable

### How It Works for Ady

When creating a split payment custom invoice:
1. Click "Custom Invoice" on the handler detail page
2. Fill in the amount (e.g., R680)
3. Select "14h00 Elementary Obedience - Gunner" from the "Link to Class" dropdown
4. The IO code auto-fills, and the item gets linked to the booking
5. Trainer sees this revenue in their payment report

