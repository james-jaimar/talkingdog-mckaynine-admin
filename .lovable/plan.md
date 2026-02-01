
# Fix: Duplicate Invoice Creation in InvoicesOnline

## Problem Summary

When you email an invoice that was already synced to IO, the system creates a **duplicate invoice** in InvoicesOnline:
- Invoice #236 was already synced to IO
- You clicked "Email Invoice" which correctly fetched PDF from #236
- After sending, the system called `markAsSent()` which triggered **another** IO sync
- This created a new invoice #237 in IO (duplicate!)

## Root Cause

Two places in the code trigger IO sync without checking if the invoice is already synced:

### 1. `useMarkInvoiceAsSent.ts` (line 61)
```javascript
// Trigger IO sync in background (don't await - fire and forget)
syncInvoiceToIO(updatedInvoice.id, 'invoice').catch(err => {
  console.error('[IO Sync] Background sync error:', err);
});
```
This runs **unconditionally** after marking an invoice as sent, even if it was already synced to IO.

### 2. Edge Function `sync-invoice-to-io/index.ts` (line 719-720)
```javascript
if (action === "invoice") {
  const result = await createIOInvoice(credentials, ioClientId, invoiceData);
```
This creates a new invoice without checking if `io_document_id` already exists.

## Solution

Fix both the frontend hook AND the edge function to prevent duplicate syncs:

### Change 1: Update `useMarkInvoiceAsSent.ts`

Only trigger IO sync if the invoice is NOT already synced (no `io_document_id`):

```javascript
onSuccess: (updatedInvoice) => {
  // Invalidate queries...
  
  // Only trigger IO sync if not already synced
  // Invoice data from the mutation result may not include io_document_id
  // so we need to check the original invoice or fetch fresh data
  supabase
    .from('invoices')
    .select('io_document_id')
    .eq('id', updatedInvoice.id)
    .single()
    .then(({ data }) => {
      if (!data?.io_document_id) {
        syncInvoiceToIO(updatedInvoice.id, 'invoice').catch(err => {
          console.error('[IO Sync] Background sync error:', err);
        });
      } else {
        console.log('[IO Sync] Invoice already synced, skipping re-sync');
      }
    });
  
  onSuccess?.();
  toast.success("Invoice marked as sent successfully.");
}
```

### Change 2: Update Edge Function `sync-invoice-to-io/index.ts`

Add an idempotency check at the start of the `invoice` action handler:

```javascript
// Handle invoice sync
if (action === "invoice") {
  // IDEMPOTENCY CHECK: If already synced, return existing data
  if (invoice.io_document_id && invoice.io_invoice_url) {
    console.log(`Invoice already synced to IO: ${invoice.io_document_id}`);
    return new Response(
      JSON.stringify({ 
        success: true, 
        action: "invoice",
        already_synced: true,
        io_document_id: invoice.io_document_id,
        io_invoice_number: invoice.io_invoice_number,
        io_invoice_url: invoice.io_invoice_url,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  const result = await createIOInvoice(credentials, ioClientId, invoiceData);
  // ... rest of handler
}
```

## About the Invoice Number Mismatch

This is separate from the duplicate issue. The numbering systems work differently:

| System | Format | Example |
|--------|--------|---------|
| McKaynine | Branch + YYMM + Sequential | INV-McD-2502-0004 |
| InvoicesOnline | Prefix + IO Sequential | McD-2502-237 |

The IO sequential number (237, 238, etc.) is managed by IO's own counter, not by McKaynine. This means:
- McKaynine might have invoice #4 for February (INV-McD-2502-0004)
- IO might assign it #237 (McD-2502-237) based on IO's global counter

This is expected behaviour unless you want IO to use McKaynine's exact numbering, which would require a different API approach (custom invoice number override). Let me know if you want me to investigate that as a follow-up.

## Files to Modify

1. **`src/hooks/invoices/status/useMarkInvoiceAsSent.ts`**
   - Add check for existing `io_document_id` before triggering sync

2. **`supabase/functions/sync-invoice-to-io/index.ts`**
   - Add idempotency check at start of `invoice` action handler
   - Return existing sync data if already synced

## Testing Checklist

1. Find an invoice that has never been synced to IO
2. Email it → should sync to IO and create new IO invoice
3. Email it again → should NOT create duplicate, should reuse existing IO invoice
4. Check IO dashboard → no new duplicates created
5. Mark a previously-synced invoice as "Sent" → should not create duplicate

## Summary

This is a straightforward idempotency fix - the system should check "is this already synced?" before creating a new invoice in IO. Both the frontend hook and the edge function need this guard to be bulletproof.
