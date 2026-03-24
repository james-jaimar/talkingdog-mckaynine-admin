

# Fix: Corrupted PDF Attachments From InvoicesOnline

## Problem

When the edge function fetches a PDF from IO via `io_invoice_url`, it blindly encodes whatever the URL returns into base64 — no content-type validation. If IO returns an HTML page (login redirect, session timeout, error page), that HTML gets stored as the "PDF" attachment in the email queue. When Ady downloads it, Adobe can't open it because it's HTML, not a PDF.

## Root Cause

`fetchIOPDF()` in `supabase/functions/sync-invoice-to-io/index.ts` (line 558-584):
- Fetches the URL
- Logs the content-type but never validates it
- Converts whatever bytes come back to base64
- Returns it as `pdfBase64`

No check that the response is actually `application/pdf`.

## Fix

### File 1: `supabase/functions/sync-invoice-to-io/index.ts` (line 570-575)

Add content-type validation after the fetch:

```typescript
const contentType = response.headers.get("content-type");
console.log(`PDF response content-type: ${contentType}`);

// Validate we actually got a PDF, not an HTML error page
if (!contentType || !contentType.includes("application/pdf")) {
  // Read first bytes to check for PDF magic number (%PDF)
  const arrayBuffer = await response.arrayBuffer();
  const header = new TextDecoder().decode(new Uint8Array(arrayBuffer).slice(0, 5));
  if (!header.startsWith("%PDF")) {
    return { 
      success: false, 
      error: `IO returned non-PDF content (${contentType || 'unknown'}). The invoice URL may have expired.` 
    };
  }
  // Has PDF magic number despite wrong content-type — proceed
  const uint8Array = new Uint8Array(arrayBuffer);
  const pdfBase64 = base64Encode(uint8Array);
  return { success: true, pdfBase64 };
}

const arrayBuffer = await response.arrayBuffer();
const uint8Array = new Uint8Array(arrayBuffer);
const pdfBase64 = base64Encode(uint8Array);
```

This ensures corrupted/HTML content never gets stored as a PDF attachment.

### File 2: Redeploy the edge function

After modifying the edge function, it must be redeployed for the fix to take effect.

## Files Changed
1. `supabase/functions/sync-invoice-to-io/index.ts` — add PDF content validation (~10 lines)
2. Edge function redeployment required

