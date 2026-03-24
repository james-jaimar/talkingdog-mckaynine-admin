

# Fix: IO PDF Fetch Broken by Invalid Login Cookie

## What Happened

Before our changes yesterday, `fetchIOPDF` did a simple `fetch(invoiceUrl)` with no headers. IO's `Download.php` URLs are self-authenticating via query parameters (`type`, `id`, `bid`, `did`) — no session cookie needed. **This worked perfectly.**

Our fix yesterday added a `loginToIO()` call that hits `/api/Login.php` — which **returns 404** (endpoint doesn't exist on IO). But PHP always sends a `Set-Cookie` header, even on 404 pages. Our code sees the cookie, considers login "successful", and sends this garbage `PHPSESSID` with the PDF request. IO's server sees the invalid session cookie, treats it as an expired/invalid session, and returns an HTML error page instead of the PDF.

**In short: we broke a working feature by adding unnecessary authentication that doesn't work.**

## Fix

Remove the `loginToIO` function entirely and revert `fetchIOPDF` to a simple fetch — but **keep the PDF validation** (the `%PDF` magic number check), which is genuinely valuable.

### File: `supabase/functions/sync-invoice-to-io/index.ts`

1. **Delete `loginToIO` function** (lines 557-591) — the endpoint doesn't exist
2. **Simplify `fetchIOPDF`** back to accepting just a URL (no credentials):

```typescript
async function fetchIOPDF(
  invoiceUrl: string
): Promise<{ success: boolean; pdfBase64?: string; error?: string }> {
  console.log(`Fetching PDF from IO URL: ${invoiceUrl}`);
  
  try {
    const response = await fetch(invoiceUrl);
    
    if (!response.ok) {
      return { success: false, error: `Failed to fetch PDF: ${response.status}` };
    }
    
    const contentType = response.headers.get("content-type");
    console.log(`PDF response content-type: ${contentType}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const header = new TextDecoder().decode(new Uint8Array(arrayBuffer).slice(0, 5));
    if (!header.startsWith("%PDF")) {
      console.error(`IO returned non-PDF content. Content-type: ${contentType}, header: ${header}`);
      return { success: false, error: `IO returned non-PDF content (${contentType || 'unknown'}).` };
    }
    
    const uint8Array = new Uint8Array(arrayBuffer);
    const pdfBase64 = base64Encode(uint8Array);
    console.log(`PDF fetched successfully, size: ${pdfBase64.length} chars`);
    return { success: true, pdfBase64 };
  } catch (error) {
    console.error(`Error fetching PDF: ${error.message}`);
    return { success: false, error: error.message };
  }
}
```

3. **Update call sites** (~lines 797, 825): remove credentials parameter, just pass URL:
```typescript
// Before: fetchIOPDF(invoice.io_invoice_url, credentials)
// After:  fetchIOPDF(invoice.io_invoice_url)
```

4. **Redeploy** the edge function.

## Impact
- PDF fetches revert to the simple approach that was working before
- PDF validation stays in place as a safety net
- No login attempt, no garbage cookies, no HTML responses

**1 file changed + redeploy.**

