

# Fix: Amended Invoices Create Duplicates on IO Instead of Replacing

## Problem

When Ady edits an already-synced invoice (e.g. correcting Sophie Theodorou's amount), the local DB updates correctly. But IO documents are **write-once** — they cannot be modified via API. The edge function's idempotency check sees `io_document_id` already exists and skips the sync, so IO keeps the old (wrong) document. If sync is forced somehow, it creates a second document instead of replacing.

## Solution

When an invoice is updated locally AND it was already synced to IO:
1. **Credit-note the old IO document** (reverses it in IO's ledger)
2. **Clear all IO sync fields** on the local invoice record
3. The next time the invoice is emailed/paid, the normal sync flow creates a fresh IO document with the correct amounts

## Implementation

### File 1: `src/hooks/invoices/mutations/useUpdateInvoice.ts`

After the invoice update succeeds (line 94), check if the invoice was previously synced to IO. If so:

```typescript
// After successful update, check if invoice was synced to IO
if (updatedInvoice.io_document_id) {
  console.log("[IO Sync] Invoice was synced to IO, issuing credit note and clearing sync fields...");
  
  // Issue credit note for old IO document (fire-and-forget, don't block)
  try {
    await issueCreditNote(invoiceId);
  } catch (err) {
    console.warn("[IO Sync] Credit note failed (non-blocking):", err);
  }
  
  // Clear IO sync fields so next sync creates a fresh document
  await supabase
    .from('invoices')
    .update({
      io_document_id: null,
      io_invoice_number: null,
      io_invoice_url: null,
      io_sync_status: null,
      io_synced_at: null,
      io_sync_error: null,
      io_client_id: null,
      io_payment_id: null,
      io_payment_url: null,
    })
    .eq('id', invoiceId);
}
```

- Import `issueCreditNote` from `useIOSync`
- Add `io_document_id` to the `.select('*')` response (already there via `select('*')`)

### File 2: `src/hooks/invoices/mutations/useUpdateInvoice.ts` — onSuccess toast

Update the success toast to mention IO will be re-synced if applicable:
```typescript
toast.success("Invoice updated successfully");
// The IO re-sync happens automatically on next email/pay action
```

### No edge function changes needed

The existing edge function logic is correct — once `io_document_id` is cleared, the next sync will create a new document as expected.

## Impact
- Editing a synced invoice → old IO doc gets credit-noted, sync fields cleared
- Next email/pay action → fresh IO document created with correct amounts
- Editing an un-synced invoice → no change (no IO fields to clear)
- Paid invoices that are edited → credit note on old, re-sync on next action

## Files Changed
1. `src/hooks/invoices/mutations/useUpdateInvoice.ts` — add IO credit note + clear sync fields (~15 lines)

