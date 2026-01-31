
# Fix Email Invoice Workflow Issues

## Issues Found

After investigating the logs, database, and code, I found three main issues:

### Issue 1: Email Preview Dialog Not Opening After Sync

**What's happening**: The IO sync completes successfully (logs show invoice synced, PDF fetched at 424KB), but the preview dialog never opens. The user sees a quick flash then a toast saying "Synced to IO" but no email composition screen.

**Root cause**: Looking at `EmailInvoiceProgressDialog.tsx`, the flow is:
1. `syncAndGetPDF()` runs and succeeds
2. `onReady(pdfBase64)` should be called
3. In `InvoiceBasicActions.tsx`, `handlePdfReady()` should close progress dialog and open preview dialog

The issue is likely that errors or unhandled promise rejections are occurring silently. The dialog may also be closing due to a state reset before the preview opens.

**Fix**: Add better error handling and ensure state transitions are synchronous.

---

### Issue 2: Invoice Date Shows Today's Date in IO (Not Invoice Date)

**What's happening**: Despite sending `InvoiceDate: 2026-02-06`, IO created the invoice with date `31-01` (January 31st, today).

**Root cause**: Looking at the edge function logs:
```
Using invoice date: 2026-02-06
```

We ARE sending the correct date, but looking at line 236 in the edge function:
```typescript
InvoiceDate: invoiceDate, // Pass the correct invoice date
```

The issue might be with IO's API - it may require a different date format or parameter name. We need to investigate whether IO accepts `InvoiceDate` or requires something else.

**Fix**: Research the IO API requirements for the date parameter. Try different formats if needed.

---

### Issue 3: Missing `io_payment_url` in Edge Function SELECT Query

**What's happening**: When trying to fetch a payment PDF, the `get_payment_pdf` action checks for `invoice.io_payment_url` (line 626), but the SELECT query (lines 523-555) doesn't include `io_payment_url` in the fields.

**Current SELECT** (missing `io_payment_url`):
```sql
io_client_id,
io_document_id,
io_sync_status,
io_invoice_url,  -- ← Only this is selected
```

**Fix**: Add `io_payment_url` to the SELECT query in the edge function.

---

## Implementation Plan

### File 1: `supabase/functions/sync-invoice-to-io/index.ts`

**Change 1**: Add `io_payment_url` to the SELECT query (around line 540):
```typescript
io_invoice_url,
io_payment_url,  // ADD THIS LINE
clients!inner (
```

**Change 2**: Investigate the IO API date format. Currently we send:
```typescript
InvoiceDate: invoiceDate  // format: 2026-02-06
```
We may need to try different formats or check IO documentation.

---

### File 2: `src/components/invoices/dialogs/EmailInvoiceProgressDialog.tsx`

**Changes**:
- Add better logging to track where the flow breaks
- Ensure `onReady` callback is called with proper error handling
- Add a small delay before closing to ensure state propagates

```typescript
if (result.success) {
  if (result.useLocalPdf) {
    setStepMessage("Generating local PDF...");
    try {
      const localPdf = await getInvoiceAsBase64(invoice);
      console.log('[EmailProgress] Local PDF generated, calling onReady...');
      setStatus("success");
      setTimeout(() => {
        onReady(localPdf);
      }, 500);
    } catch (pdfErr) {
      console.error('[EmailProgress] Local PDF error:', pdfErr);
      setStatus("error");
      setErrorMessage(`Failed to generate local PDF: ${String(pdfErr)}`);
    }
  } else if (result.pdfBase64) {
    console.log('[EmailProgress] IO PDF received, calling onReady...');
    setStatus("success");
    setTimeout(() => {
      onReady(result.pdfBase64!);
    }, 500);
  } else {
    // This shouldn't happen with the new strict mode
    console.error('[EmailProgress] No PDF in result');
    setStatus("error");
    setErrorMessage("No PDF available from InvoicesOnline.");
  }
}
```

---

### File 3: `src/components/invoices/table/actions/InvoiceBasicActions.tsx`

**Changes**:
- Add logging to `handlePdfReady` to trace the flow
- Ensure dialog state transitions properly

```typescript
const handlePdfReady = (pdfBase64: string | undefined) => {
  console.log('[InvoiceActions] PDF ready, transitioning to preview dialog...');
  console.log('[InvoiceActions] PDF size:', pdfBase64?.length || 0);
  setPreparedPdfBase64(pdfBase64);
  setEmailProgressOpen(false);
  // Small delay to ensure state clears before opening new dialog
  setTimeout(() => {
    setEmailPreviewOpen(true);
  }, 100);
};
```

---

## Summary of Changes

| File | Issue | Fix |
|------|-------|-----|
| `sync-invoice-to-io/index.ts` | Missing `io_payment_url` in SELECT | Add to query fields |
| `sync-invoice-to-io/index.ts` | IO ignoring InvoiceDate | Investigate IO API format |
| `EmailInvoiceProgressDialog.tsx` | Silent failures, no logging | Add console logs for debugging |
| `InvoiceBasicActions.tsx` | Dialog transition race condition | Add logging and setTimeout delay |

## Testing After Fix

1. Click "Email Invoice" on a draft invoice
2. Should see progress dialog with steps completing
3. After ~3-5 seconds, preview dialog should open with email composer
4. Check console for log messages tracing the flow
5. Verify invoice date in IO matches local invoice date

## IO Date Issue Investigation

This may require separate investigation. Options to try:
- Different date format: `06-02-2026` or `06/02/2026`
- Different parameter name: `invoice_date` instead of `InvoiceDate`
- Check if IO has timezone handling issues
