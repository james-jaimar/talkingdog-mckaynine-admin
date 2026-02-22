

# Fix: PDF Extraction - Use Base64 Data URL for PDFs, Signed URL for Images

## Problem

The AI gateway (Google AI Studio) only accepts image URLs (PNG, JPEG, WebP, GIF). PDFs must be sent as **base64 data URLs** with the MIME type specified. The signed URL approach works for images but fails for PDFs with error: "Unsupported image format for URL."

## Solution

Split the handling back into two paths:
- **Images**: Keep using signed URLs (works fine)
- **PDFs**: Download the file and encode as a `data:application/pdf;base64,...` data URL

To address the previous memory issue (12.5 MB PDF), we will use a more efficient base64 encoding method that avoids creating massive intermediate strings.

### Changes (1 file)

**`supabase/functions/extract-enrollment-scan/index.ts`** (lines 158-173)

Replace the unified signed-URL block with:

```typescript
if (isPDF) {
  // PDFs must be sent as base64 data URLs - gateway doesn't support PDF via URL
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('scanned-forms')
    .download(file_url);

  if (downloadError || !fileData) {
    throw new Error(`Failed to download: ${downloadError?.message}`);
  }

  // Convert to base64 using ArrayBuffer (more memory-efficient)
  const bytes = new Uint8Array(await fileData.arrayBuffer());
  const chunkSize = 8192;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  modelFileUrl = `data:application/pdf;base64,${btoa(binary)}`;
  console.log("PDF converted to base64 data URL, size:", bytes.length);

} else if (isImage) {
  // Images work fine via signed URL
  const { data: signed, error: signedError } = await supabase.storage
    .from('scanned-forms')
    .createSignedUrl(file_url, 300);

  if (signedError || !signed?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${signedError?.message}`);
  }
  modelFileUrl = signed.signedUrl;
  console.log("Signed URL created for image");

} else {
  throw new Error(`Unsupported file type: ${file_url}`);
}
```

### Why This Should Work Now

The previous memory crash used `Array.from(bytes).map(b => String.fromCharCode(b)).join("")` which creates an array of 12.5 million single-character strings then joins them -- very memory-intensive. The chunked approach processes 8KB at a time using `subarray` views, dramatically reducing peak memory usage.

### No Other Changes Needed

- The prompt already handles multi-page scanning
- Frontend is unchanged
- Image handling continues to work via signed URLs

