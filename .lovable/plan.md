

# Sync Invoice to IO on Creation (Draft)

## Current vs Desired Flow

**Current Flow:**
```
Invoice Created (draft) → Mark as Sent → IO sync → PDF available
```

**Desired Flow:**
```
Invoice Created (draft) → IO sync immediately → PDF available → Can send to handler
```

## Changes Required

### 1. Modify `src/lib/invoices/createInvoiceUtils.ts`

Add IO sync trigger after successful invoice creation:

```typescript
// After line 163 (toast.success)
import { syncInvoiceToIO } from "@/hooks/invoices/useIOSync";

// ... after invoice and items created successfully ...

toast.success("Invoice created successfully");

// Trigger IO sync in background (fire and forget)
syncInvoiceToIO(invoice.id, 'invoice').catch(err => {
  console.error('[IO Sync] Background sync error on creation:', err);
});

return invoice;
```

### 2. Why This Works

- The sync runs in the background (doesn't block invoice creation)
- Works for draft invoices - IO will create the invoice regardless of local status
- PDF URL will be saved to `io_invoice_url` column for later use
- Test mode filter still applies - only syncs for `jimmybhawkins@gmail.com`

### 3. Keep Existing Triggers

The existing triggers in `useMarkInvoiceAsSent` and `useMarkInvoiceAsPaid` should remain as fallbacks:
- If invoice wasn't synced on creation (e.g., test mode skipped it), it will sync when marked sent
- Payment sync still triggers when marked paid

## Implementation Summary

| File | Change |
|------|--------|
| `src/lib/invoices/createInvoiceUtils.ts` | Add `syncInvoiceToIO` call after successful creation |

This is a minimal change - just adding one async call to trigger the background sync immediately when an invoice is created.

