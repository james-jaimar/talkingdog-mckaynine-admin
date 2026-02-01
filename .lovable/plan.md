
# Simplify: Skip IO Reversal for Paid Invoices

## The Problem
InvoicesOnline's accounting is broken - the Payout + Credit Note reversal doesn't actually zero the balance. Since IO is only used for generating PDFs (not accounting), we shouldn't waste time trying to fix their balance.

## New Approach

**When deleting an invoice synced to IO:**

| Invoice Status | Action in IO |
|---------------|--------------|
| **Unpaid** | Issue Credit Note (to cancel the invoice in IO) |
| **Paid** | **Do nothing** - just delete locally |

## Why This Makes Sense
- McKaynine is the source of truth for accounting, not IO
- IO is only used to generate official invoice PDFs and payment receipts
- IO's reversal mechanism is broken anyway
- Less API calls = faster deletions

## Changes Required

### 1. `src/hooks/invoices/mutations/useDeleteInvoice.ts`
Remove the `reversePaidInvoice()` call for paid invoices:

```typescript
if (invoice?.io_document_id) {
  const isPaid = invoice.status === 'paid' || invoice.payment_received === true;
  
  if (isPaid) {
    // SIMPLIFIED: Don't try to reverse in IO - their accounting is broken
    // Just log and continue with local deletion
    console.log('[Delete] Paid invoice synced to IO - skipping IO reversal (not used for accounting)');
    ioActionTaken = 'skipped';
  } else {
    // Not paid - issue credit note to cancel the invoice in IO
    console.log('[Delete] Invoice synced to IO (not paid), issuing credit note...');
    const creditResult = await issueCreditNote(invoiceId);
    // ... existing credit note logic
  }
}
```

### 2. Update Toast Messages
- For paid invoices: "Invoice deleted successfully" (no IO mention)
- For unpaid invoices: "Invoice deleted successfully" + "Credit note issued in InvoicesOnline"

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/invoices/mutations/useDeleteInvoice.ts` | Remove `reversePaidInvoice()` call, skip IO for paid invoices |

## Optional Cleanup (Can Do Later)
- Remove `reversePaidInvoice()` from `useIOSync.ts`
- Remove `reverse_paid_invoice` action from edge function
- Remove `createIOPayout()` from edge function

These can stay for now since they're not hurting anything - we just won't call them.

## Testing
1. Find a paid invoice that's synced to IO
2. Delete it
3. Should delete immediately without any IO API calls
4. Check IO - nothing should be created (no payout, no credit note)
