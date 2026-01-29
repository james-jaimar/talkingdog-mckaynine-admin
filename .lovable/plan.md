
# Fix IO Sync - CORS Headers Issue

## Problem Identified

The edge function `sync-invoice-to-io` is returning **401 Unauthorized** because the `Authorization` header is not reaching the function. This is caused by incomplete CORS headers.

**Evidence:**
- Edge function was called at 05:02 AM today
- Returned 401 status code
- No internal logs were generated (meaning it fails at the auth check before any console.log)
- The auth check at line 340 fails because `authHeader` is null/undefined

## Root Cause

Current CORS headers:
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};
```

The Supabase JS client sends additional headers that are not included, causing the CORS preflight to fail and the `Authorization` header to be stripped.

## Solution

Update the CORS headers to include all headers sent by the Supabase JS client:

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};
```

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/sync-invoice-to-io/index.ts` | Update `corsHeaders` on lines 3-7 to include all required Supabase client headers |

## After Fix

1. Re-deploy the edge function
2. Create a new test invoice for `jimmybhawkins@gmail.com`
3. Verify the IO sync succeeds and `io_invoice_url` is populated

## Technical Details

When a browser makes a cross-origin request with custom headers (like `Authorization`), it first sends a preflight OPTIONS request. If the server doesn't acknowledge all the headers being sent in `Access-Control-Allow-Headers`, the browser will either:
- Strip those headers from the actual request
- Block the request entirely

By adding the missing Supabase-specific headers, the preflight will succeed and the `Authorization` header will be included in the actual POST request.
