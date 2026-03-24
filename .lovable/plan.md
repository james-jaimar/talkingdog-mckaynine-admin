

# Fix: IO PDF Fetch Fails Because No Authentication

## Problem

The `fetchIOPDF` function does a bare `fetch(invoiceUrl)` to IO's `Download.php` URLs with **no authentication**. IO requires an active session to serve PDFs. Without a session cookie, IO returns an HTML page (likely a login redirect). Our recently deployed validation correctly catches this and returns an error instead of corrupted data -- but the PDF still can't be fetched.

This affects both invoice PDFs and payment receipt PDFs for Randburg (and will affect Delta too).

## Root Cause

IO's `/scripts/Download.php` is a web-facing endpoint that requires a logged-in session (PHP session cookie). The IO *API* endpoints (`/api/*.php`) accept username/password in the POST body, but the download URLs don't.

## Fix

Modify `fetchIOPDF` to authenticate with IO first, then use the session cookie to fetch the PDF.

### File: `supabase/functions/sync-invoice-to-io/index.ts`

**1. Add an IO login function** that POSTs credentials to IO's login page and captures the `PHPSESSID` cookie:

```typescript
async function loginToIO(credentials: IOCredentials): Promise<string | null> {
  // POST to IO login to get session cookie
  const response = await fetch("https://www.invoicesonline.co.za/api/Login.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: credentials.username,
      password: credentials.password,
    }),
    redirect: "manual",
  });
  
  // Extract session cookie from Set-Cookie header
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    const match = setCookie.match(/PHPSESSID=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}
```

If the Login.php API endpoint doesn't set a cookie, we'll fall back to posting to the main login form URL. We can test this via `curl_edge_functions`.

**2. Update `fetchIOPDF` signature** to accept credentials:

```typescript
async function fetchIOPDF(
  invoiceUrl: string,
  credentials: IOCredentials
): Promise<{ success: boolean; pdfBase64?: string; error?: string }>
```

**3. Login before fetching**, then pass the cookie:

```typescript
const sessionId = await loginToIO(credentials);
const headers: Record<string, string> = {};
if (sessionId) {
  headers["Cookie"] = `PHPSESSID=${sessionId}`;
}
const response = await fetch(invoiceUrl, { headers });
```

**4. Update both call sites** (lines 797, 825) to pass credentials:

```typescript
const credentials = getIOCredentials(invoice.branch_id);
if (!credentials) {
  return new Response(
    JSON.stringify({ error: "No IO credentials for this branch" }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
const pdfResult = await fetchIOPDF(invoice.io_invoice_url, credentials);
```

### Deployment

Redeploy the edge function after changes. Test with the Francoise Harrison invoice to confirm PDFs return correctly.

## Technical Detail

- IO's API endpoints use username/password per-request (stateless)
- IO's Download.php uses PHP sessions (stateful) -- requires login first
- We'll try the API login endpoint first; if it doesn't set cookies, we'll try the web login form
- The existing PDF validation (`%PDF` magic number check) stays as a safety net

## Files Changed
1. `supabase/functions/sync-invoice-to-io/index.ts` -- add IO login, pass credentials to fetchIOPDF (~25 lines)
2. Edge function redeployment required

