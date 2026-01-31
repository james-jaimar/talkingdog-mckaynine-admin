
# Add IO Payment Receipt PDF to Payment Workflow

## Problem Summary

There are two gaps in the current Mark as Paid workflow:

1. **Payment sync requires invoice to be synced first** - If someone marks as paid before emailing, the IO payment sync fails silently
2. **No IO payment receipt PDF** - We generate our own receipt email, but don't fetch or attach the official IO payment receipt PDF

## Current vs Desired Workflow

```text
CURRENT:
Mark as Paid clicked
    │
    ├── Update local DB (status: paid)
    ├── Fire-and-forget IO payment sync (often fails if not synced)
    └── Queue local payment receipt email (no PDF attachment)

DESIRED:
Mark as Paid clicked
    │
    ├── Update local DB (status: paid)
    ├── Check if invoice synced to IO
    │   └── If NOT synced: Sync invoice first, then sync payment
    │   └── If synced: Just sync payment
    ├── Fetch payment receipt PDF from io_payment_url
    └── Queue payment receipt email WITH IO PDF attached
```

## Implementation Plan

### 1. Add Payment Receipt PDF Fetch to Edge Function

Add a new action `get_payment_pdf` to `supabase/functions/sync-invoice-to-io/index.ts`:

```typescript
// Handle get_payment_pdf action - fetch payment receipt PDF from IO
if (action === "get_payment_pdf") {
  if (!invoice.io_payment_url) {
    return Response with error "Payment not synced to IO yet"
  }
  
  const pdfResult = await fetchIOPDF(invoice.io_payment_url);
  return Response with pdf_base64
}
```

### 2. Add Helper Functions to useIOSync.ts

Add new functions to handle the payment workflow:

```typescript
/**
 * Sync payment to IO - handles invoice sync if needed first
 */
export async function syncPaymentToIO(
  invoiceId: string
): Promise<{ success: boolean; error?: string; io_payment_url?: string }>

/**
 * Fetch payment receipt PDF from IO
 */
export async function fetchIOPaymentPDF(invoiceId: string): Promise<{
  success: boolean;
  pdfBase64?: string;
  error?: string;
}>
```

### 3. Update useMarkInvoiceAsPaid to Handle Full Workflow

Modify `src/hooks/invoices/status/useMarkInvoiceAsPaid.ts`:

```typescript
onSuccess: async (_, invoiceId) => {
  // Step 1: Check if IO offline mode
  const isOfflineMode = await getIOOfflineModeFromDB();
  
  if (!isOfflineMode) {
    // Step 2: Check if invoice already synced to IO
    const { data: invoice } = await supabase
      .from('invoices')
      .select('io_document_id')
      .eq('id', invoiceId)
      .single();
    
    // Step 3: If not synced, sync invoice first
    if (!invoice?.io_document_id) {
      const invoiceSyncResult = await syncInvoiceToIO(invoiceId, 'invoice');
      if (!invoiceSyncResult.success && !invoiceSyncResult.skipped) {
        console.error('[IO Sync] Invoice sync failed before payment');
      }
    }
    
    // Step 4: Now sync the payment
    const paymentResult = await syncInvoiceToIO(invoiceId, 'payment');
    
    // Step 5: If payment sync succeeded, fetch payment receipt PDF
    if (paymentResult.success && paymentResult.io_payment_url) {
      const pdfResult = await fetchIOPaymentPDF(invoiceId);
      if (pdfResult.success && pdfResult.pdfBase64) {
        // Store for email attachment or pass to email queue
      }
    }
  }
  
  // Rest of email queueing logic...
}
```

### 4. Update Payment Receipt Email to Include PDF Attachment

Modify `src/lib/email/generatePaymentReceipt.ts`:

```typescript
interface ReceiptEmailData {
  // ... existing fields
  attachments?: Array<{
    filename: string;
    content: string; // base64
    type: string;
  }>;
}
```

And update `generatePaymentReceiptEmails` to accept optional PDF:

```typescript
export async function generatePaymentReceiptEmails(
  invoiceId: string,
  paymentPdfBase64?: string // NEW: Optional IO PDF
): Promise<ReceiptEmailData[]>
```

### 5. Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/sync-invoice-to-io/index.ts` | Add `get_payment_pdf` action |
| `src/hooks/invoices/useIOSync.ts` | Add `fetchIOPaymentPDF()`, add `getIOOfflineModeFromDB()` export |
| `src/hooks/invoices/status/useMarkInvoiceAsPaid.ts` | Full IO workflow: check sync → sync invoice if needed → sync payment → fetch PDF |
| `src/lib/email/generatePaymentReceipt.ts` | Accept optional PDF attachment parameter |

### 6. Offline Mode Handling

When IO offline mode is enabled:
- Skip all IO operations
- Use existing local payment receipt email (no PDF)
- No changes to current behavior

When IO is online:
- Ensure invoice is synced first
- Sync payment
- Fetch payment PDF
- Attach to email

## Technical Notes

- The IO API returns `io_payment_url` when payment is recorded
- This URL points to the official payment receipt PDF
- We already have `fetchIOPDF()` function that works for any IO URL
- The email queue table has an `attachments` jsonb column ready to use

## Error Handling

- If invoice sync fails: Log warning, continue with local receipt (degraded mode)
- If payment sync fails: Log warning, continue with local receipt
- If PDF fetch fails: Log warning, send email without attachment
- In all cases: User still gets a receipt, just maybe without the official IO PDF
