

# Pass Discounted Amounts to InvoicesOnline

## The Problem

When an invoice has a discount (e.g., subtotal R1,770 with R442.50 discount = R1,327.50 total), the system sends the **original** line item amounts (R1,770) to IO without any discount information. IO then shows the wrong total. The fix: send the **discounted** line item amounts so IO never needs to know about discounts.

## The Fix (1 file)

### `supabase/functions/sync-invoice-to-io/index.ts`

**1. Fetch `monetary_discount` from the database**

Add `monetary_discount` to the invoice SELECT query (around line 677) and to the `InvoiceData` interface (around line 40).

**2. Apply discount proportionally to items before sending to IO**

In `createIOInvoice` (around lines 242-252), before building the IO `data` array:

- Check if `invoice.monetary_discount > 0`
- If yes, calculate the discount ratio: `monetary_discount / subtotal`
- For each item, reduce its `unit_price` by that ratio (rounded to cents)
- Adjust the last item so the sum of all item amounts equals `invoice.total` exactly (prevents rounding drift)

This reuses the same proportional distribution logic already proven in `invoiceItemUtils.ts`.

**Example for INV-McD-2601-0043:**
- Original item: 1 x R1,770.00 = R1,770.00
- Discount ratio: 442.50 / 1770 = 0.25
- Adjusted item: 1 x R1,327.50 = R1,327.50
- IO receives R1,327.50 -- matches the invoice total perfectly

**For multi-item invoices:**
- Each item's unit price is reduced proportionally
- The last item absorbs any rounding remainder to ensure the total matches exactly

No frontend changes needed. After deploying, any newly synced invoices will have correct discounted amounts in IO.

