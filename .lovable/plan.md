

# Fix: Memory Limit Exceeded When Processing Full PDF

## Root Cause

The PDF is 12.5 MB. Base64 encoding inflates this to ~16.6 MB. Combined with the edge function's own runtime overhead, this exceeds the memory limit. The logs confirm:

```
PDF size: 12487184
Memory limit exceeded
```

## Solution: Use Signed URL Instead of Base64

Instead of downloading the PDF, converting to base64, and embedding it in the request body, we should pass a **signed URL** to the AI model. The Lovable AI Gateway (backed by Gemini) can fetch the PDF directly from the URL, keeping edge function memory usage minimal.

### Changes (1 file)

**`supabase/functions/extract-enrollment-scan/index.ts`**

Replace the PDF handling block. Instead of downloading the file and base64-encoding it, generate a signed URL (same approach already used for images) and pass that as the `image_url`:

- Remove the PDF download + base64 conversion block
- For PDFs, create a signed URL (e.g., 5 minutes expiry) just like the image path already does
- Pass the signed URL in the `image_url` content block

This unifies the PDF and image paths into a single approach: signed URL for both.

### Fallback

If the signed URL approach does not work for PDFs through the gateway (some models require base64 for PDFs), we will fall back to re-introducing `pdf-lib` to split the PDF into individual pages and send each page as a separate, smaller base64 content block. This keeps each chunk well within memory limits while still letting the AI see all pages.

### No Other Changes Needed

- The prompt already instructs the AI to scan all pages and find the form -- no prompt changes required.
- No frontend changes needed.

