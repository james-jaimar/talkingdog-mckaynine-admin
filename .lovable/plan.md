
# Fix IO Invoice Response Parsing

## Problem Identified

The InvoicesOnline API **successfully created the invoice** (Invoice 235), but our edge function failed to parse the success response correctly, causing it to return a 500 error despite the invoice being created in IO.

### Evidence from Logs

**IO API Response (actual):**
```json
[
  {"type":"success","message":"Invoice 235 generated successfully."},
  {"url":"https://www.invoicesonline.co.za/scripts/Download.php?type=invoice&id=2651087...",
   "invoice_nr":235,
   "document_nr":235,
   "document_id":"2651087",
   "email_url":"..."}
]
```

**Current code expects:** A single object with `document_id` at root level
**Actual response:** An array where index 1 contains the document details

### Root Cause

In `supabase/functions/sync-invoice-to-io/index.ts`, the `createIOInvoice` function (lines 212-228) checks:
```typescript
if (r.document_id || r.invoice_nr) { ... }
```

But since `result` is an array, `r.document_id` is undefined, so it falls through to return the "Unexpected response" error.

## Solution

Update the response parsing to handle the array format:

```typescript
// Check for success response - IO returns an array with status and document info
if (Array.isArray(result) && result.length >= 2) {
  const docInfo = result[1] as Record<string, unknown>;
  if (docInfo.document_id || docInfo.invoice_nr) {
    return {
      success: true,
      documentId: String(docInfo.document_id || ""),
      invoiceNumber: String(docInfo.invoice_nr || docInfo.document_nr || ""),
      url: String(docInfo.url || ""),
    };
  }
}

// Also keep the original object check as fallback
if (typeof result === "object" && result !== null && !Array.isArray(result)) {
  const r = result as Record<string, unknown>;
  if (r.document_id || r.invoice_nr) {
    return {
      success: true,
      documentId: String(r.document_id || ""),
      invoiceNumber: String(r.invoice_nr || r.document_nr || ""),
      url: String(r.url || ""),
    };
  }
  if (r.error) {
    return { success: false, error: String(r.error) };
  }
}
```

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/sync-invoice-to-io/index.ts` | Update `createIOInvoice` function (lines 212-228) to handle array response format from IO API |

## After Fix

1. Re-deploy the edge function
2. Create a new test invoice for `jimmybhawkins@gmail.com`
3. Verify:
   - Invoice syncs successfully (no error toast)
   - `io_sync_status` = "synced" in database
   - `io_invoice_url` is populated with the PDF download link
   - Invoice appears in InvoicesOnline dashboard

## Note

The invoice `INV-McD-2602-0004` was actually created in IO as Invoice 235. The only issue was our code failing to recognize the success response.
