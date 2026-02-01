

# Fix: Household Discount Should Only Consider Draft Invoices

## The Problem

When checking for existing household enrollments, the current code:
1. Finds ANY booking from household members in the term
2. Looks for a "non-cancelled" invoice (which includes `paid` invoices)
3. Returns that booking as an existing enrollment

This causes the household discount to fail because:
- It finds an OLD paid invoice from a previous enrollment
- The code in `addHandlerToClass.ts` correctly skips rebalancing for paid invoices
- But it then also skips applying ANY discount - creating a full-price invoice

## The Solution (Simplified)

**Only consider bookings with draft or sent invoices.** Paid invoices should be completely ignored for household discount purposes.

If no household member has a draft/sent invoice in the current term, treat it as if there's no existing enrollment.

---

## File: `checkExistingTermEnrollment.ts`

### Change 1: Remove LIMIT 1, fetch all matching bookings

```typescript
// Before (lines 105-107):
const { data: existingBookings, error } = await query
  .order('created_at', { ascending: true })
  .limit(1);

// After - fetch all, no limit:
const { data: existingBookings, error } = await query
  .order('created_at', { ascending: false }); // Newest first
```

### Change 2: Only consider bookings with draft/sent invoices

After fetching all bookings, find one that has a **draft** or **sent** invoice:

```typescript
// After line 123 (if no bookings), add filtering logic:

// Filter to only bookings that have a draft or sent invoice
// Paid invoices should be ignored for household discount purposes
const bookingWithDraftInvoice = existingBookings?.find(booking => {
  const invoiceItems = booking.invoice_items as Array<{ 
    invoice_id: string; 
    invoices: { id: string; invoice_number: string; status: string } 
  }>;
  
  return invoiceItems?.some(item => 
    item.invoices && 
    (item.invoices.status === 'draft' || item.invoices.status === 'sent')
  );
});

// If no booking has a draft/sent invoice, no discount applies
if (!bookingWithDraftInvoice) {
  console.log("MULTI-DOG-CHECK: Existing bookings found but all have paid invoices - no discount applicable");
  return {
    hasExistingEnrollment: false,
    totalDogsInTerm: 0,
  };
}

// Use the booking with draft/sent invoice
const existingBooking = bookingWithDraftInvoice;
```

---

## Why This Works

| Scenario | Behavior |
|----------|----------|
| Handler A has PAID invoice from Term 1 | Ignored - no household discount triggered |
| Handler A has DRAFT invoice from current term | Household discount triggered, 50/50 split applied |
| Handler A has SENT invoice from current term | Household discount triggered, 50/50 split applied |
| No household enrollments at all | No discount - standard invoice created |

---

## Expected Result

**Your test case (Dean & Duncan):**

When Duncan enrolls in Yoga after Dean enrolled in Puppy Class:
1. System checks for household enrollments
2. Finds Dean's bookings, but the old ones have PAID invoices
3. Only considers Dean's DRAFT invoice from Puppy Class enrollment
4. If Dean's Puppy Class invoice is still DRAFT → 50/50 rebalancing applies
5. If Dean's Puppy Class invoice is already PAID → No discount (treats as no eligible enrollment)

This ensures the system only rebalances invoices that can actually be modified.

